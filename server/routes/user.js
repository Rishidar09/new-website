const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Configure multer for profile picture uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads/profiles';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 2 * 1024 * 1024 }, // 2MB limit
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images are allowed'));
        }
    }
});

// @route   GET api/user/profile
router.get('/profile', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.email, p.role, p.created_at,
                   COALESCE(e.full_name, p.email) as name,
                   e.avatar_url as "profilePhoto",
                   e.dob,
                   e.address
            FROM profiles p
            LEFT JOIN employees e ON p.email = e.email
            WHERE p.id = $1
        `, [req.user.id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   PUT api/user/update-profile
router.put('/update-profile', auth, upload.single('profilePhoto'), async (req, res) => {
    const { name, email, role, dob, address } = req.body;
    const profilePhoto = req.file ? `/uploads/profiles/${req.file.filename}` : undefined;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // Get current email to find related records
        const userResult = await client.query('SELECT email FROM profiles WHERE id = $1', [req.user.id]);
        const currentEmail = userResult.rows[0].email;

        // 1. Update Profiles table
        let profileUpdateQuery = 'UPDATE profiles SET updated_at = NOW()';
        let profileParams = [req.user.id];
        let pIdx = 2;

        if (email) {
            profileUpdateQuery += `, email = $${pIdx++}`;
            profileParams.push(email);
        }
        if (role) {
            profileUpdateQuery += `, role = $${pIdx++}`;
            profileParams.push(role);
        }
        profileUpdateQuery += ' WHERE id = $1';
        await client.query(profileUpdateQuery, profileParams);

        // 2. Update Employees table if exists
        const empCheck = await client.query('SELECT id FROM employees WHERE email = $1', [currentEmail]);
        if (empCheck.rows.length > 0) {
            let empUpdateQuery = 'UPDATE employees SET updated_at = NOW()';
            let empParams = [currentEmail];
            let eIdx = 2;

            if (name) {
                empUpdateQuery += `, full_name = $${eIdx++}`;
                empParams.push(name);
            }
            if (email) {
                empUpdateQuery += `, email = $${eIdx++}`;
                empParams.push(email);
            }
            if (dob) {
                empUpdateQuery += `, dob = $${eIdx++}`;
                empParams.push(dob);
            }
            if (address) {
                empUpdateQuery += `, address = $${eIdx++}`;
                empParams.push(address);
            }
            if (profilePhoto) {
                empUpdateQuery += `, avatar_url = $${eIdx++}`;
                empParams.push(profilePhoto);
            }

            empUpdateQuery += ' WHERE email = $1';
            await client.query(empUpdateQuery, empParams);
        }

        await client.query('COMMIT');
        res.json({ message: 'Profile updated successfully', profilePhoto });
    } catch (err) {
        await client.query('ROLLBACK');
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
});

// @route   POST api/user/change-password
router.post('/change-password', auth, async (req, res) => {
    const { currentPassword, newPassword } = req.body;

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(newPassword)) {
        return res.status(400).json({
            error: 'Password must be at least 8 characters long and contain at least one uppercase letter, one number, and one special character.'
        });
    }

    try {
        const userResult = await pool.query('SELECT password_hash FROM profiles WHERE id = $1', [req.user.id]);
        const user = userResult.rows[0];

        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ error: 'Incorrect current password' });
        }

        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        await pool.query('UPDATE profiles SET password_hash = $1, is_first_login = FALSE WHERE id = $2', [hash, req.user.id]);

        res.json({ message: 'Password updated successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
