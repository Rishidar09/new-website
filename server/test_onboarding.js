const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgres://postgres:root@localhost:5432/website' });

async function test() {
    const testEmail = `tester_${Date.now()}@example.com`;
    console.log(`🚀 Testing creation for ${testEmail}...`);

    try {
        const res = await fetch('http://localhost:5001/api/employees', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + process.env.TEST_JWT // I'll need a JWT for HR
            },
            body: JSON.stringify({
                full_name: 'Test Onboarding',
                email: testEmail,
                role: 'Software Engineer',
                department: 'Engineering',
                phone: '1234567890',
                joining_date: '2026-03-06',
                salary: 50000
            })
        });

        const data = await res.json();
        console.log('API Response:', data);

        const profile = await pool.query('SELECT * FROM profiles WHERE email = $1', [testEmail]);
        if (profile.rows.length > 0) {
            console.log('✅ Profile created successfully!');
            console.log('Profile Data:', {
                email: profile.rows[0].email,
                role: profile.rows[0].role,
                is_first_login: profile.rows[0].is_first_login
            });
        } else {
            console.log('❌ Profile NOT created.');
        }

    } catch (e) {
        console.error('Test failed:', e.message);
    } finally {
        await pool.end();
    }
}

// I'll run this manually or via run_command after getting a JWT
// For speed, I'll just check the DB directly after a manual insertion via a similar script
