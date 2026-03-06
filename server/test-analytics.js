const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function test() {
    try {
        console.log('1. Headcount');
        await pool.query('SELECT COUNT(*) FROM employees');

        console.log('2. Dept Breakdown');
        await pool.query('SELECT department as name, COUNT(*) as count FROM employees GROUP BY department');

        console.log('3. Leave Stats');
        await pool.query('SELECT leave_type as name, COUNT(*) as value FROM leaves GROUP BY leave_type');

        console.log('4. Absentees');
        const currentMonth = new Date().getMonth() + 1;
        await pool.query(`
            SELECT e.full_name as name, COUNT(*) as count 
            FROM leaves l 
            JOIN employees e ON l.employee_id = e.id 
            WHERE l.status = 'Approved' 
            AND EXTRACT(MONTH FROM l.start_date) = $1
            GROUP BY e.full_name
            ORDER BY count DESC
            LIMIT 5
        `, [currentMonth]);

        console.log('5. Avg Tenure');
        await pool.query(`
            SELECT AVG(EXTRACT(YEAR FROM AGE(NOW(), joining_date))) as avg_tenure 
            FROM employees 
            WHERE status = 'Active'
        `);

        console.log('6. Joining Trend');
        await pool.query(`
            SELECT 
                TO_CHAR(joining_date, 'Mon') as month,
                COUNT(*) as joining,
                (SELECT COUNT(*) FROM employees WHERE status = 'Inactive' AND TO_CHAR(joining_date, 'Mon') = TO_CHAR(e.joining_date, 'Mon')) as exit
            FROM employees e
            WHERE joining_date >= NOW() - INTERVAL '6 months'
            GROUP BY TO_CHAR(joining_date, 'Mon'), DATE_TRUNC('month', joining_date)
            ORDER BY DATE_TRUNC('month', joining_date)
        `);

        console.log('✅ All analytics queries passed!');
        process.exit(0);
    } catch (err) {
        console.error('❌ Query failed:', err.message);
        process.exit(1);
    }
}

test();
