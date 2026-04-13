const express = require('express');
const router = express.Router();
const db = require('../db/db');

// GET /api/alerts - Get live shipment alerts (delayed and delivered today)
router.get('/', async (req, res) => {
    try {
        // 1. Fetch Delayed shipments (Status is Delayed OR it's been more than 4 days since booking and not delivered)
        const [delayedRows] = await db.query(`
            SELECT 
                SHIPMENTID as shipmentId, 
                'delayed' as type, 
                DATE_ADD(BOOKINGDATE, INTERVAL 4 DAY) as date
            FROM shipment
            WHERE CURRENTSTATUS = 'Delayed' 
               OR (CURRENTSTATUS NOT IN ('Delivered', 'Cancelled') AND DATE_ADD(BOOKINGDATE, INTERVAL 4 DAY) < CURDATE())
            ORDER BY BOOKINGDATE ASC
        `);

        // 2. Fetch Recently Delivered shipments (Status is Delivered and was updated today in tracking)
        const [deliveredRows] = await db.query(`
            SELECT 
                s.SHIPMENTID as shipmentId, 
                'delivered' as type, 
                MAX(t.TIMESTAMP) as date
            FROM shipment s
            JOIN tracking t ON s.SHIPMENTID = t.SHIPMENTID
            WHERE s.CURRENTSTATUS = 'Delivered' 
              AND t.STATUS = 'Delivered'
              AND DATE(t.TIMESTAMP) = CURDATE()
            GROUP BY s.SHIPMENTID
            ORDER BY date DESC
        `);

        // Combine and return
        res.json([...delayedRows, ...deliveredRows]);
    } catch (err) {
        console.error('[Alerts Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
