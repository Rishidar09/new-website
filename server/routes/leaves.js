const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// @route   GET api/leaves
router.get('/', auth, async (req, res) => {
    try {
        // If not HR, only show own leaves
        let query = 'SELECT l.*, e.full_name, e.department, e.avatar_url FROM leaves l JOIN employees e ON l.employee_id = e.id';
        let params = [];

        if (req.user.role !== 'hr') {
            // Need to find the employee_id for this user email
            const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
            if (emp.rows.length > 0) {
                query += ' WHERE l.employee_id = $1';
                params.push(emp.rows[0].id);
            } else {
                return res.json([]);
            }
        }

        query += ' ORDER BY l.created_at DESC';
        const leaves = await pool.query(query, params);
        res.json(leaves.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/leaves
router.post('/', auth, async (req, res) => {
    const { employee_id, leave_type, start_date, end_date, days, reason } = req.body;

    try {
        const newLeave = await pool.query(
            'INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days, reason) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [employee_id, leave_type, start_date, end_date, days, reason]
        );
        res.json(newLeave.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PATCH api/leaves/:id
router.patch('/:id', auth, authorize(['hr']), async (req, res) => {
    const { status } = req.body;
    try {
        const updated = await pool.query(
            'UPDATE leaves SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json(updated.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
