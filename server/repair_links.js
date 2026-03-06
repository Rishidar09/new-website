const { Pool } = require('pg');
require('dotenv').config();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fullRepair() {
    try {
        console.log('=== Full Profile-Employee Link Repair ===\n');

        // 1. Show current state
        const state = await pool.query(`
            SELECT p.id as profile_id, p.email, p.role, p.employee_id as profile_emp_id,
                   e.id as emp_uuid, e.employee_id as emp_string_id, e.full_name
            FROM profiles p
            LEFT JOIN employees e ON p.email = e.email
            ORDER BY p.email
        `);

        for (const r of state.rows) {
            const linked = r.emp_uuid && String(r.profile_emp_id) === String(r.emp_uuid);
            console.log(`[${linked ? '✅ OK' : '❌ BROKEN'}] ${r.email}`);
            console.log(`    profile.employee_id = ${r.profile_emp_id}`);
            console.log(`    employees.id (UUID) = ${r.emp_uuid || 'NO EMPLOYEE RECORD'}`);
        }

        // 2. Fix profiles that have an employee record with matching email
        console.log('\n--- Fixing broken links ---');
        const toFix = state.rows.filter(r => r.emp_uuid && String(r.profile_emp_id) !== String(r.emp_uuid));
        for (const r of toFix) {
            await pool.query('UPDATE profiles SET employee_id = $1 WHERE id = $2', [r.emp_uuid, r.profile_id]);
            console.log(`✅ Fixed ${r.email}: profile.employee_id -> ${r.emp_uuid}`);
        }

        // 3. Create employee records for orphaned profiles (no matching employee by email)
        console.log('\n--- Creating missing employee records ---');
        const orphans = state.rows.filter(r => !r.emp_uuid);
        for (const r of orphans) {
            const name = r.email.split('@')[0].replace(/[._]/g, ' ')
                .split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            const empRole = r.role === 'hr' ? 'HR Manager' : 'Employee';
            const dept = r.role === 'hr' ? 'Human Resources' : 'General';
            const empStringId = `IIT-${r.role === 'hr' ? 'HR' : 'EMP'}-AUTO-${Date.now()}`;

            const newEmp = await pool.query(
                `INSERT INTO employees (full_name, email, role, department, employee_id, status)
                 VALUES ($1, $2, $3, $4, $5, 'Active') RETURNING id`,
                [name, r.email, empRole, dept, empStringId]
            );

            const newUUID = newEmp.rows[0].id;
            await pool.query('UPDATE profiles SET employee_id = $1 WHERE id = $2', [newUUID, r.profile_id]);
            console.log(`✅ Created employee (${newUUID}) and linked profile for ${r.email}`);
        }

        // 4. Final verification
        console.log('\n=== Final State ===');
        const final = await pool.query(`
            SELECT p.email, p.role, p.employee_id as profile_emp_id, e.id as emp_uuid, e.full_name
            FROM profiles p
            LEFT JOIN employees e ON p.email = e.email
            ORDER BY p.email
        `);
        for (const r of final.rows) {
            const ok = r.emp_uuid && String(r.profile_emp_id) === String(r.emp_uuid);
            console.log(`[${ok ? '✅' : '❌'}] ${r.email} | linked_to: ${r.profile_emp_id} | emp.id: ${r.emp_uuid}`);
        }
        console.log('\n✅ Repair complete!');

    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

fullRepair();
