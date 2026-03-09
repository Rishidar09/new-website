const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// ─── Get analytics dashboard data (HR) ──────────────────────────
const getAnalytics = async (req, res) => {
    try {
        const headcount = await pool.query('SELECT COUNT(*) FROM employees WHERE status = \'Active\'');

        const deptBreakdown = await pool.query(
            'SELECT department as name, COUNT(*) as count FROM employees WHERE status = \'Active\' GROUP BY department'
        );

        const leaveBreakdown = await pool.query(
            'SELECT leave_type as name, COUNT(*) as value FROM leaves GROUP BY leave_type'
        );

        const newEmployees = await pool.query(
            'SELECT COUNT(*) FROM employees WHERE joining_date >= NOW() - INTERVAL \'30 days\''
        );

        const upcomingBirthdays = await pool.query(`
            SELECT full_name as name, role, TO_CHAR(dob, 'Mon DD') as date, avatar_url as avatar
            FROM employees 
            WHERE dob IS NOT NULL 
            AND (
                EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM NOW())
                OR EXTRACT(MONTH FROM dob) = EXTRACT(MONTH FROM (NOW() + INTERVAL '1 month'))
            )
            ORDER BY EXTRACT(MONTH FROM dob), EXTRACT(DAY FROM dob)
            LIMIT 5
        `);

        const recentLeaves = await pool.query(`
            SELECT l.id, e.full_name as name, l.leave_type as type, l.status, e.avatar_url as avatar
            FROM leaves l
            JOIN employees e ON l.employee_id = e.id
            ORDER BY l.created_at DESC
            LIMIT 5
        `);

        const announcementsData = await pool.query(`
            SELECT a.id, a.title, a.content, e.full_name as author_name, e.avatar_url as author_avatar, a.created_at
            FROM announcements a
            LEFT JOIN employees e ON a.author_id = e.id
            ORDER BY a.created_at DESC
            LIMIT 5
        `);

        res.json({
            headcount: parseInt(headcount.rows[0]?.count || 0),
            newEmployeesCount: parseInt(newEmployees.rows[0]?.count || 0),
            activeLeaves: (leaveBreakdown.rows || []).reduce((acc, curr) => acc + (parseInt(curr.value) || 0), 0),
            upcomingBirthdays: upcomingBirthdays.rows,
            recentLeaves: recentLeaves.rows,
            announcements: announcementsData.rows,
            deptData: deptBreakdown.rows,
            leaveData: leaveBreakdown.rows
        });
    } catch (err) {
        console.error('[Analytics Error]:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
};

module.exports = { getAnalytics };
