require('dotenv').config();
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fix() {
    try {
        console.log('Checking HR admin employee record...');
        const res = await pool.query("SELECT id FROM employees WHERE email = 'hr@indusinnovate.com'");

        if (res.rows.length === 0) {
            console.log('Creating employee record for HR admin...');
            await pool.query(
                "INSERT INTO employees (full_name, email, role, department, employee_id, status) VALUES ($1, $2, $3, $4, $5, $6)",
                ['HR Manager', 'hr@indusinnovate.com', 'HR Head', 'HR', 'IIT-HR-001', 'Active']
            );
            console.log('✅ Employee record created.');
        } else {
            console.log('ℹ️ HR employee record already exists.');
        }

        // Also ensure the profile has the correct employee_id if it was somehow null
        await pool.query(
            "UPDATE profiles SET employee_id = 'IIT-HR-001' WHERE email = 'hr@indusinnovate.com' AND employee_id IS NULL"
        );

        console.log('Database fix completed successfully.');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error during fix:', e);
        process.exit(1);
    }
}

fix();
