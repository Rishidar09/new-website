const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.use(auditLogger('Employees'));

// @route   GET api/employees
router.get('/', auth, async (req, res) => {
    try {
        const employees = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(employees.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

router.post('/', auth, authorize(['hr']), async (req, res) => {
    const { full_name, email, role, department, phone, joining_date, salary } = req.body;

    try {
        const newEmployee = await pool.query(
            'INSERT INTO employees (full_name, email, role, department, phone, joining_date, salary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [full_name, email, role, department, phone, joining_date, salary]
        );
        res.json(newEmployee.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PATCH api/employees/:id
router.patch('/:id', auth, authorize(['hr']), async (req, res) => {
    const { full_name, email, role, department, phone, joining_date, salary } = req.body;
    try {
        const result = await pool.query(
            `UPDATE employees 
             SET full_name = $1, email = $2, role = $3, department = $4, phone = $5, joining_date = $6, salary = $7 
             WHERE id = $8 RETURNING *`,
            [full_name, email, role, department, phone, joining_date, salary, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
