const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Helper to get employee ID
const getEmpId = async (email) => {
    const res = await pool.query('SELECT id FROM employees WHERE email = $1', [email]);
    return res.rows[0]?.id;
};

// ─── Get drive contents ──────────────────────────────────────────
const getContents = async (req, res) => {
    const { folder_id, type } = req.query;
    try {
        const myId = await getEmpId(req.user.email);
        if (!myId) return res.status(404).json({ error: 'Profile not found' });

        let folderQuery = '';
        let fileQuery = '';
        let params = [];

        if (type === 'my') {
            folderQuery = 'SELECT * FROM folders WHERE owner_id = $1 AND parent_id ' + (folder_id ? '= $2' : 'IS NULL') + ' AND is_company = FALSE AND is_hr_only = FALSE';
            fileQuery = 'SELECT * FROM files WHERE owner_id = $1 AND folder_id ' + (folder_id ? '= $2' : 'IS NULL');
            params = folder_id ? [myId, folder_id] : [myId];
        } else if (type === 'company') {
            folderQuery = 'SELECT * FROM folders WHERE is_company = TRUE AND parent_id ' + (folder_id ? '= $1' : 'IS NULL');
            fileQuery = 'SELECT * FROM files WHERE folder_id ' + (folder_id ? '= $1' : 'IS NULL') + ' AND folder_id IN (SELECT id FROM folders WHERE is_company = TRUE)';
            params = folder_id ? [folder_id] : [];
        } else if (type === 'hr') {
            if (req.user.role !== 'hr') return res.status(403).json({ error: 'Access denied' });
            folderQuery = 'SELECT * FROM folders WHERE is_hr_only = TRUE AND parent_id ' + (folder_id ? '= $1' : 'IS NULL');
            fileQuery = 'SELECT * FROM files WHERE folder_id ' + (folder_id ? '= $1' : 'IS NULL') + ' AND folder_id IN (SELECT id FROM folders WHERE is_hr_only = TRUE)';
            params = folder_id ? [folder_id] : [];
        } else if (type === 'shared') {
            folderQuery = 'SELECT NULL LIMIT 0';
            fileQuery = `
                SELECT f.* FROM files f
                JOIN file_shares fs ON f.id = fs.file_id
                WHERE fs.employee_id = $1
            `;
            params = [myId];
        }

        const [folders, files] = await Promise.all([
            pool.query(folderQuery, params),
            pool.query(fileQuery, params)
        ]);

        res.json({ folders: folders.rows, files: files.rows });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Get storage usage (real data) ─────────────────────────────
const getStorageUsage = async (req, res) => {
    try {
        const myId = await getEmpId(req.user.email);
        if (!myId) return res.status(404).json({ error: 'Profile not found' });

        const result = await pool.query(
            `SELECT COALESCE(SUM(size), 0)::bigint AS used_bytes
             FROM files
             WHERE owner_id = $1`,
            [myId]
        );

        const usedBytes = Number(result.rows[0]?.used_bytes || 0);
        // Quota can be configured later per role/user; default is 10 GB for now.
        const quotaBytes = 10 * 1024 * 1024 * 1024;

        res.json({ used_bytes: usedBytes, quota_bytes: quotaBytes });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Upload file ─────────────────────────────────────────────────
const uploadFile = async (req, res) => {
    try {
        const myId = await getEmpId(req.user.email);
        const { folder_id } = req.body;

        const result = await pool.query(
            'INSERT INTO files (name, folder_id, owner_id, size, mime_type, storage_path) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [req.file.originalname, folder_id || null, myId, req.file.size, req.file.mimetype, req.file.path]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Create folder ───────────────────────────────────────────────
const createFolder = async (req, res) => {
    const { name, parent_id, is_company, is_hr_only } = req.body;
    try {
        const myId = await getEmpId(req.user.email);

        const result = await pool.query(
            'INSERT INTO folders (name, parent_id, owner_id, is_company, is_hr_only) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [name, parent_id || null, myId, is_company || false, is_hr_only || false]
        );

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Delete file ─────────────────────────────────────────────────
const deleteFile = async (req, res) => {
    try {
        const myId = await getEmpId(req.user.email);
        const file = await pool.query('SELECT * FROM files WHERE id = $1', [req.params.id]);

        if (file.rows.length === 0) return res.status(404).json({ error: 'File not found' });
        if (file.rows[0].owner_id !== myId && req.user.role !== 'hr') return res.status(403).json({ error: 'Access denied' });

        if (fs.existsSync(file.rows[0].storage_path)) {
            fs.unlinkSync(file.rows[0].storage_path);
        }

        await pool.query('DELETE FROM files WHERE id = $1', [req.params.id]);
        res.json({ message: 'File deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

// ─── Download file ───────────────────────────────────────────────
const downloadFile = async (req, res) => {
    try {
        const file = await pool.query('SELECT * FROM files WHERE id = $1', [req.params.id]);
        if (file.rows.length === 0) return res.status(404).json({ error: 'File not found' });

        const filePath = path.join(__dirname, '..', file.rows[0].storage_path);
        res.download(filePath, file.rows[0].name);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = { getContents, getStorageUsage, uploadFile, createFolder, deleteFile, downloadFile };
