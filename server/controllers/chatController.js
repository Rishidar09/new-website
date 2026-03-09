const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Get contacts ────────────────────────────────────────────────
const getContacts = async (req, res) => {
    try {
        const emp = await pool.query(`
            SELECT e.id FROM employees e 
            JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
            WHERE p.id = $1
        `, [req.user.id]);
        const myUuid = emp.rows[0]?.id;

        const result = await pool.query(`
            SELECT id, full_name, role, department, email, 
            (SELECT content FROM messages WHERE (sender_id = $1 AND receiver_id = employees.id) OR (sender_id = employees.id AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1) as last_msg,
            (SELECT created_at FROM messages WHERE (sender_id = $1 AND receiver_id = employees.id) OR (sender_id = employees.id AND receiver_id = $1) ORDER BY created_at DESC LIMIT 1) as last_time
            FROM employees 
            WHERE email != $2
            ORDER BY last_time DESC NULLS LAST, full_name ASC
        `, [myUuid, req.user.email]);

        const contacts = result.rows.map(c => ({
            ...c,
            isOnline: Math.random() > 0.7
        }));

        res.json(contacts);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get groups ──────────────────────────────────────────────────
const getGroups = async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT g.* 
            FROM chat_groups g
            JOIN chat_group_members gm ON g.id = gm.group_id
            WHERE gm.employee_id = (SELECT id FROM employees WHERE email = $1)
        `, [req.user.email]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get chat history ────────────────────────────────────────────
const getHistory = async (req, res) => {
    const { type } = req.query;
    const { targetId } = req.params;

    try {
        const emp = await pool.query(`
            SELECT e.id FROM employees e 
            JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
            WHERE p.id = $1
        `, [req.user.id]);
        const myId = emp.rows[0]?.id;

        if (!myId) return res.status(404).json({ error: 'Profile not found' });

        let query = '';
        let params = [];

        if (type === 'group') {
            query = `
                SELECT m.*, e.full_name as sender_name 
                FROM messages m
                JOIN employees e ON m.sender_id = e.id
                WHERE m.group_id = $1 
                ORDER BY m.created_at ASC
            `;
            params = [targetId];
        } else {
            query = `
                SELECT m.*, e.full_name as sender_name 
                FROM messages m
                JOIN employees e ON m.sender_id = e.id
                WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
                   OR (m.sender_id = $2 AND m.receiver_id = $1)
                ORDER BY m.created_at ASC
            `;
            params = [myId, targetId];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Send message ────────────────────────────────────────────────
const sendMessage = async (req, res) => {
    const { content, receiver_id, group_id, attachment_url } = req.body;
    try {
        const emp = await pool.query(`
            SELECT e.id FROM employees e 
            JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
            WHERE p.id = $1
        `, [req.user.id]);
        const sender_id = emp.rows[0]?.id;

        if (!sender_id) return res.status(404).json({ error: 'Profile not found' });

        const result = await pool.query(`
            WITH inserted AS (
                INSERT INTO messages (sender_id, receiver_id, group_id, content, attachment_url) 
                VALUES ($1, $2, $3, $4, $5) 
                RETURNING *
            )
            SELECT i.*, e.full_name as sender_name 
            FROM inserted i
            JOIN employees e ON i.sender_id = e.id
        `, [sender_id, receiver_id || null, group_id || null, content, attachment_url || null]);

        const message = result.rows[0];

        const roomId = group_id ? group_id : [sender_id, receiver_id].sort().join('_');
        req.io.to(roomId).emit('receive_message', message);

        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getContacts,
    getGroups,
    getHistory,
    sendMessage
};
