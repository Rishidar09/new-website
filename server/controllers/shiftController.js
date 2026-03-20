const { Pool } = require('pg');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

let shiftSchemaEnsured = false;

const ensureShiftSchema = async () => {
    if (shiftSchemaEnsured) return;

    await pool.query(`
        CREATE TABLE IF NOT EXISTS shifts (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            name TEXT UNIQUE NOT NULL,
            start_time TIME NOT NULL,
            end_time TIME NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS employee_shift_assignments (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
            shift_id UUID NOT NULL REFERENCES shifts(id) ON DELETE CASCADE,
            effective_from DATE NOT NULL,
            effective_to DATE,
            assigned_by UUID REFERENCES employees(id) ON DELETE SET NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_shift_assignments_employee_dates
            ON employee_shift_assignments(employee_id, effective_from, effective_to);

        CREATE INDEX IF NOT EXISTS idx_shift_assignments_shift
            ON employee_shift_assignments(shift_id);
    `);

    shiftSchemaEnsured = true;
};

const parseDate = (value, fieldName) => {
    if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(String(value))) {
        throw new Error(`${fieldName} must be in YYYY-MM-DD format`);
    }
    return String(value);
};

const parseTime = (value, fieldName) => {
    if (!value || !/^([01]\d|2[0-3]):([0-5]\d)(:[0-5]\d)?$/.test(String(value))) {
        throw new Error(`${fieldName} must be in HH:MM or HH:MM:SS format`);
    }
    return String(value);
};

const getActorEmployeeId = async (req) => {
    if (req.user?.employee_uuid) return req.user.employee_uuid;

    if (req.user?.email) {
        const result = await pool.query('SELECT id FROM employees WHERE email = $1 LIMIT 1', [req.user.email]);
        if (result.rows[0]) return result.rows[0].id;
    }

    return null;
};

const createShift = async (req, res) => {
    const { name, start_time, end_time } = req.body;

    try {
        await ensureShiftSchema();

        if (!name || !String(name).trim()) {
            return res.status(400).json({ error: 'Shift name is required' });
        }

        const cleanStart = parseTime(start_time, 'start_time');
        const cleanEnd = parseTime(end_time, 'end_time');

        const result = await pool.query(
            `INSERT INTO shifts (name, start_time, end_time, updated_at)
             VALUES ($1, $2, $3, NOW())
             RETURNING *`,
            [String(name).trim(), cleanStart, cleanEnd]
        );

        res.json(result.rows[0]);
    } catch (err) {
        if (err.code === '23505') {
            return res.status(400).json({ error: 'Shift name already exists' });
        }
        if (err.message && (err.message.includes('start_time') || err.message.includes('end_time'))) {
            return res.status(400).json({ error: err.message });
        }
        console.error('createShift error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const getShifts = async (req, res) => {
    try {
        await ensureShiftSchema();
        const result = await pool.query('SELECT * FROM shifts ORDER BY name ASC');
        res.json(result.rows);
    } catch (err) {
        console.error('getShifts error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const assignShiftToEmployee = async (req, res) => {
    const { employee_id, shift_id, effective_from } = req.body;
    const client = await pool.connect();

    try {
        await ensureShiftSchema();

        if (!employee_id || !shift_id || !effective_from) {
            return res.status(400).json({ error: 'employee_id, shift_id and effective_from are required' });
        }

        const effectiveFrom = parseDate(effective_from, 'effective_from');
        const actorId = await getActorEmployeeId(req);

        await client.query('BEGIN');

        const employee = await client.query('SELECT id, full_name FROM employees WHERE id = $1', [employee_id]);
        if (employee.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Employee not found' });
        }

        const shift = await client.query('SELECT id, name FROM shifts WHERE id = $1', [shift_id]);
        if (shift.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Shift not found' });
        }

        await client.query(
            `UPDATE employee_shift_assignments
             SET effective_to = ($2::date - INTERVAL '1 day')::date,
                 updated_at = NOW()
             WHERE employee_id = $1
               AND effective_to IS NULL
               AND effective_from <= $2::date`,
            [employee_id, effectiveFrom]
        );

        const assigned = await client.query(
            `INSERT INTO employee_shift_assignments (
                employee_id, shift_id, effective_from, assigned_by, updated_at
             ) VALUES ($1, $2, $3, $4, NOW())
             RETURNING *`,
            [employee_id, shift_id, effectiveFrom, actorId]
        );

        await client.query('COMMIT');
        res.json(assigned.rows[0]);
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('assignShiftToEmployee rollback error:', rollbackErr.message);
        }
        if (err.message && err.message.includes('effective_from')) {
            return res.status(400).json({ error: err.message });
        }
        console.error('assignShiftToEmployee error:', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

const assignShiftToDepartment = async (req, res) => {
    const { department_id, shift_id, effective_from } = req.body;
    const client = await pool.connect();

    try {
        await ensureShiftSchema();

        if (!department_id || !shift_id || !effective_from) {
            return res.status(400).json({ error: 'department_id, shift_id and effective_from are required' });
        }

        const effectiveFrom = parseDate(effective_from, 'effective_from');
        const actorId = await getActorEmployeeId(req);

        await client.query('BEGIN');

        const shift = await client.query('SELECT id FROM shifts WHERE id = $1', [shift_id]);
        if (shift.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Shift not found' });
        }

        const employeesRes = await client.query(
            `SELECT id
             FROM employees
             WHERE department_id = $1
               AND COALESCE(status, 'Active') <> 'Inactive'`,
            [department_id]
        );

        if (employeesRes.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'No active employees found for this department' });
        }

        let assignedCount = 0;
        for (const row of employeesRes.rows) {
            await client.query(
                `UPDATE employee_shift_assignments
                 SET effective_to = ($2::date - INTERVAL '1 day')::date,
                     updated_at = NOW()
                 WHERE employee_id = $1
                   AND effective_to IS NULL
                   AND effective_from <= $2::date`,
                [row.id, effectiveFrom]
            );

            await client.query(
                `INSERT INTO employee_shift_assignments (
                    employee_id, shift_id, effective_from, assigned_by, updated_at
                 ) VALUES ($1, $2, $3, $4, NOW())`,
                [row.id, shift_id, effectiveFrom, actorId]
            );

            assignedCount += 1;
        }

        await client.query('COMMIT');
        res.json({ assigned_count: assignedCount });
    } catch (err) {
        try {
            await client.query('ROLLBACK');
        } catch (rollbackErr) {
            console.error('assignShiftToDepartment rollback error:', rollbackErr.message);
        }
        if (err.message && err.message.includes('effective_from')) {
            return res.status(400).json({ error: err.message });
        }
        console.error('assignShiftToDepartment error:', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

const getWeeklyRoster = async (req, res) => {
    const weekStartRaw = req.query.week_start;
    const departmentId = req.query.department_id || null;

    try {
        await ensureShiftSchema();

        const now = new Date();
        const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const day = today.getUTCDay();
        const mondayOffset = day === 0 ? -6 : 1 - day;
        today.setUTCDate(today.getUTCDate() + mondayOffset);

        const weekStart = weekStartRaw ? parseDate(weekStartRaw, 'week_start') : today.toISOString().slice(0, 10);

        const params = [weekStart];
        let employeeWhere = `WHERE COALESCE(e.status, 'Active') <> 'Inactive'`;
        if (departmentId) {
            params.push(departmentId);
            employeeWhere += ` AND e.department_id = $${params.length}`;
        }

        const query = `
            WITH week_days AS (
                SELECT generate_series($1::date, $1::date + INTERVAL '6 days', INTERVAL '1 day')::date AS day
            ),
            selected_employees AS (
                SELECT e.id, e.full_name, e.department,
                       d.name AS department_name
                FROM employees e
                LEFT JOIN departments d ON d.id = e.department_id
                ${employeeWhere}
                ORDER BY e.full_name
            )
            SELECT se.id AS employee_id,
                   se.full_name,
                   COALESCE(se.department_name, se.department, 'Unassigned') AS department_name,
                   wd.day,
                   s.id AS shift_id,
                   s.name AS shift_name,
                   s.start_time,
                   s.end_time
            FROM selected_employees se
            CROSS JOIN week_days wd
            LEFT JOIN LATERAL (
                SELECT esa.shift_id
                FROM employee_shift_assignments esa
                WHERE esa.employee_id = se.id
                  AND esa.effective_from <= wd.day
                  AND (esa.effective_to IS NULL OR esa.effective_to >= wd.day)
                ORDER BY esa.effective_from DESC, esa.created_at DESC
                LIMIT 1
            ) active ON TRUE
            LEFT JOIN shifts s ON s.id = active.shift_id
            ORDER BY se.full_name, wd.day;
        `;

        const result = await pool.query(query, params);

        res.json({
            week_start: weekStart,
            roster: result.rows,
        });
    } catch (err) {
        if (err.message && err.message.includes('week_start')) {
            return res.status(400).json({ error: err.message });
        }
        console.error('getWeeklyRoster error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMyCurrentShift = async (req, res) => {
    try {
        await ensureShiftSchema();

        let employeeId = req.user.employee_uuid;
        if (!employeeId && req.user.email) {
            const empRes = await pool.query('SELECT id FROM employees WHERE email = $1 LIMIT 1', [req.user.email]);
            employeeId = empRes.rows[0]?.id;
        }

        if (!employeeId) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        const result = await pool.query(
            `SELECT s.id, s.name, s.start_time, s.end_time,
                    esa.effective_from, esa.effective_to
             FROM employee_shift_assignments esa
             JOIN shifts s ON s.id = esa.shift_id
             WHERE esa.employee_id = $1
               AND esa.effective_from <= CURRENT_DATE
               AND (esa.effective_to IS NULL OR esa.effective_to >= CURRENT_DATE)
             ORDER BY esa.effective_from DESC, esa.created_at DESC
             LIMIT 1`,
            [employeeId]
        );

        res.json(result.rows[0] || null);
    } catch (err) {
        console.error('getMyCurrentShift error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createShift,
    getShifts,
    assignShiftToEmployee,
    assignShiftToDepartment,
    getWeeklyRoster,
    getMyCurrentShift,
};
