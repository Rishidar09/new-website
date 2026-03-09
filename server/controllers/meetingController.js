const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Create meeting ──────────────────────────────────────────────
const createMeeting = async (req, res) => {
    const { title, agenda, date_time, duration, participants } = req.body;
    try {
        const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
        const creator_id = emp.rows[0]?.id;

        if (!creator_id) return res.status(404).json({ error: 'Profile not found' });

        const room_id = Math.random().toString(36).substring(7);
        const room_url = `https://indusinnovate.daily.co/${room_id}`;

        const result = await pool.query(
            'INSERT INTO meetings (title, agenda, date_time, duration, room_url, created_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [title, agenda, date_time, duration || 60, room_url, creator_id]
        );
        const meeting = result.rows[0];

        if (participants && participants.length > 0) {
            const values = participants.map(pId => `('${meeting.id}', '${pId}')`).join(',');
            await pool.query(`INSERT INTO meeting_participants (meeting_id, employee_id) VALUES ${values}`);
        }

        res.json(meeting);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get meetings ────────────────────────────────────────────────
const getMeetings = async (req, res) => {
    try {
        const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
        const myId = emp.rows[0]?.id;

        if (!myId) return res.json([]);

        const result = await pool.query(`
            SELECT DISTINCT m.*, e.full_name as creator_name
            FROM meetings m
            JOIN employees e ON m.created_by = e.id
            LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
            WHERE m.created_by = $1 OR mp.employee_id = $1
            ORDER BY m.date_time ASC
        `, [myId]);

        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get meeting by ID ──────────────────────────────────────────
const getMeetingById = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT m.*, e.full_name as creator_name 
            FROM meetings m 
            JOIN employees e ON m.created_by = e.id 
            WHERE m.id = $1
        `, [req.params.id]);

        if (result.rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });

        const meeting = result.rows[0];

        const participants = await pool.query(`
            SELECT e.id, e.full_name, e.role, e.department
            FROM employees e
            JOIN meeting_participants mp ON e.id = mp.employee_id
            WHERE mp.meeting_id = $1
        `, [req.params.id]);

        meeting.participants = participants.rows;
        res.json(meeting);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createMeeting, getMeetings, getMeetingById };
