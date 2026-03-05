require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function setupDatabase() {
    try {
        console.log('━━━ IndusInnovate Database Migration ━━━');
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await pool.query(sql);
        console.log('✅ Schema applied successfully.');

        // ─── Default HR Admin ─────────────────────────────────
        const checkHR = await pool.query("SELECT * FROM profiles WHERE email = 'hr@indusinnovate.com'");
        if (checkHR.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('Admin@1234', salt);

            await pool.query(
                `INSERT INTO profiles (email, role, password_hash, employee_id, status, is_first_login)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['hr@indusinnovate.com', 'hr', hash, 'IIT-HR-001', 'active', true]
            );
            console.log('✅ Default HR admin created:');
            console.log('   Email:    hr@indusinnovate.com');
            console.log('   Password: Admin@1234');
            console.log('   Role:     hr');
            console.log('   ID:       IIT-HR-001');
        } else {
            console.log('ℹ️  HR admin already exists — skipping seed.');
        }

        // ─── Default Employee for testing ────────────────────────
        const checkEmp = await pool.query("SELECT * FROM profiles WHERE email = 'employee@indusinnovate.com'");
        if (checkEmp.rows.length === 0) {
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('Employee@1234', salt);

            await pool.query(
                `INSERT INTO profiles (email, role, password_hash, employee_id, status, is_first_login)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['employee@indusinnovate.com', 'employee', hash, 'IIT-EMP-001', 'active', true]
            );

            // Create employee record
            await pool.query(
                `INSERT INTO employees (full_name, email, role, department, employee_id, status)
                 VALUES ($1, $2, $3, $4, $5, $6)`,
                ['Demo Employee', 'employee@indusinnovate.com', 'Software Engineer', 'Engineering', 'IIT-EMP-001', 'Active']
            );

            console.log('✅ Default employee created:');
            console.log('   Email:    employee@indusinnovate.com');
            console.log('   Password: Employee@1234');
        } else {
            console.log('ℹ️  Demo employee already exists — skipping seed.');
        }

        console.log('━━━ Migration Complete ━━━');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
        process.exit(1);
    }
}

setupDatabase();
