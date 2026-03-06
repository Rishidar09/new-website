const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const fs = require('fs');
async function checkSchema() {
    try {
        let output = '';
        const tables = ['profiles', 'employees', 'leaves', 'holidays', 'documents', 'payroll', 'attendance', 'projects'];
        for (const table of tables) {
            output += `--- Table: ${table} ---\n`;
            const res = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name = $1`, [table]);
            output += res.rows.map(r => `${r.column_name} (${r.data_type})`).join(', ') + '\n\n';
        }
        fs.writeFileSync('schema_results.txt', output);
        console.log('✅ Schema written to schema_results.txt');
        process.exit(0);
    } catch (err) {
        console.error('❌ Check failed:', err.message);
        process.exit(1);
    }
}

checkSchema();
