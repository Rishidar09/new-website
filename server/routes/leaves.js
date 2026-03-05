const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');
const { auditLogger } = require('../middleware/auditLogger');
const { sendLeaveStatusEmail } = require('../services/emailService');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Configure Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/leaves/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage });

router.use(auditLogger('Leave Management'));

// @route   GET api/leaves
router.get('/', auth, async (req, res) => {
    try {
        // If not HR, only show own leaves
        let query = 'SELECT l.*, e.full_name, e.department, e.avatar_url FROM leaves l JOIN employees e ON l.employee_id = e.id WHERE 1=1';
        let params = [];
        let pIndex = 1;

        if (req.user.role !== 'hr') {
            const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
            if (emp.rows.length > 0) {
                query += ` AND l.employee_id = $${pIndex++}`;
                params.push(emp.rows[0].id);
            } else {
                return res.json([]);
            }
        } else {
            // HR filters
            const { status, department } = req.query;
            if (status && status !== 'All' && status !== 'All Status' && status !== 'All Requests') {
                query += ` AND l.status = $${pIndex++}`;
                params.push(status);
            }
            if (department && department !== 'All' && department !== 'All Departments') {
                query += ` AND e.department = $${pIndex++}`;
                params.push(department);
            }
        }

        query += ' ORDER BY l.created_at DESC';
        const leaves = await pool.query(query, params);
        res.json(leaves.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/leaves
router.post('/', auth, upload.single('attachment'), async (req, res) => {
    const { leave_type, start_date, end_date, days, reason } = req.body;
    const attachment_url = req.file ? `/uploads/leaves/${req.file.filename}` : req.body.attachment_url;

    try {
        // Automatically find employee_id from current user email if not provided
        let { employee_id } = req.body;
        if (!employee_id) {
            const emp = await pool.query('SELECT id FROM employees WHERE email = $1', [req.user.email]);
            if (emp.rows.length === 0) return res.status(404).json({ error: 'Employee profile not found' });
            employee_id = emp.rows[0].id;
        }

        const newLeave = await pool.query(
            'INSERT INTO leaves (employee_id, leave_type, start_date, end_date, days, reason, attachment_url) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            [employee_id, leave_type, start_date, end_date, days, reason, attachment_url]
        );
        res.json(newLeave.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   PATCH api/leaves/:id
router.patch('/:id', auth, authorize(['hr']), async (req, res) => {
    const { status, remarks } = req.body;
    try {
        const result = await pool.query(
            'UPDATE leaves SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3 RETURNING *',
            [status, req.user.id, req.params.id]
        );
        const updatedLeave = result.rows[0];

        // Send email notification to employee
        try {
            const empData = await pool.query(`
                SELECT e.full_name, e.email, l.leave_type, l.start_date, l.end_date
                FROM leaves l JOIN employees e ON l.employee_id = e.id
                WHERE l.id = $1
            `, [req.params.id]);

            if (empData.rows.length > 0) {
                const emp = empData.rows[0];
                await sendLeaveStatusEmail({
                    to: emp.email,
                    name: emp.full_name,
                    status,
                    leaveType: emp.leave_type,
                    fromDate: emp.start_date,
                    toDate: emp.end_date,
                    remarks: remarks || ''
                });
            }
        } catch (emailErr) {
            console.warn('[Email] Leave notification failed (non-critical):', emailErr.message);
        }

        res.json(updatedLeave);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
