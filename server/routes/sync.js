const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Sync & Repair: Find orphaned shipments and create missing tracking/payment records
router.post('/repair', async (req, res) => {
    try {
        console.log('[SYNC] Starting database audit & repair...');
        
        // 1. Find shipments without tracking
        const [orphansNoTracking] = await db.query(`
            SELECT s.SHIPMENTID 
            FROM shipment s 
            LEFT JOIN tracking t ON s.SHIPMENTID = t.SHIPMENTID 
            WHERE t.SHIPMENTID IS NULL
        `);

        if (orphansNoTracking.length > 0) {
            console.log(`[SYNC] Found ${orphansNoTracking.length} shipments missing tracking. Repairing...`);
            for (const orphan of orphansNoTracking) {
                await db.query(
                    'INSERT INTO tracking (SHIPMENTID, STATUS, LOCATION, TIMESTAMP) VALUES (?, ?, ?, ?)',
                    [orphan.SHIPMENTID, 'Booked', 'Origin Warehouse', new Date()]
                );
            }
        }

        // 2. Find shipments without payments
        const [orphansNoPayment] = await db.query(`
            SELECT s.SHIPMENTID 
            FROM shipment s 
            LEFT JOIN payment p ON s.SHIPMENTID = p.SHIPMENTID 
            WHERE p.SHIPMENTID IS NULL
        `);

        if (orphansNoPayment.length > 0) {
            console.log(`[SYNC] Found ${orphansNoPayment.length} shipments missing payments. Repairing...`);
            for (const orphan of orphansNoPayment) {
                await db.query(
                    'INSERT INTO payment (SHIPMENTID, PAYMENTSTATUS, PAYMENTDATE, PAYMENTMETHOD, TRANSACTIONID) VALUES (?, ?, ?, ?, ?)',
                    [orphan.SHIPMENTID, 'Pending', new Date(), 'Not Set', `TXN${orphan.SHIPMENTID}${Date.now().toString().slice(-4)}`]
                );
            }
        }

        res.json({ 
            success: true, 
            message: 'Audit & Repair completed successfully',
            repairedTracking: orphansNoTracking.length,
            repairedPayments: orphansNoPayment.length
        });

    } catch (err) {
        console.error('[SYNC Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
