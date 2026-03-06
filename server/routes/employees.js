const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for avatar uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/avatars';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.use(auditLogger('Employees'));

// @route   GET api/employees
router.get('/', auth, async (req, res) => {
    try {
        const employees = await pool.query('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(employees.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

router.post('/', auth, authorize(['hr']), upload.single('avatar'), async (req, res) => {
    const { full_name, email, role, department, phone, joining_date, salary } = req.body;
    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : null;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Create Employee Record
        const newEmployee = await client.query(
            'INSERT INTO employees (full_name, email, role, department, phone, joining_date, salary, avatar_url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [full_name, email, role, department, phone, joining_date, salary, avatar_url]
        );

        // 2. Create Login Profile for the employee
        const tempPassword = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(tempPassword, salt);

        await client.query(
            'INSERT INTO profiles (email, password_hash, role, employee_id, is_first_login, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [email, hash, 'employee', newEmployee.rows[0].id, true, 'active']
        );

        await client.query('COMMIT');
        res.json(newEmployee.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    } finally {
        client.release();
    }
});

// @route   PATCH api/employees/:id
router.patch('/:id', auth, authorize(['hr']), upload.single('avatar'), async (req, res) => {
    const { full_name, email, role, department, phone, joining_date, salary } = req.body;
    const avatar_url = req.file ? `/uploads/avatars/${req.file.filename}` : undefined;

    try {
        let query = 'UPDATE employees SET full_name = $1, email = $2, role = $3, department = $4, phone = $5, joining_date = $6, salary = $7';
        let params = [full_name, email, role, department, phone, joining_date, salary];

        if (avatar_url !== undefined) {
            query += ', avatar_url = $8 WHERE id = $9';
            params.push(avatar_url, req.params.id);
        } else {
            query += ' WHERE id = $8';
            params.push(req.params.id);
        }

        const result = await pool.query(query + ' RETURNING *', params);
        if (result.rows.length === 0) return res.status(404).json({ error: 'Employee not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
