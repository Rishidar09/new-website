const { Pool } = require('pg');
const { createOnboardingCaseFromTemplate } = require('../services/onboardingService');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const resolveEmployee = async (req) => {
    if (req.user?.employee_uuid) {
        const emp = await pool.query('SELECT id, full_name FROM employees WHERE id = $1', [req.user.employee_uuid]);
        if (emp.rows[0]) return emp.rows[0];
    }

    const emp = await pool.query(
        `SELECT e.id, e.full_name
         FROM employees e
         JOIN profiles p ON e.email = p.email OR e.employee_id = p.employee_id
         WHERE p.id = $1
         LIMIT 1`,
        [req.user.id]
    );
    return emp.rows[0] || null;
};

const getTemplates = async (req, res) => {
    try {
        const templates = await pool.query(
            `SELECT t.*, e.full_name AS created_by_name,
                    COUNT(tt.id)::int AS task_count
             FROM onboarding_templates t
             LEFT JOIN employees e ON e.id = t.created_by
             LEFT JOIN onboarding_template_tasks tt ON tt.template_id = t.id
             GROUP BY t.id, e.full_name
             ORDER BY t.created_at DESC`
        );

        const tasks = await pool.query(
            `SELECT * FROM onboarding_template_tasks
             ORDER BY sort_order ASC, created_at ASC`
        );

        const taskMap = tasks.rows.reduce((acc, row) => {
            if (!acc[row.template_id]) acc[row.template_id] = [];
            acc[row.template_id].push(row);
            return acc;
        }, {});

        res.json(templates.rows.map((t) => ({ ...t, tasks: taskMap[t.id] || [] })));
    } catch (err) {
        console.error('getTemplates error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const createTemplate = async (req, res) => {
    const { name, description, tasks = [] } = req.body;

    if (!name || !Array.isArray(tasks) || tasks.length === 0) {
        return res.status(400).json({ error: 'name and at least one task are required' });
    }

    const client = await pool.connect();
    try {
        const creator = await resolveEmployee(req);

        await client.query('BEGIN');

        const templateRes = await client.query(
            `INSERT INTO onboarding_templates (name, description, created_by)
             VALUES ($1, $2, $3)
             RETURNING *`,
            [name, description || null, creator?.id || null]
        );

        const template = templateRes.rows[0];

        for (let i = 0; i < tasks.length; i += 1) {
            const task = tasks[i];
            if (!task.title) continue;
            await client.query(
                `INSERT INTO onboarding_template_tasks
                 (template_id, title, description, requires_document, sort_order)
                 VALUES ($1, $2, $3, $4, $5)`,
                [template.id, task.title, task.description || null, !!task.requires_document, i + 1]
            );
        }

        await client.query('COMMIT');
        res.json(template);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('createTemplate error:', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

const assignTemplate = async (req, res) => {
    const { employee_id, template_id } = req.body;

    if (!employee_id || !template_id) {
        return res.status(400).json({ error: 'employee_id and template_id are required' });
    }

    const client = await pool.connect();
    try {
        const assigner = await resolveEmployee(req);

        await client.query('BEGIN');
        const created = await createOnboardingCaseFromTemplate({
            client,
            employeeId: employee_id,
            templateId: template_id,
            assignedBy: assigner?.id || null
        });
        await client.query('COMMIT');

        res.json(created);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('assignTemplate error:', err.message);
        res.status(500).json({ error: err.message || 'Server error' });
    } finally {
        client.release();
    }
};

const getActiveCases = async (req, res) => {
    try {
        const cases = await pool.query(
            `SELECT oc.*, e.full_name AS employee_name, e.email AS employee_email,
                    t.name AS template_name,
                    COALESCE(SUM(CASE WHEN oct.is_completed THEN 1 ELSE 0 END), 0)::int AS completed_tasks,
                    COUNT(oct.id)::int AS total_tasks,
                    CASE WHEN COUNT(oct.id) = 0 THEN 0
                         ELSE ROUND((SUM(CASE WHEN oct.is_completed THEN 1 ELSE 0 END)::numeric * 100) / COUNT(oct.id), 0)
                    END::int AS completion_percentage
             FROM onboarding_cases oc
             JOIN employees e ON e.id = oc.employee_id
             JOIN onboarding_templates t ON t.id = oc.template_id
             LEFT JOIN onboarding_case_tasks oct ON oct.case_id = oc.id
             WHERE oc.status = 'active'
             GROUP BY oc.id, e.full_name, e.email, t.name
             ORDER BY oc.created_at DESC`
        );

        const tasks = await pool.query(
            `SELECT oct.*, e.full_name AS completed_by_name
             FROM onboarding_case_tasks oct
             LEFT JOIN employees e ON e.id = oct.completed_by
             ORDER BY oct.sort_order ASC, oct.created_at ASC`
        );

        const taskMap = tasks.rows.reduce((acc, row) => {
            if (!acc[row.case_id]) acc[row.case_id] = [];
            acc[row.case_id].push(row);
            return acc;
        }, {});

        res.json(cases.rows.map((c) => ({ ...c, tasks: taskMap[c.id] || [] })));
    } catch (err) {
        console.error('getActiveCases error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateCaseStatusIfCompleted = async (client, caseId) => {
    const result = await client.query(
        `SELECT COUNT(*)::int AS total,
                SUM(CASE WHEN is_completed THEN 1 ELSE 0 END)::int AS done
         FROM onboarding_case_tasks
         WHERE case_id = $1`,
        [caseId]
    );

    const total = result.rows[0]?.total || 0;
    const done = result.rows[0]?.done || 0;

    if (total > 0 && done === total) {
        await client.query(
            `UPDATE onboarding_cases
             SET status = 'completed', completed_at = NOW(), updated_at = NOW()
             WHERE id = $1`,
            [caseId]
        );
    } else {
        await client.query(
            `UPDATE onboarding_cases
             SET status = 'active', completed_at = NULL, updated_at = NOW()
             WHERE id = $1`,
            [caseId]
        );
    }
};

const hrUpdateTask = async (req, res) => {
    const { id } = req.params;
    const { is_completed } = req.body;

    if (typeof is_completed !== 'boolean') {
        return res.status(400).json({ error: 'is_completed must be boolean' });
    }

    const client = await pool.connect();
    try {
        const actor = await resolveEmployee(req);
        await client.query('BEGIN');

        const updated = await client.query(
            `UPDATE onboarding_case_tasks
             SET is_completed = $1,
                 completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
                 completed_by = CASE WHEN $1 THEN $2 ELSE NULL END,
                 updated_at = NOW()
             WHERE id = $3
             RETURNING *`,
            [is_completed, actor?.id || null, id]
        );

        if (updated.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Task not found' });
        }

        await updateCaseStatusIfCompleted(client, updated.rows[0].case_id);

        await client.query('COMMIT');
        res.json(updated.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('hrUpdateTask error:', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

const getMyChecklist = async (req, res) => {
    try {
        const me = await resolveEmployee(req);
        if (!me) return res.status(404).json({ error: 'Employee not found' });

        const caseRes = await pool.query(
            `SELECT oc.*, t.name AS template_name,
                    COALESCE(SUM(CASE WHEN oct.is_completed THEN 1 ELSE 0 END), 0)::int AS completed_tasks,
                    COUNT(oct.id)::int AS total_tasks,
                    CASE WHEN COUNT(oct.id) = 0 THEN 0
                         ELSE ROUND((SUM(CASE WHEN oct.is_completed THEN 1 ELSE 0 END)::numeric * 100) / COUNT(oct.id), 0)
                    END::int AS completion_percentage
             FROM onboarding_cases oc
             JOIN onboarding_templates t ON t.id = oc.template_id
             LEFT JOIN onboarding_case_tasks oct ON oct.case_id = oc.id
             WHERE oc.employee_id = $1
             GROUP BY oc.id, t.name
             ORDER BY oc.created_at DESC
             LIMIT 1`,
            [me.id]
        );

        if (caseRes.rows.length === 0) {
            return res.json({ case: null, tasks: [] });
        }

        const myCase = caseRes.rows[0];
        const tasksRes = await pool.query(
            `SELECT *
             FROM onboarding_case_tasks
             WHERE case_id = $1
             ORDER BY sort_order ASC, created_at ASC`,
            [myCase.id]
        );

        res.json({ case: myCase, tasks: tasksRes.rows });
    } catch (err) {
        console.error('getMyChecklist error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const getMySummary = async (req, res) => {
    try {
        const me = await resolveEmployee(req);
        if (!me) return res.status(404).json({ error: 'Employee not found' });

        const result = await pool.query(
            `SELECT oc.id,
                    oc.status,
                    COALESCE(SUM(CASE WHEN oct.is_completed THEN 1 ELSE 0 END), 0)::int AS completed_tasks,
                    COUNT(oct.id)::int AS total_tasks,
                    CASE WHEN COUNT(oct.id) = 0 THEN 0
                         ELSE ROUND((SUM(CASE WHEN oct.is_completed THEN 1 ELSE 0 END)::numeric * 100) / COUNT(oct.id), 0)
                    END::int AS completion_percentage
             FROM onboarding_cases oc
             LEFT JOIN onboarding_case_tasks oct ON oct.case_id = oc.id
             WHERE oc.employee_id = $1
             GROUP BY oc.id
             ORDER BY oc.created_at DESC
             LIMIT 1`,
            [me.id]
        );

        if (result.rows.length === 0) {
            return res.json({ has_case: false, completion_percentage: 0, completed_tasks: 0, total_tasks: 0 });
        }

        res.json({ has_case: true, ...result.rows[0] });
    } catch (err) {
        console.error('getMySummary error:', err.message);
        res.status(500).json({ error: 'Server error' });
    }
};

const employeeUpdateTask = async (req, res) => {
    const { id } = req.params;
    const isCompletedRaw = req.body.is_completed;

    if (typeof isCompletedRaw === 'undefined') {
        return res.status(400).json({ error: 'is_completed is required' });
    }

    const is_completed = isCompletedRaw === true || isCompletedRaw === 'true';

    const client = await pool.connect();
    try {
        const me = await resolveEmployee(req);
        if (!me) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        await client.query('BEGIN');

        const current = await client.query(
            `SELECT oct.*, oc.employee_id
             FROM onboarding_case_tasks oct
             JOIN onboarding_cases oc ON oc.id = oct.case_id
             WHERE oct.id = $1`,
            [id]
        );

        if (current.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Task not found' });
        }

        const task = current.rows[0];
        if (task.employee_id !== me.id) {
            await client.query('ROLLBACK');
            return res.status(403).json({ error: 'Forbidden' });
        }

        const uploadedDoc = req.file ? `/uploads/onboarding/${req.file.filename}` : null;
        const documentUrl = uploadedDoc || task.document_url;

        if (is_completed && task.requires_document && !documentUrl) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Document upload is required for this task' });
        }

        const updated = await client.query(
            `UPDATE onboarding_case_tasks
             SET is_completed = $1,
                 completed_at = CASE WHEN $1 THEN NOW() ELSE NULL END,
                 completed_by = CASE WHEN $1 THEN $2 ELSE NULL END,
                 document_url = $3,
                 updated_at = NOW()
             WHERE id = $4
             RETURNING *`,
            [is_completed, me.id, documentUrl, id]
        );

        await updateCaseStatusIfCompleted(client, task.case_id);
        await client.query('COMMIT');

        res.json(updated.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('employeeUpdateTask error:', err.message);
        res.status(500).json({ error: 'Server error' });
    } finally {
        client.release();
    }
};

module.exports = {
    getTemplates,
    createTemplate,
    assignTemplate,
    getActiveCases,
    hrUpdateTask,
    getMyChecklist,
    getMySummary,
    employeeUpdateTask
};
