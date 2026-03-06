const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { randomUUID: uuidv4 } = require('crypto');
const { Pool } = require('pg');
const { logManualAction } = require('../middleware/auditLogger');
const { auth } = require('../middleware/auth');
const { sendPasswordResetEmail } = require('../services/emailService');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '8h';
const MAX_FAILED_ATTEMPTS = 5;

// ─── POST /api/auth/signup ────────────────────────────────────────
router.post('/signup', async (req, res) => {
    return res.status(403).json({ error: 'Public signup is disabled. Please contact HR for account creation.' });
});

// ─── POST /api/auth/login ─────────────────────────────────────────
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const result = await pool.query(`
            SELECT p.*, e.full_name 
            FROM profiles p 
            LEFT JOIN employees e ON p.email = e.email 
            WHERE p.email = $1
        `, [email]);

        if (result.rows.length === 0) {
            console.log(`[Login Debug] Email not found: ${email}`);
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        const user = result.rows[0];

        // ── Account Lock Check ──────────────────────────────────
        if (user.locked_at) {
            const lockDuration = 30 * 60 * 1000; // 30 minutes
            const lockedSince = new Date(user.locked_at).getTime();
            if (Date.now() - lockedSince < lockDuration) {
                return res.status(403).json({
                    error: 'Account is locked due to too many failed attempts. Please contact HR or try again in 30 minutes.'
                });
            } else {
                // Auto-unlock after 30 minutes
                await pool.query(
                    'UPDATE profiles SET locked_at = NULL, failed_login_attempts = 0 WHERE id = $1',
                    [user.id]
                );
                user.locked_at = null;
                user.failed_login_attempts = 0;
            }
        }

        // ── Password Check ──────────────────────────────────────
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            console.log(`[Login Debug] Password mismatch for: ${email}`);
            const newAttempts = (user.failed_login_attempts || 0) + 1;
            if (newAttempts >= MAX_FAILED_ATTEMPTS) {
                await pool.query(
                    'UPDATE profiles SET failed_login_attempts = $1, locked_at = NOW() WHERE id = $2',
                    [newAttempts, user.id]
                );
                return res.status(403).json({
                    error: `Account locked after ${MAX_FAILED_ATTEMPTS} failed attempts. Contact HR to unlock.`
                });
            }
            await pool.query(
                'UPDATE profiles SET failed_login_attempts = $1 WHERE id = $2',
                [newAttempts, user.id]
            );
            return res.status(400).json({
                error: `Invalid credentials. ${MAX_FAILED_ATTEMPTS - newAttempts} attempt(s) remaining before lockout.`
            });
        }

        // ── Reset failed attempts on success ────────────────────
        await pool.query(
            'UPDATE profiles SET failed_login_attempts = 0, locked_at = NULL, updated_at = NOW() WHERE id = $1',
            [user.id]
        );

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role,
                email: user.email,
                name: user.full_name || user.email,
                employee_id: user.employee_id || null
            },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        await logManualAction({
            email: user.email,
            name: user.full_name || user.email,
            action: 'Login', module: 'Authentication',
            ip: req.ip || req.connection.remoteAddress
        });

        res.json({
            token,
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                full_name: user.full_name,
                employee_id: user.employee_id,
                is_first_login: user.is_first_login ?? true,
                status: user.status
            }
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── POST /api/auth/logout ────────────────────────────────────────
router.post('/logout', auth, async (req, res) => {
    try {
        const token = req.token;
        const decoded = jwt.decode(token);
        const expiresAt = decoded?.exp
            ? new Date(decoded.exp * 1000)
            : new Date(Date.now() + 8 * 60 * 60 * 1000);

        await pool.query(
            'INSERT INTO token_blacklist (token, expires_at) VALUES ($1, $2) ON CONFLICT (token) DO NOTHING',
            [token, expiresAt]
        );

        res.json({ message: 'Logged out successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── POST /api/auth/change-password ──────────────────────────────
router.post('/change-password', auth, async (req, res) => {
    const { current_password, new_password } = req.body;
    try {
        if (!new_password || new_password.length < 8) {
            return res.status(400).json({ error: 'New password must be at least 8 characters' });
        }

        const result = await pool.query('SELECT * FROM profiles WHERE id = $1', [req.user.id]);
        if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

        const user = result.rows[0];

        // Verify current password (not required on first login)
        if (!user.is_first_login) {
            if (!current_password) {
                return res.status(400).json({ error: 'Current password is required' });
            }
            const isMatch = await bcrypt.compare(current_password, user.password_hash);
            if (!isMatch) {
                return res.status(400).json({ error: 'Current password is incorrect' });
            }
        }

        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        await pool.query(
            'UPDATE profiles SET password_hash = $1, is_first_login = FALSE, updated_at = NOW() WHERE id = $2',
            [password_hash, user.id]
        );

        await logManualAction({
            email: user.email, name: user.email,
            action: 'Password Changed', module: 'Authentication',
            ip: req.ip
        });

        res.json({ message: 'Password changed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── POST /api/auth/forgot-password ──────────────────────────────
router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    try {
        const result = await pool.query('SELECT * FROM profiles WHERE email = $1', [email]);
        // Always return success to prevent email enumeration
        if (result.rows.length === 0) {
            return res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
        }

        const user = result.rows[0];
        const token = uuidv4();
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        // Invalidate old tokens for this user
        await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE profile_id = $1', [user.id]);

        await pool.query(
            'INSERT INTO password_reset_tokens (profile_id, token, expires_at) VALUES ($1, $2, $3)',
            [user.id, token, expiresAt]
        );

        const resetLink = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password?token=${token}`;

        // Get employee name if available
        const emp = await pool.query('SELECT full_name FROM employees WHERE email = $1', [email]);
        const name = emp.rows[0]?.full_name || email.split('@')[0];

        // Send email (non-fatal if SMTP not configured)
        try {
            await sendPasswordResetEmail({ to: email, name, resetLink });
        } catch (emailErr) {
            console.warn('[Email] Password reset email failed (SMTP may not be configured):', emailErr.message);
            console.log(`[Debug] Reset link for ${email}: ${resetLink}`);
        }

        res.json({ message: 'If an account with that email exists, a reset link has been sent.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── POST /api/auth/reset-password ───────────────────────────────
router.post('/reset-password', async (req, res) => {
    const { token, new_password } = req.body;
    try {
        if (!new_password || new_password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }

        const result = await pool.query(
            'SELECT * FROM password_reset_tokens WHERE token = $1 AND used = FALSE AND expires_at > NOW()',
            [token]
        );

        if (result.rows.length === 0) {
            return res.status(400).json({ error: 'Reset link is invalid or has expired' });
        }

        const resetRecord = result.rows[0];
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(new_password, salt);

        await pool.query(
            'UPDATE profiles SET password_hash = $1, is_first_login = FALSE, updated_at = NOW() WHERE id = $2',
            [password_hash, resetRecord.profile_id]
        );

        // Mark token as used
        await pool.query('UPDATE password_reset_tokens SET used = TRUE WHERE id = $1', [resetRecord.id]);

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// ─── GET /api/auth/me ─────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT p.id, p.email, p.role, p.employee_id, p.is_first_login, p.status,
                   e.full_name, e.department, e.avatar_url,
                   e.id AS employee_uuid
            FROM profiles p
            LEFT JOIN employees e ON p.email = e.email
            WHERE p.id = $1
        `, [req.user.id]);
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
