require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkEmployeeSalaries() {
    try {
        const result = await pool.query("SELECT id, full_name, salary FROM employees");
        console.log(JSON.stringify(result.rows, null, 2));
        process.exit(0);
    } catch (err) {
        console.error('Error checking salaries:', err.message);
        process.exit(1);
    }
}

checkEmployeeSalaries();
