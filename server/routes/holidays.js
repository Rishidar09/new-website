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
        res.status(500).send('Server error');
    }
});

module.exports = router;
