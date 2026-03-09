const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function check() {
    try {
        const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', JSON.stringify(res.rows.map(r => r.table_name), null, 2));
    } catch (e) {
        console.error('DB Error:', e.message);
    } finally {
        await pool.end();
    }
}
check();
