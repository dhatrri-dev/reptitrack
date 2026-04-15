const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
    try {
        const { latest } = req.query;
        let query = `
            SELECT 
                t.*, 
                s.TOTALCOST,
                s.CURRENTSTATUS as shipment_status,
                c.NAME AS customer_name,
                cp.CITY AS customer_city,
                r.NAME AS receiver_name,
                rp.CITY AS receiver_city
            FROM TRACKING t
            JOIN shipment s ON t.SHIPMENTID = s.SHIPMENTID
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            LEFT JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
        `;
        
        if (latest === 'true') {
            query = `
                SELECT 
                    t1.*,
                    s.TOTALCOST,
                    s.CURRENTSTATUS as shipment_status,
                    c.NAME AS customer_name,
                    cp.CITY AS customer_city,
                    r.NAME AS receiver_name,
                    rp.CITY AS receiver_city
                FROM TRACKING t1
                JOIN (
                    SELECT MAX(TRACKINGID) as max_id 
                    FROM TRACKING 
                    GROUP BY SHIPMENTID
                ) t2 ON t1.TRACKINGID = t2.max_id
                JOIN shipment s ON t1.SHIPMENTID = s.SHIPMENTID
                JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
                LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
                JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
                LEFT JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
                ORDER BY t1.TIMESTAMP DESC
            `;
        }

        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.get('/schema/columns', async (req, res) => {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM TRACKING');
        res.json(columns.map(c => c.Field));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const keys = Object.keys(data);
        const values = Object.values(data);
        
        if (keys.length === 0) {
            return res.status(400).json({ error: 'No data provided' });
        }

        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO TRACKING (${keys.join(', ')}) VALUES (${placeholders})`;
        
        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Record created successfully', insertId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        
        const [columns] = await db.query('SHOW COLUMNS FROM TRACKING');
        const primaryKey = columns[0].Field;

        const query = `DELETE FROM TRACKING WHERE ${primaryKey} = ?`;
        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
