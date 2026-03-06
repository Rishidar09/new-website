const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgres://postgres:12345@localhost:5432/website'
});

async function test() {
    try {
        const r = await pool.query("SELECT email, password_hash FROM profiles");
        console.log('Found', r.rows.length, 'users');
        for (const user of r.rows) {
            const pass = user.email === 'hr@indusinnovate.com' ? 'Admin@1234' : 'Employee@1234';
            const match = await bcrypt.compare(pass, user.password_hash);
            console.log(`User: ${user.email}, Password: ${pass}, Match: ${match}`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

test();
