const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        await pool.query('SELECT a.id, a.title, e.full_name FROM announcements a LEFT JOIN employees e ON a.author_id = e.id LIMIT 1');
        console.log('Announcements OK');
    } catch (e) { console.error('Ann:', e.message); }

    try {
        await pool.query('SELECT leave_type as name, COUNT(*) as value FROM leaves GROUP BY leave_type');
        console.log('Leaves Pie OK');
    } catch (e) { console.error('Leaves Pie:', e.message); }

    try {
        await pool.query(`
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
        console.log('Birthdays OK');
    } catch (e) { console.error('Birthdays:', e.message); }

    await pool.end();
}
check();
