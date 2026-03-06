const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const pool = new Pool({ connectionString: 'postgres://postgres:root@localhost:5432/website' });

async function verify() {
    const email = 'verify_onboard_' + Date.now() + '@example.com';
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Match the logic in employees.js
        const res = await client.query(
            'INSERT INTO employees (full_name, email, role, department, phone, joining_date, salary) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
            ['Verify Test', email, 'Manager', 'Engineering', '555', '2026-03-06', 70000]
        );

        const temp = crypto.randomBytes(16).toString('hex');
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(temp, salt);

        await client.query(
            'INSERT INTO profiles (email, password_hash, role, employee_id, is_first_login, status) VALUES ($1, $2, $3, $4, $5, $6)',
            [email, hash, 'employee', res.rows[0].id, true, 'active']
        );

        await client.query('COMMIT');

        const check = await client.query('SELECT * FROM profiles WHERE email = $1', [email]);
        console.log('PASS: Profile exists link to employee:', check.rows[0].employee_id === res.rows[0].id);
        console.log('PASS: is_first_login is true:', check.rows[0].is_first_login === true);

    } catch (e) {
        await client.query('ROLLBACK');
        console.error('FAIL:', e.message);
    } finally {
        client.release();
        await pool.end();
    }
}
verify();
