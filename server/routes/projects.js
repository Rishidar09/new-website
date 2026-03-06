const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// --- Projects ---

// @route   GET api/projects
// @desc    Get all projects (HR) or assigned projects (Employee)
router.get('/', auth, async (req, res) => {
    try {
        let query;
        let params = [];

        if (req.user.role === 'hr') {
            query = `
                SELECT p.*, 
                (SELECT json_agg(e.full_name) FROM project_members pm JOIN employees e ON pm.employee_id = e.id WHERE pm.project_id = p.id) as team_names
                FROM projects p
                ORDER BY p.deadline ASC
            `;
        } else {
            query = `
                SELECT p.* 
                FROM projects p
                JOIN project_members pm ON p.id = pm.project_id
                WHERE pm.employee_id = $1
                ORDER BY p.deadline ASC
            `;
            params = [req.user.id];
        }

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   POST api/projects
// @desc    Create a new project (HR Only)
router.post('/', auth, authorize(['hr']), async (req, res) => {
    const { name, client, deadline, team } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO projects (name, client, deadline) VALUES ($1, $2, $3) RETURNING *",
            [name, client, deadline]
        );
        const project = result.rows[0];

        // Add team members
        if (team && team.length > 0) {
            for (const emp_id of team) {
                await pool.query(
                    "INSERT INTO project_members (project_id, employee_id) VALUES ($1, $2)",
                    [project.id, emp_id]
                );
            }
        }

        res.json(project);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/projects/:id
// @desc    Get project details with tasks and team
router.get('/:id', auth, async (req, res) => {
    try {
        const project = await pool.query("SELECT * FROM projects WHERE id = $1", [req.params.id]);
        if (project.rows.length === 0) return res.status(404).json({ error: 'Project not found' });

        const members = await pool.query(`
            SELECT e.id, e.full_name, e.department, pm.role 
            FROM project_members pm
            JOIN employees e ON pm.employee_id = e.id
            WHERE pm.project_id = $1
        `, [req.params.id]);

        const tasks = await pool.query("SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC", [req.params.id]);

        res.json({
            ...project.rows[0],
            members: members.rows,
            tasks: tasks.rows
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Tasks ---

// @route   POST api/projects/:id/tasks
router.post('/:id/tasks', auth, async (req, res) => {
    const { title, assignee_id, status } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO tasks (project_id, title, assignee_id, status) VALUES ($1, $2, $3, $4) RETURNING *",
            [req.params.id, title, assignee_id, status || 'todo']
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// --- Daily Reports ---

// @route   POST api/projects/:id/reports
// @desc    Submit daily report (Employee)
router.post('/:id/reports', auth, async (req, res) => {
    const { work_done, hours, blockers } = req.body;
    try {
        const result = await pool.query(
            "INSERT INTO daily_reports (project_id, employee_id, work_done, hours, blockers) VALUES ($1, $2, $3, $4, $5) RETURNING *",
            [req.params.id, req.user.id, work_done, hours, blockers]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/projects/:id/reports
// @desc    Get reports for a project
router.get('/:id/reports', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, e.full_name 
            FROM daily_reports r
            JOIN employees e ON r.employee_id = e.id
            WHERE r.project_id = $1
            ORDER BY r.created_at DESC
        `, [req.params.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

// @route   GET api/projects/my-reports
// @desc    Get user's report history
router.get('/reports/my', auth, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT r.*, p.name as project_name
            FROM daily_reports r
            JOIN projects p ON r.project_id = p.id
            WHERE r.employee_id = $1
            ORDER BY r.created_at DESC
        `, [req.user.id]);
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
