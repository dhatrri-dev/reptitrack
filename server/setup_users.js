const db = require('./db/db');

async function setup() {
    try {
        await db.query(`
            CREATE TABLE IF NOT EXISTS USERS (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL
            )
        `);
        console.log("SQL USERS table verified/created successfully.");
        process.exit(0);
    } catch(err) {
        console.error("Error creating USERS table:", err.message);
        process.exit(1);
    }
}

setup();
