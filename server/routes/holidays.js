const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.get('/', auth, async (req, res) => {
    try {
        const holidays = await pool.query('SELECT * FROM holidays ORDER BY date ASC');
        res.json(holidays.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', auth, async (req, res) => {
    const { name, date, type, label } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO holidays (name, date, type, label) VALUES ($1, $2, $3, $4) RETURNING *',
            [name, date, type || 'Custom', label]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
