const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// @route   POST api/attendance/check-in
// @desc    Record check-in
router.post('/check-in', auth, async (req, res) => {
    try {
        const profileInfo = await pool.query('SELECT employee_id FROM profiles WHERE id = $1', [req.user.id]);
        const employee_id = profileInfo.rows[0]?.employee_id;

        if (!employee_id) {
            return res.status(400).json({ error: 'Employee profile not perfectly linked. Contact HR.' });
        }

        const { location } = req.body;
        const now = new Date();

        // Check if there is an active check-in (without checkout)
        const existing = await pool.query(
            "SELECT * FROM attendance WHERE employee_id = $1 AND DATE(check_in) = CURRENT_DATE AND check_out IS NULL",
            [employee_id]
        );

        if (existing.rows.length > 0) {
            return res.status(400).json({ error: 'You are already checked in. Please check out first.' });
        }

        // Determine status (Late if after 9:15 AM)
        const checkInTime = now.getHours() * 60 + now.getMinutes();
        const lateTime = 9 * 60 + 15;
        const status = checkInTime > lateTime ? 'Late' : 'Present';

        const result = await pool.query(
            "INSERT INTO attendance (employee_id, check_in, status, location) VALUES ($1, $2, $3, $4) RETURNING *",
            [employee_id, now, status, location]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/attendance/check-out
// @desc    Record check-out
router.post('/check-out', auth, async (req, res) => {
    try {
        const profileInfo = await pool.query('SELECT employee_id FROM profiles WHERE id = $1', [req.user.id]);
        const employee_id = profileInfo.rows[0]?.employee_id;
        const now = new Date();

        const result = await pool.query(
            "UPDATE attendance SET check_out = $1 WHERE employee_id = $2 AND DATE(check_in) = CURRENT_DATE AND check_out IS NULL RETURNING *",
            [now, employee_id]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'No active check-in found for today' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/attendance/my
// @desc    Get current user's attendance
router.get('/my', auth, async (req, res) => {
    try {
        const profileInfo = await pool.query('SELECT employee_id FROM profiles WHERE id = $1', [req.user.id]);
        const employee_id = profileInfo.rows[0]?.employee_id;

        const result = await pool.query(
            "SELECT * FROM attendance WHERE employee_id = $1 ORDER BY check_in DESC",
            [employee_id]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/attendance/all
// @desc    Get all attendance records (HR)
router.get('/all', auth, async (req, res) => {
    if (req.user.role !== 'hr') {
        return res.status(403).json({ error: 'Access denied' });
    }

    try {
        const { date, department } = req.query;
        let query = `
            SELECT a.*, e.full_name, e.department, e.role as emp_role
            FROM attendance a
            JOIN employees e ON a.employee_id = e.id
            WHERE 1=1
        `;
        const params = [];

        if (date) {
            params.push(date);
            query += ` AND DATE(a.check_in) = $${params.length}`;
        }
        if (department) {
            params.push(department);
            query += ` AND e.department = $${params.length}`;
        }

        query += " ORDER BY a.check_in DESC";

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
