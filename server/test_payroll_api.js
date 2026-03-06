const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:root@localhost:5432/website' });

async function test() {
    try {
        const loginRes = await fetch('http://localhost:5001/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'balichak.suman@iit.org.in', password: '12345678' })
        });
        const loginData = await loginRes.json();

        if (!loginData.token) {
            console.error('Login failed:', loginData);
            return;
        }

        const payrollRes = await fetch('http://localhost:5001/api/payroll', {
            headers: { 'Authorization': `Bearer ${loginData.token}` }
        });

        const payrollData = await payrollRes.json();
        console.log('Payroll Response Status:', payrollRes.status);
        console.log('Payroll Data:', payrollData);

    } catch (e) {
        console.error('Test Error:', e.message);
    } finally {
        await pool.end();
    }
}
test();
