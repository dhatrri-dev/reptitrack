const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'server', '.env') });

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    database: process.env.DB_NAME || 'courier_tracking',
}).promise();

async function migrate() {
    try {
        console.log('Starting migration...');
        
        // Check if role column exists
        const [columns] = await pool.query('DESCRIBE USERS');
        const hasRole = columns.find(c => c.Field === 'role');
        const hasCustomerId = columns.find(c => c.Field === 'customer_id');

        if (!hasRole) {
            console.log('Adding role column...');
            await pool.query("ALTER TABLE USERS ADD COLUMN role VARCHAR(20) DEFAULT 'customer'");
        }

        if (!hasCustomerId) {
            console.log('Adding customer_id column...');
            await pool.query("ALTER TABLE USERS ADD COLUMN customer_id INT NULL");
        }

        console.log('Migration successful!');
        process.exit(0);
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    }
}

migrate();
