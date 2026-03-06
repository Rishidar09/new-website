const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { auth, authorize } = require('../middleware/auth');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

router.get('/', auth, authorize(['hr']), async (req, res) => {
    try {
        // 1. Get Headcount
        const headcount = await pool.query('SELECT COUNT(*) FROM employees');

        // 2. Get Dept Breakdown
        const deptBreakdown = await pool.query(
            'SELECT department as name, COUNT(*) as count FROM employees GROUP BY department'
        );

        // 3. Get Leave Stats (Pie chart)
        const leaveBreakdown = await pool.query(
            'SELECT leave_type as name, COUNT(*) as value FROM leaves GROUP BY leave_type'
        );

        // 4. Get Absentees (Top 5 this month)
        const currentMonth = new Date().getMonth() + 1;
        const absentees = await pool.query(`
      SELECT e.full_name as name, COUNT(*) as count 
      FROM leaves l 
      JOIN employees e ON l.employee_id = e.id 
      WHERE l.status = 'Approved' 
      AND EXTRACT(MONTH FROM l.start_date) = $1
      GROUP BY e.full_name
      ORDER BY count DESC
      LIMIT 5
    `, [currentMonth]);

        // 5. Avg Tenure
        const avgTenure = await pool.query(`
            SELECT AVG(EXTRACT(YEAR FROM AGE(NOW(), joining_date))) as avg_tenure 
            FROM employees 
            WHERE status = 'Active'
        `);

        // 6. Joining Trend (Last 6 months)
        const joiningTrend = await pool.query(`
            WITH months AS (
                SELECT DATE_TRUNC('month', joining_date) as m
                FROM employees
                WHERE joining_date >= NOW() - INTERVAL '6 months'
                GROUP BY 1
            )
            SELECT 
                TO_CHAR(m, 'Mon') as month,
                (SELECT COUNT(*) FROM employees WHERE DATE_TRUNC('month', joining_date) = m AND status != 'Inactive') as joining,
                (SELECT COUNT(*) FROM employees WHERE DATE_TRUNC('month', joining_date) = m AND status = 'Inactive') as exit
            FROM months
            ORDER BY m
        `);

        res.json({
            headcount: parseInt(headcount.rows[0]?.count || 0),
            deptData: deptBreakdown.rows,
            leaveData: leaveBreakdown.rows,
            absentees: absentees.rows,
            attrition: 3.5, // Realistic mock for now
            openPositions: 8,
            avgTenure: parseFloat(avgTenure.rows[0]?.avg_tenure || 0).toFixed(1),
            trendData: joiningTrend.rows
        });
    } catch (err) {
        console.error('[Analytics Error]:', err.message);
        res.status(500).json({ error: 'Server error', details: err.message });
    }
});

module.exports = router;
