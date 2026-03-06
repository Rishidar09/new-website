const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const holidays = [
    // 2024
    { name: 'Republic Day', date: '2024-01-26', type: 'National' },
    { name: 'Holi', date: '2024-03-25', type: 'National' },
    { name: 'Good Friday', date: '2024-03-29', type: 'National' },
    { name: 'Id-ul-Fitr', date: '2024-04-11', type: 'National' },
    { name: 'Ram Navami', date: '2024-04-17', type: 'National' },
    { name: 'Buddha Purnima', date: '2024-05-23', type: 'National' },
    { name: 'Id-ul-Zuha (Bakrid)', date: '2024-06-17', type: 'National' },
    { name: 'Muharram', date: '2024-07-17', type: 'National' },
    { name: 'Independence Day', date: '2024-08-15', type: 'National' },
    { name: 'Janmashtami', date: '2024-08-26', type: 'National' },
    { name: 'Milad-un-Nabi', date: '2024-09-16', type: 'National' },
    { name: 'Mahatma Gandhi Birthday', date: '2024-10-02', type: 'National' },
    { name: 'Dussehra', date: '2024-10-12', type: 'National' },
    { name: 'Diwali', date: '2024-10-31', type: 'National' },
    { name: 'Guru Nanak Birthday', date: '2024-11-15', type: 'National' },
    { name: 'Christmas Day', date: '2024-12-25', type: 'National' },

    // 2025
    { name: 'Republic Day', date: '2025-01-26', type: 'National' },
    { name: 'Holi', date: '2025-03-14', type: 'National' },
    { name: 'Id-ul-Fitr', date: '2025-03-31', type: 'National' },
    { name: 'Ram Navami', date: '2025-04-06', type: 'National' },
    { name: 'Good Friday', date: '2025-04-18', type: 'National' },
    { name: 'Buddha Purnima', date: '2025-05-12', type: 'National' },
    { name: 'Id-ul-Zuha (Bakrid)', date: '2025-06-07', type: 'National' },
    { name: 'Muharram', date: '2025-07-06', type: 'National' },
    { name: 'Independence Day', date: '2025-08-15', type: 'National' },
    { name: 'Janmashtami', date: '2025-08-16', type: 'National' },
    { name: 'Milad-un-Nabi', date: '2025-09-05', type: 'National' },
    { name: 'Mahatma Gandhi Birthday', date: '2025-10-02', type: 'National' },
    { name: 'Dussehra', date: '2025-10-02', type: 'National' },
    { name: 'Diwali', date: '2025-10-20', type: 'National' },
    { name: 'Guru Nanak Birthday', date: '2025-11-05', type: 'National' },
    { name: 'Christmas Day', date: '2025-12-25', type: 'National' },

    // 2026
    { name: 'Republic Day', date: '2026-01-26', type: 'National' },
    { name: 'Id-ul-Fitr', date: '2026-03-20', type: 'National' },
    { name: 'Ram Navami', date: '2026-03-26', type: 'National' },
    { name: 'Holi', date: '2026-03-04', type: 'National' },
    { name: 'Good Friday', date: '2026-04-03', type: 'National' },
    { name: 'Buddha Purnima', date: '2026-05-01', type: 'National' },
    { name: 'Id-ul-Zuha (Bakrid)', date: '2026-05-27', type: 'National' },
    { name: 'Muharram', date: '2026-06-25', type: 'National' },
    { name: 'Independence Day', date: '2026-08-15', type: 'National' },
    { name: 'Janmashtami', date: '2026-09-04', type: 'National' },
    { name: 'Milad-un-Nabi', date: '2026-08-25', type: 'National' },
    { name: 'Mahatma Gandhi Birthday', date: '2026-10-02', type: 'National' },
    { name: 'Dussehra', date: '2026-10-20', type: 'National' },
    { name: 'Diwali', date: '2026-11-08', type: 'National' },
    { name: 'Guru Nanak Birthday', date: '2026-11-24', type: 'National' },
    { name: 'Christmas Day', date: '2026-12-25', type: 'National' }
];

async function seed() {
    console.log('Seeding holidays...');
    try {
        for (const h of holidays) {
            await pool.query(
                'INSERT INTO holidays (name, date, type) VALUES ($1, $2, $3) ON CONFLICT (name, date) DO NOTHING',
                [h.name, h.date, h.type]
            );
        }
        console.log('Holidays seeded successfully!');
    } catch (err) {
        if (err.code === '42701' || err.code === '42P07' || err.message.includes('ON CONFLICT')) {
            // If unique constraint is missing, just try regular insert and catch errors
            for (const h of holidays) {
                try {
                    await pool.query(
                        'INSERT INTO holidays (name, date, type) VALUES ($1, $2, $3)',
                        [h.name, h.date, h.type]
                    );
                } catch (e) {
                    // Ignore dupes
                }
            }
            console.log('Holidays seeded (handled potential lack of unique constraint).');
        } else {
            console.error('Seeding failed:', err);
        }
    } finally {
        await pool.end();
    }
}

seed();
