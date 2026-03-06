const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function resetHR() {
    try {
        const newPassword = 'Admin@1234';
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(newPassword, salt);

        // Reset all HR accounts
        const res = await pool.query(
            "UPDATE profiles SET password_hash = $1, failed_login_attempts = 0, locked_at = NULL WHERE role = 'hr' RETURNING email",
            [hash]
        );

        console.log('✅ Password reset for HR accounts:');
        res.rows.forEach(r => console.log(`  - ${r.email} → Password: ${newPassword}`));
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}
resetHR();
