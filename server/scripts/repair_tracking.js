const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'dhot',
    database: process.env.DB_NAME || 'courier_tracking',
}).promise();

const STATUS_RANK = {
    'Booked': 10,
    'Dispatched': 20,
    'In Transit': 30,
    'Delayed': 40,
    'Out for Delivery': 50,
    'Delivered': 60,
    'Cancelled': 70
};

async function repair() {
    try {
        console.log('--- Starting Chronological Repair of Tracking Flows ---');

        // 1. Fetch all tracking records
        const [shipments] = await db.query('SELECT SHIPMENTID, BOOKINGDATE FROM shipment');
        
        for (const s of shipments) {
            console.log(`\nRepairing Shipment #${s.SHIPMENTID}...`);
            
            const [tracking] = await db.query('SELECT TRACKINGID, STATUS, TIMESTAMP FROM tracking WHERE SHIPMENTID = ?', [s.SHIPMENTID]);
            
            if (tracking.length === 0) continue;

            // 2. Sort tracking entries by their status rank
            const sortedTracking = tracking.sort((a, b) => {
                const rankA = STATUS_RANK[a.STATUS] || 99;
                const rankB = STATUS_RANK[b.STATUS] || 99;
                return rankA - rankB;
            });

            // 3. Re-assign timestamps sequentially from BOOKINGDATE
            const baseDate = new Date(s.BOOKINGDATE);
            
            for (let i = 0; i < sortedTracking.length; i++) {
                const entry = sortedTracking[i];
                const rank = STATUS_RANK[entry.STATUS] || 99;
                
                let newTimestamp = new Date(baseDate);
                // Assign a unique timestamp based on rank and position
                // Rank 10 (Booked) -> + 0 mins
                // Rank 20 (Dispatched) -> + 1 hour
                // Rank 30 (In Transit) -> + 2 hours
                // etc.
                if (rank === 10) newTimestamp.setMinutes(newTimestamp.getMinutes() + 5); 
                else if (rank === 20) newTimestamp.setHours(newTimestamp.getHours() + 2);
                else if (rank === 30) newTimestamp.setHours(newTimestamp.getHours() + 12);
                else if (rank === 40) newTimestamp.setHours(newTimestamp.getHours() + 24);
                else if (rank === 50) newTimestamp.setHours(newTimestamp.getHours() + 36);
                else if (rank === 60) newTimestamp.setHours(newTimestamp.getHours() + 48);
                else if (rank === 70) newTimestamp.setHours(newTimestamp.getHours() + 60);
                else newTimestamp.setHours(newTimestamp.getHours() + (i * 2));

                console.log(` * Updating "${entry.STATUS}" to ${newTimestamp.toISOString()}`);
                
                await db.query(
                    'UPDATE tracking SET TIMESTAMP = ? WHERE TRACKINGID = ?',
                    [newTimestamp, entry.TRACKINGID]
                );
            }
        }

        console.log('\n--- Repair Completed Successfully! ---');
        process.exit(0);
    } catch (err) {
        console.error('Repair Error:', err);
        process.exit(1);
    }
}

repair();
