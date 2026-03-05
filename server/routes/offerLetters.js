const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// @route   POST api/offer-letters
// @desc    Save a generated offer letter record
router.post('/', auth, authorize(['hr']), async (req, res) => {
    const { candidate_name, role, department, ctc, joining_date } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO offer_letters (candidate_name, role, department, ctc, joining_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [candidate_name, role, department, ctc, joining_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/offer-letters
// @desc    Get all generated offer letters
router.get('/', auth, authorize(['hr']), async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM offer_letters ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/offer-letters/:id/send
// @desc    Mock send email
router.post('/:id/send', auth, authorize(['hr']), async (req, res) => {
    try {
        // In a real app, integrate with SendGrid/Brevo here
        await pool.query("UPDATE offer_letters SET status = 'Sent' WHERE id = $1", [req.params.id]);
        res.json({ message: 'Offer letter sent successfully (simulated)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PATCH api/offer-letters/:id/status
// @desc    Update letter status (Accepted/Declined)
router.patch('/:id/status', auth, authorize(['hr']), async (req, res) => {
    const { status } = req.body;
    try {
        const result = await pool.query(
            "UPDATE offer_letters SET status = $1 WHERE id = $2 RETURNING *",
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
