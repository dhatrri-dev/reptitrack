require('dotenv').config({ path: './server/.env' });
const db = require('./server/db/db');

async function checkSchema() {
    try {
        console.log('--- USERS table ---');
        const [usersColumns] = await db.query('DESCRIBE USERS');
        console.table(usersColumns);

        console.log('\n--- SHIPMENT table ---');
        const [shipmentColumns] = await db.query('DESCRIBE SHIPMENT');
        console.table(shipmentColumns);
        
        process.exit(0);
    } catch (err) {
        console.error('Error checking schema:', err);
        process.exit(1);
    }
}

checkSchema();
