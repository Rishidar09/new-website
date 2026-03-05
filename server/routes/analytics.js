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

        res.json({
            headcount: parseInt(headcount.rows[0].count),
            deptData: deptBreakdown.rows,
            leaveData: leaveBreakdown.rows,
            absentees: absentees.rows,
            attrition: 4.2, // Mock for now
            openPositions: 12 // Mock for now
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

module.exports = router;
