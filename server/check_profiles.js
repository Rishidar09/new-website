const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const profCount = await pool.query("SELECT count(*) FROM profiles");
        console.log('Total profiles:', profCount.rows[0].count);

        const empCount = await pool.query("SELECT count(*) FROM employees");
        console.log('Total employees:', empCount.rows[0].count);

        const orphans = await pool.query("SELECT p.email FROM profiles p LEFT JOIN employees e ON p.email = e.email WHERE e.email IS NULL");
        console.log('Profiles without employees:', JSON.stringify(orphans.rows, null, 2));

        const sampleProf = await pool.query("SELECT email, role FROM profiles LIMIT 1");
        console.log('Sample Profile:', sampleProf.rows[0]);

        const sampleEmp = await pool.query("SELECT email, full_name, department FROM employees LIMIT 1");
        console.log('Sample Employee:', sampleEmp.rows[0]);

    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await pool.end();
    }
}
check();
