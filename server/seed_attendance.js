const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    try {
        console.log('🌱 Seeding attendance data...');

        // 1. Get all employees
        const emps = await pool.query('SELECT id FROM employees');
        const employeeIds = emps.rows.map(r => r.id);

        if (employeeIds.length === 0) {
            console.log('❌ No employees found. Please add employees first.');
            return;
        }

        // 2. Clear existing attendance (optional, but requested "refresh")
        await pool.query('DELETE FROM attendance');
        console.log('✅ Cleared old attendance records.');

        // 3. Generate data for the last 7 days
        const statuses = ['Present', 'Present', 'Present', 'Late', 'Present'];
        const locations = ['Office', 'Office', 'Office', 'Remote', 'Office'];

        for (let i = 0; i < 7; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);

            // Skip weekends
            if (date.getDay() === 0 || date.getDay() === 6) continue;

            for (const empId of employeeIds) {
                // Randomize if they "checked in"
                if (Math.random() > 0.1) {
                    const status = statuses[Math.floor(Math.random() * statuses.length)];
                    const location = locations[Math.floor(Math.random() * locations.length)];

                    // Check-in around 9:00 AM
                    const checkIn = new Date(date);
                    checkIn.setHours(8, 30 + Math.floor(Math.random() * 60), 0);

                    // Check-out around 6:00 PM
                    const checkOut = new Date(date);
                    checkOut.setHours(17, 30 + Math.floor(Math.random() * 90), 0);

                    const checkout_location = location; // For seeding, we'll use same as check-in

                    await pool.query(
                        'INSERT INTO attendance (employee_id, check_in, check_out, status, location, checkout_location) VALUES ($1, $2, $3, $4, $5, $6)',
                        [empId, checkIn, checkOut, status, location, checkout_location]
                    );
                }
            }
        }

        console.log('✅ Seeded attendance records successfully!');
    } catch (err) {
        console.error('❌ Error seeding data:', err);
    } finally {
        await pool.end();
    }
}

seed();
