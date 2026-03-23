const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { createOnboardingCaseFromTemplate } = require('../services/onboardingService');
const { sendWelcomeEmail } = require('../services/emailService');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

let employeeColumnsEnsured = false;

const ensureEmployeeColumns = async () => {
    if (employeeColumnsEnsured) return;

    await pool.query(`
        CREATE TABLE IF NOT EXISTS departments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT UNIQUE NOT NULL,
            description TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        ALTER TABLE employees ADD COLUMN IF NOT EXISTS pan TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_name TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS location TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS address TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS personal_email TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS emergency_contact TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS technology TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS experience_years NUMERIC;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS aadhaar_card TEXT;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES employees(id) ON DELETE SET NULL;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS department_id UUID;
        ALTER TABLE employees ADD COLUMN IF NOT EXISTS salary_revision_history_enabled BOOLEAN NOT NULL DEFAULT FALSE;

        DO $$ BEGIN
            IF NOT EXISTS (
                SELECT 1
                FROM information_schema.table_constraints
                WHERE constraint_name = 'employees_department_id_fkey'
                  AND table_name = 'employees'
            ) THEN
                ALTER TABLE employees
                ADD CONSTRAINT employees_department_id_fkey
                FOREIGN KEY (department_id) REFERENCES departments(id) ON DELETE SET NULL;
            END IF;
        END $$;

        UPDATE employees
        SET manager_id = reporting_manager_id
        WHERE manager_id IS NULL
          AND reporting_manager_id IS NOT NULL;

        UPDATE employees
        SET reporting_manager_id = manager_id
        WHERE reporting_manager_id IS NULL
          AND manager_id IS NOT NULL;

    `);

    employeeColumnsEnsured = true;
};

// ─── Get all employees ───────────────────────────────────────────
const getEmployees = async (req, res) => {
    try {
        await ensureEmployeeColumns();
        const rawManagerId = req.query.manager_id || null;
        let managerIdFilter = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(rawManagerId || '')
            ? rawManagerId
            : null;

        // Backend-only visibility rule: HR users can only fetch employees who report to them.
        if (req.user?.role === 'hr') {
            managerIdFilter = req.user?.employee_uuid || null;
        }

        const includeSelf = String(req.query.include_self || '').toLowerCase() === 'true';
        const employees = await pool.query(
            `SELECT e.*, 
                    COALESCE(d.name, e.department, 'Unassigned') AS department,
                    d.name AS department_name,
                    d.id AS department_id,
                    COALESCE(e.manager_id, e.reporting_manager_id) AS manager_id,
                    m.full_name AS manager_name,
                    p.role AS account_role
             FROM employees e
             LEFT JOIN departments d ON d.id = e.department_id
             LEFT JOIN employees m ON m.id = COALESCE(e.manager_id, e.reporting_manager_id)
             LEFT JOIN profiles p ON p.employee_id = e.id::text OR p.email = e.email
             WHERE (
                $1::uuid IS NULL
                OR COALESCE(e.manager_id, e.reporting_manager_id) = $1::uuid
                OR ($2::boolean = TRUE AND e.id = $1::uuid)
             )
             ORDER BY e.created_at DESC`,
            [managerIdFilter, includeSelf]
        );
        res.json(employees.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get HR accounts (admin only) ──────────────────────────────
const getHrAccounts = async (req, res) => {
    try {
        await ensureEmployeeColumns();

        const result = await pool.query(
            `SELECT e.id,
                    e.full_name,
                    e.email,
                    e.joining_date,
                    e.department,
                    e.created_at,
                    e.status,
                    p.role AS account_role
             FROM employees e
             JOIN profiles p ON (p.employee_id = e.id::text OR p.email = e.email)
             WHERE p.role = 'hr'
             ORDER BY e.created_at DESC`
        );

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get dashboard stats for logged-in employee ──────────────────
const getDashboardStats = async (req, res) => {
    const employeeId = req.user.employee_uuid || req.user.employee_id;
    if (!employeeId) {
        return res.status(404).json({ error: 'Employee profile not linked to this user' });
    }

    try {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidRegex.test(employeeId)) {
            return res.json({
                attendanceCount: 0,
                leavesCount: 0,
                projects: []
            });
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const attendance = await pool.query(
            `SELECT COUNT(*) FROM attendance 
             WHERE employee_id = $1 
             AND EXTRACT(MONTH FROM check_in) = $2 
             AND EXTRACT(YEAR FROM check_in) = $3`,
            [employeeId, month, year]
        );

        const leaves = await pool.query(
            `SELECT COUNT(*) FROM leaves 
             WHERE employee_id = $1 
             AND status = 'Approved'
             AND (EXTRACT(MONTH FROM start_date) = $2 OR EXTRACT(MONTH FROM end_date) = $2)
             AND (EXTRACT(YEAR FROM start_date) = $3 OR EXTRACT(YEAR FROM end_date) = $3)`,
            [employeeId, month, year]
        );

        const projects = await pool.query(
            `SELECT p.name, p.status, p.progress 
             FROM projects p 
             JOIN project_members pm ON p.id = pm.project_id 
             WHERE pm.employee_id = $1 AND p.status = 'Active'
             ORDER BY p.created_at DESC`,
            [employeeId]
        );

        const celebrations = await pool.query(
            `SELECT celebration_type, years_count
             FROM (
                SELECT 'birthday'::text AS celebration_type,
                       EXTRACT(YEAR FROM AGE(CURRENT_DATE, dob::date))::int AS years_count
                FROM employees
                WHERE id = $1
                  AND status = 'Active'
                  AND dob IS NOT NULL
                  AND EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(DAY FROM dob) = EXTRACT(DAY FROM CURRENT_DATE)

                UNION ALL

                SELECT 'work_anniversary'::text AS celebration_type,
                       EXTRACT(YEAR FROM AGE(CURRENT_DATE, joining_date::date))::int AS years_count
                FROM employees
                WHERE id = $1
                  AND status = 'Active'
                  AND joining_date IS NOT NULL
                  AND EXTRACT(MONTH FROM joining_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                  AND EXTRACT(DAY FROM joining_date) = EXTRACT(DAY FROM CURRENT_DATE)
                  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, joining_date::date)) >= 1
             ) c`,
            [employeeId]
        );

        const hasBirthdayToday = celebrations.rows.some((c) => c.celebration_type === 'birthday');
        const hasWorkAnniversaryToday = celebrations.rows.some((c) => c.celebration_type === 'work_anniversary');

        res.json({
            attendanceCount: parseInt(attendance.rows[0].count),
            leavesCount: parseInt(leaves.rows[0].count),
            projects: projects.rows,
            celebrationsToday: celebrations.rows,
            hasBirthdayToday,
            hasWorkAnniversaryToday
        });
    } catch (err) {
        console.error('[Dashboard Stats Error]:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get employee by ID ──────────────────────────────────────────
const getEmployeeById = async (req, res) => {
    try {
        await ensureEmployeeColumns();
        const { id } = req.params;
        const result = await pool.query(
            `SELECT e.*, 
                    COALESCE(d.name, e.department, 'Unassigned') AS department,
                    d.name AS department_name,
                    d.id AS department_id,
                    COALESCE(e.manager_id, e.reporting_manager_id) AS manager_id,
                    m.full_name AS manager_name
             FROM employees e
             LEFT JOIN departments d ON d.id = e.department_id
             LEFT JOIN employees m ON m.id = COALESCE(e.manager_id, e.reporting_manager_id)
             WHERE e.id::text = $1 OR e.employee_id = $1
             LIMIT 1`,
            [id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Create employee (HR only) ──────────────────────────────────
const createEmployee = async (req, res) => {
    const {
        full_name, email, role, department, phone, joining_date, salary,
        employee_id, designation, location, pan, bank_account, bank_name,
        personal_email, emergency_contact, technology, experience_years,
        aadhaar_card, adhar_card, pan_card,
        onboarding_template_id, department_id, manager_id, reporting_manager_id,
        account_role
    } = req.body;
    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : null;
    const client = await pool.connect();

    try {
        await ensureEmployeeColumns();
        await client.query('BEGIN');

        const incomingSalary = Number(salary);
        if (!Number.isFinite(incomingSalary) || incomingSalary <= 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Valid annual salary is required' });
        }
        const normalizedSalary = incomingSalary;
        const parsedExperience = Number(experience_years);
        const normalizedExperienceYears = Number.isFinite(parsedExperience) ? parsedExperience : null;
        const nextManagerId = manager_id || reporting_manager_id || null;
        const requestedAccountRole = String(account_role || '').toLowerCase();

        if (requestedAccountRole === 'hr' && req.user?.role !== 'admin') {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Only admins can create HR accounts' });
        }

        const profileRole = req.user?.role === 'admin' && ['hr', 'employee'].includes(requestedAccountRole)
            ? requestedAccountRole
            : 'employee';

        const effectiveManagerId = profileRole === 'hr'
            ? null
            : (req.user?.role === 'hr' ? (req.user?.employee_uuid || nextManagerId) : nextManagerId);

        if (effectiveManagerId) {
            const managerCheck = await client.query('SELECT id FROM employees WHERE id = $1', [effectiveManagerId]);
            if (managerCheck.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Reporting manager not found' });
            }
        }

        let departmentIdValue = null;
        let departmentNameValue = department || 'Unassigned';
        if (department_id) {
            const dep = await client.query('SELECT id, name FROM departments WHERE id = $1', [department_id]);
            if (dep.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Department not found' });
            }
            departmentIdValue = dep.rows[0].id;
            departmentNameValue = dep.rows[0].name;
        }

        const existingEmailCheck = await client.query(
            `SELECT email FROM profiles WHERE email = $1 UNION SELECT email FROM employees WHERE email = $1`,
            [email]
        );
        if (existingEmailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already exists in the system' });
        }

        const newEmployee = await client.query(
            `INSERT INTO employees
             (full_name, email, role, department, department_id, manager_id, reporting_manager_id, phone, joining_date, salary, avatar_url, employee_id, designation, location, pan, bank_account, bank_name, personal_email, emergency_contact, technology, experience_years, aadhaar_card)
             VALUES ($1, $2, $3, $4, $5, $6, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
             RETURNING *`,
            [
                full_name, email, role, departmentNameValue, departmentIdValue, effectiveManagerId,
                phone, joining_date, normalizedSalary, avatar_url,
                employee_id || null, designation || role || null, location || null,
                pan || pan_card || null, bank_account || null, bank_name || null,
                personal_email || null, emergency_contact || null, technology || null,
                normalizedExperienceYears,
                aadhaar_card || adhar_card || null
            ]
        );

        const tempPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tempPassword, salt);

        const profileResult = await client.query(
            'INSERT INTO profiles (email, password_hash, role, employee_id, is_first_login, status) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, email',
            [email, hash, profileRole, newEmployee.rows[0].id, true, 'active']
        );
        const profile = profileResult.rows[0];

        // Create a password reset link so employee can set a new password immediately.
        const resetToken = crypto.randomUUID();
        const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await client.query('UPDATE password_reset_tokens SET used = TRUE WHERE profile_id = $1', [profile.id]);
        await client.query(
            'INSERT INTO password_reset_tokens (profile_id, token, expires_at) VALUES ($1, $2, $3)',
            [profile.id, resetToken, resetExpiresAt]
        );

        if (onboarding_template_id) {
            await createOnboardingCaseFromTemplate({
                client,
                employeeId: newEmployee.rows[0].id,
                templateId: onboarding_template_id,
                assignedBy: req.user?.employee_uuid || null
            });
        }

        await client.query('COMMIT');

        let credentialEmailSent = true;
        try {
            const resetBase = process.env.CLIENT_URL || 'http://localhost:5173';
            const resetLink = `${resetBase.replace(/\/$/, '')}/reset-password?token=${resetToken}`;
            await sendWelcomeEmail({
                to: email,
                name: full_name,
                email,
                password: tempPassword,
                role: profileRole === 'hr' ? 'HR' : (role || designation || 'Employee'),
                resetLink
            });
        } catch (emailErr) {
            credentialEmailSent = false;
            console.warn('[Email] Welcome credentials email failed:', emailErr.message);
        }

        res.json({
            ...newEmployee.rows[0],
            credential_email_sent: credentialEmailSent
        });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    } finally {
        client.release();
    }
};

// ─── Update employee (HR only) ──────────────────────────────────
const updateEmployee = async (req, res) => {
    const {
        full_name, email, role, department, phone, joining_date, salary,
        employee_id, designation, location, pan, bank_account, bank_name,
        personal_email, emergency_contact, technology, experience_years,
        aadhaar_card, adhar_card, pan_card,
        department_id, manager_id, reporting_manager_id
    } = req.body;
    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    try {
        await ensureEmployeeColumns();

        const incomingSalary = Number(salary);
        if (!Number.isFinite(incomingSalary) || incomingSalary <= 0) {
            return res.status(400).json({ error: 'Valid annual salary is required' });
        }
        const normalizedSalary = incomingSalary;
        const parsedExperience = Number(experience_years);
        const normalizedExperienceYears = Number.isFinite(parsedExperience) ? parsedExperience : null;
        const nextManagerId = manager_id || reporting_manager_id || null;

        if (nextManagerId && nextManagerId === req.params.id) {
            return res.status(400).json({ error: 'Employee cannot report to self' });
        }

        if (nextManagerId) {
            const managerCheck = await pool.query('SELECT id FROM employees WHERE id = $1', [nextManagerId]);
            if (managerCheck.rows.length === 0) {
                return res.status(400).json({ error: 'Reporting manager not found' });
            }
        }

        let departmentIdValue = null;
        let departmentNameValue = department || 'Unassigned';
        if (department_id) {
            const dep = await pool.query('SELECT id, name FROM departments WHERE id = $1', [department_id]);
            if (dep.rows.length === 0) {
                return res.status(400).json({ error: 'Department not found' });
            }
            departmentIdValue = dep.rows[0].id;
            departmentNameValue = dep.rows[0].name;
        }

        let query = `
            UPDATE employees
            SET full_name = $1, email = $2, role = $3, department = $4, department_id = $5,
                manager_id = $6, reporting_manager_id = $6, phone = $7,
                joining_date = $8, salary = $9, employee_id = $10, designation = $11,
                location = $12, pan = $13, bank_account = $14, bank_name = $15,
                personal_email = $16, emergency_contact = $17, technology = $18,
                experience_years = $19, aadhaar_card = $20,
                updated_at = NOW()`;
        let params = [
            full_name, email, role, departmentNameValue, departmentIdValue, nextManagerId,
            phone, joining_date, normalizedSalary,
            employee_id || null, designation || role || null, location || null,
            pan || pan_card || null, bank_account || null, bank_name || null,
            personal_email || null, emergency_contact || null, technology || null,
            normalizedExperienceYears,
            aadhaar_card || adhar_card || null
        ];

        if (avatar_url !== undefined) {
            query += ', avatar_url = $21 WHERE id = $22';
            params.push(avatar_url, req.params.id);
        } else {
            query += ' WHERE id = $21';
            params.push(req.params.id);
        }

        const result = await pool.query(query + ' RETURNING *', params);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Delete employee (HR only) ──────────────────────────────────
const deleteEmployee = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const employeeResult = await client.query('SELECT id, email FROM employees WHERE id = $1', [id]);
        if (employeeResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }

        const employee = employeeResult.rows[0];

        const statusResult = await client.query('SELECT status FROM employees WHERE id = $1', [id]);
        const currentStatus = (statusResult.rows[0]?.status || '').toLowerCase();
        if (currentStatus === 'inactive') {
            await client.query('ROLLBACK');
            return res.json({ message: 'Employee is already inactive' });
        }

        // Soft-disable linked login profile created at employee onboarding.
        await client.query(
            "UPDATE profiles SET status = 'inactive', updated_at = NOW() WHERE employee_id = $1 OR email = $2",
            [employee.id, employee.email]
        );

        await client.query(
            "UPDATE employees SET status = 'Inactive', updated_at = NOW() WHERE id = $1",
            [id]
        );

        await client.query('COMMIT');
        return res.json({ message: 'Employee marked inactive successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        return res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getEmployees,
    getHrAccounts,
    getDashboardStats,
    getEmployeeById,
    createEmployee,
    updateEmployee,
    deleteEmployee
};
