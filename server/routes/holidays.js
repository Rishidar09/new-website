const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const fetch = require('node-fetch');

router.get('/', auth, async (req, res) => {
    try {
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;

        // Check if we have holidays for current and next year
        const checkResult = await pool.query(
            'SELECT DISTINCT EXTRACT(YEAR FROM date) as year FROM holidays WHERE EXTRACT(YEAR FROM date) IN ($1, $2)',
            [currentYear, nextYear]
        );

        const existingYears = checkResult.rows.map(r => parseInt(r.year));

        // Fetch and seed if missing
        for (const year of [currentYear, nextYear]) {
            if (!existingYears.includes(year)) {
                console.log(`Fetching holidays for ${year} from API...`);
                try {
                    const response = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/IN`);
                    if (response.status === 200) {
                        const data = await response.json();
                        for (const h of data) {
                            await pool.query(
                                'INSERT INTO holidays (name, date, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
                                [h.localName, h.date, 'National']
                            );
                        }
                    } else if (response.status === 204) {
                        console.log(`No holiday data found for ${year} (Status 204)`);
                    }
                } catch (apiErr) {
                    console.error(`Failed to fetch holidays for ${year}:`, apiErr);
                }
            }
        }

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
