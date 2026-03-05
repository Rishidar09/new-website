const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.use(auditLogger('Payroll'));

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
        res.status(500).send('Server error');
    }
});

// @route   POST api/payroll/:id/send
// @desc    Mock send payslip email
router.post('/:id/send', auth, authorize(['hr']), async (req, res) => {
    try {
        // In a real app, integrate with Brevo/SendGrid
        await pool.query("UPDATE payroll SET status = 'Sent' WHERE id = $1", [req.params.id]);
        res.json({ message: 'Payslip sent to employee email successfully (simulated)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
