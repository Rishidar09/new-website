const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function checkHR() {
    const res = await pool.query("SELECT email, role, status, failed_login_attempts, locked_at FROM profiles WHERE role = 'hr'");
    console.log(JSON.stringify(res.rows, null, 2));
    await pool.end();
}
checkHR().catch(console.error);
