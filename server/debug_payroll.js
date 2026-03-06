const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:root@localhost:5432/website' });

async function check() {
    try {
        const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'payroll'");
        console.log('Payroll Columns:');
        res.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });
    } catch (e) {
        console.error('Error:', e.message);
    } finally {
        await pool.end();
    }
}
check();
