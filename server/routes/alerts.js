const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
    try {
        const [alertRows] = await db.query(`
            SELECT 
                SHIPMENTID as shipmentId, 
                LOWER(CURRENTSTATUS) as type, 
                BOOKINGDATE as date
            FROM shipment
            WHERE CURRENTSTATUS IN ('Delayed', 'Cancelled')
            ORDER BY BOOKINGDATE DESC
        `);

        res.json(alertRows);
    } catch (err) {
        console.error('[Alerts Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
