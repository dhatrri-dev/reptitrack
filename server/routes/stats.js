const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
    try {
        
        const [
            [[customerStats]],
            [[shipmentStats]],
            [[revenueStats]],
        ] = await Promise.all([
            db.query('SELECT COUNT(*) as total FROM CUSTOMER'),
            db.query(`
                SELECT 
                    COUNT(*) as total,
                    SUM(CASE WHEN CURRENTSTATUS = 'Delivered' THEN 1 ELSE 0 END) as delivered,
                    SUM(CASE WHEN CURRENTSTATUS = 'Delayed' THEN 1 ELSE 0 END) as overdue,
                    SUM(CASE WHEN CURRENTSTATUS = 'Out for Delivery' THEN 1 ELSE 0 END) as outForDelivery,
                    SUM(CASE WHEN CURRENTSTATUS = 'In Transit' THEN 1 ELSE 0 END) as inTransit,
                    SUM(CASE WHEN CURRENTSTATUS = 'Booked' THEN 1 ELSE 0 END) as booked,
                    SUM(CASE WHEN CURRENTSTATUS = 'Cancelled' THEN 1 ELSE 0 END) as cancelled
                FROM SHIPMENT
            `),
            db.query('SELECT SUM(TOTALCOST) as totalRevenue FROM SHIPMENT'),
        ]);

        const total = Number(shipmentStats.total) || 0;
        const delivered = Number(shipmentStats.delivered) || 0;
        const successRate = total > 0 ? ((delivered / total) * 100).toFixed(1) : '0.0';

        res.json({
            totalCustomers:  Number(customerStats.total) || 0,
            totalShipments:  total,
            delivered,
            overdue:         Number(shipmentStats.overdue) || 0,
            outForDelivery:  Number(shipmentStats.outForDelivery) || 0,
            inTransit:       Number(shipmentStats.inTransit) || 0,
            booked:          Number(shipmentStats.booked) || 0,
            cancelled:       Number(shipmentStats.cancelled) || 0,
            totalRevenue:    parseFloat(revenueStats.totalRevenue) || 0,
            successRate,
        });
    } catch (err) {
        console.error('[Stats Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.get('/charts', async (req, res) => {
    try {
        const [
            [shipmentsPerDay],
            [revenuePerDay],
            [successRateTrend]
        ] = await Promise.all([
            db.query(`
                SELECT 
                    DATE_FORMAT(BOOKINGDATE, '%b %d') as date, 
                    COUNT(*) as count 
                FROM SHIPMENT 
                WHERE BOOKINGDATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(BOOKINGDATE), date
                ORDER BY DATE(BOOKINGDATE) ASC
            `),
            db.query(`
                SELECT 
                    DATE_FORMAT(BOOKINGDATE, '%b %d') as date, 
                    SUM(TOTALCOST) as revenue 
                FROM SHIPMENT 
                WHERE BOOKINGDATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(BOOKINGDATE), date
                ORDER BY DATE(BOOKINGDATE) ASC
            `),
            db.query(`
                SELECT 
                    DATE_FORMAT(BOOKINGDATE, '%b %d') as date, 
                    ROUND((SUM(CASE WHEN CURRENTSTATUS = 'Delivered' THEN 1 ELSE 0 END) / COUNT(*)) * 100, 1) as rate 
                FROM SHIPMENT 
                WHERE BOOKINGDATE >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
                GROUP BY DATE(BOOKINGDATE), date
                ORDER BY DATE(BOOKINGDATE) ASC
            `)
        ]);

        res.json({
            shipmentsPerDay,
            revenuePerDay,
            successRateTrend
        });
    } catch (err) {
        console.error('[Chart Stats Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
