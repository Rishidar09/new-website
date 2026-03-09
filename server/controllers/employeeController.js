const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Get all employees ───────────────────────────────────────────
const getEmployees = async (req, res) => {
    try {
        const employees = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(employees.rows);
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

        res.json({
            attendanceCount: parseInt(attendance.rows[0].count),
            leavesCount: parseInt(leaves.rows[0].count),
            projects: projects.rows
        });
    } catch (err) {
        console.error('[Dashboard Stats Error]:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get employee by ID ──────────────────────────────────────────
const getEmployeeById = async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT * FROM employees WHERE id::text = $1 OR employee_id = $1 LIMIT 1`,
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
    const { full_name, email, role, department, phone, joining_date, salary } = req.body;
    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        const existingEmailCheck = await client.query(
            `SELECT email FROM profiles WHERE email = $1 UNION SELECT email FROM employees WHERE email = $1`,
            [email]
        );
        if (existingEmailCheck.rows.length > 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Email already exists in the system' });
        }

        const newEmployee = await client.query(
            'INSERT INTO employees (full_name, email, role, department, phone, joining_date, salary, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [full_name, email, role, department, phone, joining_date, salary, avatar_url]
        );

        const tempPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tempPassword, salt);

        await client.query(
            'INSERT INTO profiles (email, password_hash, role, employee_id, is_first_login, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [email, hash, 'employee', newEmployee.rows[0].id, true, 'active']
        );

        await client.query('COMMIT');
        res.json(newEmployee.rows[0]);
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
    const { full_name, email, role, department, phone, joining_date, salary } = req.body;
    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    try {
        let query = 'UPDATE employees SET full_name = $1, email = $2, role = $3, department = $4, phone = $5, joining_date = $6, salary = $7';
        let params = [full_name, email, role, department, phone, joining_date, salary];

        if (avatar_url !== undefined) {
            query += ', avatar_url = $8 WHERE id = $9';
            params.push(avatar_url, req.params.id);
        } else {
            query += ' WHERE id = $8';
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

module.exports = {
    getEmployees,
    getDashboardStats,
    getEmployeeById,
    createEmployee,
    updateEmployee
};
