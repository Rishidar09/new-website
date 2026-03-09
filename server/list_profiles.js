const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const profs = await pool.query("SELECT email, role, status FROM profiles");
        console.log('Profiles:', JSON.stringify(profs.rows, null, 2));
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await pool.end();
    }
}
check();
