const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/verifihire'
});

async function run() {
    try {
        console.log('Adding status column...');
        await pool.query("ALTER TABLE meetings ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active'");
        console.log('Success!');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

run();
