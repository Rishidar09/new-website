const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Create meeting ──────────────────────────────────────────────
const createMeeting = async (req, res) => {
    const { title, agenda, date_time, duration, participants, meeting_type } = req.body;
    try {
        const emp = await pool.query(
            `SELECT e.id FROM employees e 
             JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
             WHERE p.id = $1`,
            [req.user.id]
        );
        const creator_id = emp.rows[0]?.id;

        if (!creator_id) return res.status(404).json({ error: 'Employee profile not found' });

        const room_id = Math.random().toString(36).substring(7);
        const room_url = `https://indusinnovate.daily.co/${room_id}`;

        const result = await pool.query(
            'INSERT INTO meetings (title, agenda, date_time, duration, room_url, created_by, meeting_type) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [title, agenda, date_time, duration || 60, room_url, creator_id, meeting_type || 'scheduled']
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
        const emp = await pool.query(
            `SELECT e.id FROM employees e 
             JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
             WHERE p.id = $1`,
            [req.user.id]
        );
        const myId = emp.rows[0]?.id;

        if (!myId) return res.json([]);

        const result = await pool.query(`
            SELECT DISTINCT m.*, e.full_name as creator_name
            FROM meetings m
            JOIN employees e ON m.created_by = e.id
            LEFT JOIN meeting_participants mp ON m.id = mp.meeting_id
            WHERE m.created_by = $1 OR mp.employee_id = $1
              AND COALESCE(m.status, 'active') != 'completed'
              AND COALESCE(m.meeting_type, 'scheduled') = 'scheduled'
              AND NOT (m.title LIKE 'Group Call:%' AND COALESCE(m.agenda, '') = 'Live group discussion')
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

// ─── End meeting ──────────────────────────────────────────────────
const endMeeting = async (req, res) => {
    try {
        const { id } = req.params;
        // Verify user has rights (optional, currently anyone in the meeting can end it, or just creator)
        const result = await pool.query(
            "UPDATE meetings SET status = 'completed' WHERE id = $1 RETURNING *",
            [id]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Meeting not found' });

        res.json({ message: 'Meeting ended successfully', meeting: result.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Add participant to meeting ────────────────────────────────
const addParticipant = async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id } = req.body;

        if (!employee_id) {
            return res.status(400).json({ error: 'employee_id is required' });
        }

        // Check if meeting exists
        const meetingResult = await pool.query('SELECT * FROM meetings WHERE id = $1', [id]);
        if (meetingResult.rows.length === 0) {
            return res.status(404).json({ error: 'Meeting not found' });
        }

        // Check if participant already exists
        const existingResult = await pool.query(
            'SELECT * FROM meeting_participants WHERE meeting_id = $1 AND employee_id = $2',
            [id, employee_id]
        );

        if (existingResult.rows.length > 0) {
            return res.status(400).json({ error: 'Participant already in meeting' });
        }

        // Add participant
        const insertResult = await pool.query(
            'INSERT INTO meeting_participants (meeting_id, employee_id) VALUES ($1, $2) RETURNING *',
            [id, employee_id]
        );

        res.json({ message: 'Participant added successfully', participant: insertResult.rows[0] });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { createMeeting, getMeetings, getMeetingById, endMeeting, addParticipant };
