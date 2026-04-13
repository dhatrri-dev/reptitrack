// Fix script: Sets the role column default to 'user' and resets any accidental 'admin' assignments
const mysql = require('mysql2').promise;
require('dotenv').config();

async function fixRoles() {
    const db = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASS || '',
        database: process.env.DB_NAME || 'courier_tracking',
    });
    
    // 1. Change column default to 'user'
    await db.query(`ALTER TABLE USERS MODIFY COLUMN role VARCHAR(20) DEFAULT 'user'`);
    console.log("✅ Set column default to 'user'");

    // 2. Set role = 'user' for anyone who has NULL or no role
    const [result] = await db.query(`UPDATE USERS SET role = 'user' WHERE role IS NULL OR role = ''`);
    console.log(`✅ Fixed ${result.affectedRows} user(s) with missing roles`);

    // 3. Show all users and their roles
    const [users] = await db.query('SELECT username, role FROM USERS');
    console.log('\n📋 Current USERS table:');
    users.forEach(u => console.log(`  - ${u.username}: ${u.role}`));

    await db.end();
}

fixRoles().catch(console.error);
