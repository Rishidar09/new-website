require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function setupDatabase() {
    try {
        console.log('--- Database Migration Started ---');
        const sqlPath = path.join(__dirname, 'init.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');

        await pool.query(sql);
        console.log('✅ Tables created successfully.');

        // Create a default HR user for testing if none exists
        const checkHR = await pool.query("SELECT * FROM profiles WHERE email = 'hr@indusinnovate.com'");
        if (checkHR.rows.length === 0) {
            // Password is 'admin123' (hashed in real app, but this is setup)
            // bcrypt hash for 'admin123'
            const bcrypt = require('bcryptjs');
            const salt = await bcrypt.genSalt(10);
            const hash = await bcrypt.hash('admin123', salt);

            await pool.query(
                "INSERT INTO profiles (email, role, password_hash) VALUES ($1, $2, $3)",
                ['hr@indusinnovate.com', 'hr', hash]
            );
            console.log('✅ Default HR user created: hr@indusinnovate.com / admin123');
        }

        console.log('--- Database Migration Finished ---');
        process.exit(0);
    } catch (err) {
        console.error('❌ Migration Failed:', err);
        process.exit(1);
    }
}

setupDatabase();
