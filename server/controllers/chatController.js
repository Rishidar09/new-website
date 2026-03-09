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

        const onlineUsers = req.io.onlineUsers;
        const contacts = result.rows.map(c => ({
            ...c,
            isOnline: onlineUsers ? onlineUsers.has(c.id) : false
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
            WHERE gm.employee_id = (
                SELECT e.id FROM employees e 
                JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
                WHERE p.id = $1
            )
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Create group ──────────────────────────────────────────────────
const createGroup = async (req, res) => {
    const { name, memberIds = [] } = req.body;
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const emp = await pool.query(`
            SELECT e.id FROM employees e 
            JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
            WHERE p.id = $1
        `, [req.user.id]);
        const creatorId = emp.rows[0]?.id;

        if (!creatorId) throw new Error('Creator profile not found');

        // 1. Create group
        const groupRes = await client.query(
            'INSERT INTO chat_groups (name, created_by) VALUES ($1, $2) RETURNING *',
            [name, creatorId]
        );
        const group = groupRes.rows[0];

        // 2. Add members (including creator)
        const allMemberIds = Array.from(new Set([...memberIds, creatorId]));
        for (const mId of allMemberIds) {
            await client.query(
                'INSERT INTO chat_group_members (group_id, employee_id) VALUES ($1, $2)',
                [group.id, mId]
            );
        }

        await client.query('COMMIT');
        res.json(group);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        client.release();
    }
};

// ─── Add members to group ──────────────────────────────────────────
const addMembers = async (req, res) => {
    const { groupId, memberIds } = req.body;
    console.log('[addMembers] groupId:', groupId, 'memberIds:', memberIds);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Verify the group exists
        const groupCheck = await client.query(
            'SELECT id FROM chat_groups WHERE id = $1',
            [groupId]
        );
        if (groupCheck.rows.length === 0) {
            throw new Error('Group not found');
        }

        for (const mId of memberIds) {
            // Check if already a member to avoid duplicates
            const existing = await client.query(
                'SELECT 1 FROM chat_group_members WHERE group_id = $1 AND employee_id = $2',
                [groupId, mId]
            );
            if (existing.rows.length === 0) {
                await client.query(
                    'INSERT INTO chat_group_members (group_id, employee_id) VALUES ($1, $2)',
                    [groupId, mId]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ message: 'Members added successfully' });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('[addMembers] Error:', err.message);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        client.release();
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

        const roomId = group_id ? `group_${group_id}` : [sender_id, receiver_id].sort().join('_');
        req.io.to(roomId).emit('receive_message', message);

        res.json(message);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Clear chat history ──────────────────────────────────────────
const clearHistory = async (req, res) => {
    const { targetId } = req.params;

    try {
        const emp = await pool.query(`
            SELECT e.id FROM employees e 
            JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id 
            WHERE p.id = $1
        `, [req.user.id]);
        const myId = emp.rows[0]?.id;

        if (!myId) return res.status(404).json({ error: 'Profile not found' });

        // Delete messages where sender/receiver match both directions
        await pool.query(`
            DELETE FROM messages 
            WHERE 
                (sender_id = $1 AND receiver_id = $2) 
                OR 
                (sender_id = $2 AND receiver_id = $1)
        `, [myId, targetId]);

        res.json({ message: 'Chat history cleared successfully' });
    } catch (err) {
        console.error('Failed to clear history:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    getContacts,
    getGroups,
    createGroup,
    addMembers,
    getHistory,
    clearHistory,
    sendMessage
};
