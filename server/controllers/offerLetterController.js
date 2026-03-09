const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Create offer letter (HR) ───────────────────────────────────
const createOfferLetter = async (req, res) => {
    const { candidate_name, role, department, ctc, joining_date } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO offer_letters (candidate_name, role, department, ctc, joining_date) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [candidate_name, role, department, ctc, joining_date]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get all offer letters (HR) ─────────────────────────────────
const getOfferLetters = async (req, res) => {
    try {
        const result = await pool.query("SELECT * FROM offer_letters ORDER BY created_at DESC");
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Send offer letter (HR) ─────────────────────────────────────
const sendOfferLetter = async (req, res) => {
    try {
        await pool.query("UPDATE offer_letters SET status = 'Sent' WHERE id = $1", [req.params.id]);
        res.json({ message: 'Offer letter sent successfully (simulated)' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Update offer letter status (HR) ────────────────────────────
const updateOfferLetterStatus = async (req, res) => {
    const { status } = req.body;
    try {
        const result = await pool.query(
            "UPDATE offer_letters SET status = $1 WHERE id = $2 RETURNING *",
            [status, req.params.id]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createOfferLetter, getOfferLetters, sendOfferLetter, updateOfferLetterStatus };
