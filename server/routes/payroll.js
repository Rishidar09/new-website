const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.get('/', auth, async (req, res) => {
    try {
        let query = 'SELECT p.*, e.full_name FROM payroll p JOIN employees e ON p.employee_id = e.id';
        let params = [];

        if (req.user.role !== 'hr') {
            // Find employee_id by email
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
        res.status(500).send('Server error');
    }
});

router.post('/', auth, authorize(['hr']), async (req, res) => {
    const { employee_id, month, year, basic_salary, allowances, deductions, net_salary } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO payroll (employee_id, month, year, basic_salary, allowances, deductions, net_salary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [employee_id, month, year, basic_salary, allowances, deductions, net_salary]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
