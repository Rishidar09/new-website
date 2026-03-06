const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.use(auditLogger('Complaint Box'));

// @route   POST api/complaints
router.post('/', auth, async (req, res) => {
    const { category, description, attachment_url, is_anonymous } = req.body;
    try {
        const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
        if (emp.rows.length === 0) return res.status(404).json({ error: 'Employee profile not found' });

        const employee_id = emp.rows[0].id;

        const newComplaint = await pool.query(
            'INSERT INTO complaints (employee_id, category, description, attachment_url, is_anonymous) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [employee_id, category, description, attachment_url, is_anonymous]
        );
        res.json(newComplaint.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/complaints
router.get('/', auth, async (req, res) => {
    const { status, category } = req.query;
    try {
        let query = '';
        let params = [];

        if (req.user.role === 'hr') {
            // HR sees everything. Join with employees to get names unless anonymous
            query = `
                SELECT 
                    c.*, 
                    CASE 
                        WHEN c.is_anonymous = TRUE THEN 'Anonymous' 
                        ELSE e.full_name 
                    END as submitted_by,
                    e.department
                FROM complaints c
                LEFT JOIN employees e ON c.employee_id = e.id
                WHERE 1=1
            `;
            let pIndex = 1;
            if (status && status !== 'All') {
                query += ` AND c.status = $${pIndex++}`;
                params.push(status);
            }
            if (category && category !== 'All') {
                query += ` AND c.category = $${pIndex++}`;
                params.push(category);
            }
        } else {
            // Employee sees only their own complaints
            const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
            if (emp.rows.length === 0) return res.json([]);

            query = 'SELECT * FROM complaints WHERE employee_id = $1';
            params.push(emp.rows[0].id);
        }

        query += ' ORDER BY created_at DESC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PATCH api/complaints/:id
router.patch('/:id', auth, authorize(['hr']), async (req, res) => {
    const { status } = req.body;
    try {
        const result = await pool.query(
            'UPDATE complaints SET status = $1 WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
