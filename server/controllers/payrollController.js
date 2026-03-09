const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Get payroll records ─────────────────────────────────────────
const getPayroll = async (req, res) => {
    try {
        let query = 'SELECT p.*, e.full_name FROM payroll p JOIN employees e ON p.employee_id = e.id';
        let params = [];

        if (req.user.role !== 'hr') {
            const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
            if (emp.rows.length > 0) {
                query += ' WHERE p.employee_id = $1';
                params.push(emp.rows[0].id);
            } else {
                return res.json([]);
            }
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Create payroll record (HR) ──────────────────────────────────
const createPayroll = async (req, res) => {
    const {
        employee_id, month, year, basic_salary, hra,
        allowances, pf, tds, gross_salary, deductions, net_salary
    } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO payroll (employee_id, month, year, basic_salary, hra, allowances, pf, tds, gross_salary, deductions, net_salary, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *',
            [employee_id, month, year, basic_salary, hra, allowances, pf, tds, gross_salary, deductions, net_salary, 'Generated']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Send payslip (HR) ──────────────────────────────────────────
const sendPayslip = async (req, res) => {
    try {
        await pool.query("UPDATE payroll SET status = 'Sent' WHERE id = $1", [req.params.id]);
        res.json({ message: 'Payslip sent to employee email successfully (simulated)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getPayroll, createPayroll, sendPayslip };
