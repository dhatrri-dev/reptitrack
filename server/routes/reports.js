const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
    try {
        const { from, to, status } = req.query;

        let conditions = [];
        let params = [];

        if (from) { conditions.push('s.BOOKINGDATE >= ?'); params.push(from); }
        if (to)   { conditions.push('s.BOOKINGDATE <= ?'); params.push(to + ' 23:59:59'); }
        if (status && status !== 'All') { conditions.push('s.CURRENTSTATUS = ?'); params.push(status); }

        const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

        const [shipments] = await db.query(`
            SELECT 
                s.*,
                c.NAME AS customer_name,
                cp.CITY AS customer_city,
                r.NAME AS receiver_name,
                rp.CITY AS receiver_city
            FROM shipment s
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
            ${where}
            ORDER BY s.BOOKINGDATE DESC
        `, params);

        
        const [[summary]] = await db.query(`
            SELECT
                COUNT(*) as totalShipments,
                SUM(TOTALCOST) as totalRevenue,
                SUM(CASE WHEN CURRENTSTATUS = 'Delivered' THEN 1 ELSE 0 END) as delivered,
                SUM(CASE WHEN CURRENTSTATUS = 'In Transit' OR CURRENTSTATUS = 'Out for Delivery' THEN 1 ELSE 0 END) as inTransit,
                SUM(CASE WHEN CURRENTSTATUS = 'Pending' OR CURRENTSTATUS = 'Booked' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN CURRENTSTATUS = 'Delayed' OR CURRENTSTATUS = 'Cancelled' THEN 1 ELSE 0 END) as issues
            FROM shipment s
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
            ${where}
        `, params);

        res.json({ shipments, summary });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
