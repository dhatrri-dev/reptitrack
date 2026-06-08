const mysql = require('mysql2');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const db = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'dhot',
    database: process.env.DB_NAME || 'courier_tracking',
}).promise();

const STATUS_FLOW = ['Booked', 'Dispatched', 'In Transit', 'Out for Delivery', 'Delivered'];

async function backfill() {
    try {
        console.log('--- Starting Tracking Flow Backfill ---');

        // 1. Fetch all shipments with city info
        const [shipments] = await db.query(`
            SELECT 
                s.SHIPMENTID, 
                s.CURRENTSTATUS, 
                s.BOOKINGDATE,
                cp.CITY as sender_city,
                rp.CITY as receiver_city
            FROM shipment s
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            LEFT JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
        `);

        for (const s of shipments) {
            console.log(`\nProcessing Shipment #${s.SHIPMENTID} (Current: ${s.CURRENTSTATUS})`);
            
            // 2. Fetch existing tracking for this shipment
            const [existing] = await db.query('SELECT STATUS FROM tracking WHERE SHIPMENTID = ?', [s.SHIPMENTID]);
            const existingStatuses = existing.map(h => h.STATUS);

            // 3. Determine which statuses in the flow should exist
            const targetIndex = STATUS_FLOW.indexOf(s.CURRENTSTATUS);
            if (targetIndex === -1) {
                console.log(` ! Unknown status "${s.CURRENTSTATUS}", skipping.`);
                continue;
            }

            const requiredStatuses = STATUS_FLOW.slice(0, targetIndex + 1);

            for (let i = 0; i < requiredStatuses.length; i++) {
                const status = requiredStatuses[i];
                
                if (!existingStatuses.includes(status)) {
                    // Create timestamp based on index
                    const baseDate = new Date(s.BOOKINGDATE);
                    // Add hours or days to ensure order
                    // i=0 (Booked) -> +0h
                    // i=1 (Dispatched) -> +1h
                    // i=2 (In Transit) -> +24h
                    // i=3 (Out for Delivery) -> +48h
                    // i=4 (Delivered) -> +72h or current time if it's the target status
                    
                    let timestamp = new Date(baseDate);
                    if (i === 0) timestamp.setHours(timestamp.getHours() + 1);
                    if (i === 1) timestamp.setHours(timestamp.getHours() + 2);
                    if (i === 2) timestamp.setHours(timestamp.getHours() + 24);
                    if (i === 3) timestamp.setHours(timestamp.getHours() + 48);
                    if (i === 4) timestamp.setHours(timestamp.getHours() + 72);

                    // For the CURRENT status of the shipment, we can use NOW() if it was updated recently
                    // but for historical ones we use the calculation.
                    
                    const location = (status === 'Booked' || status === 'Dispatched') 
                        ? (s.sender_city || 'Origin') 
                        : (s.receiver_city || 'Destination');

                    console.log(` + Adding missing step: ${status} at ${location}`);
                    
                    await db.query(
                        'INSERT INTO tracking (SHIPMENTID, STATUS, LOCATION, TIMESTAMP) VALUES (?, ?, ?, ?)',
                        [s.SHIPMENTID, status, location, timestamp]
                    );
                } else {
                    console.log(` . Step already exists: ${status}`);
                }
            }
        }

        console.log('\n--- Backfill Completed Successfully! ---');
        process.exit(0);
    } catch (err) {
        console.error('Error during backfill:', err);
        process.exit(1);
    }
}

backfill();
