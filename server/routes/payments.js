const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all payments joined with shipment and customer info
router.get('/', async (req, res) => {
    try {
        const role = req.headers['x-user-role'];
        const customerId = req.headers['x-customer-id'];

        let query = `
            SELECT 
                p.*,
                s.CURRENTSTATUS as SHIPMENT_STATUS,
                s.BOOKINGDATE,
                s.TOTALCOST as SHIPMENT_COST,
                s.TOTALCOST as AMOUNT,
                c.NAME as CUSTOMER_NAME
            FROM PAYMENT p
            LEFT JOIN SHIPMENT s ON p.SHIPMENTID = s.SHIPMENTID
            LEFT JOIN CUSTOMER c ON s.CUSTOMERID = c.CUSTOMERID
        `;
        
        const params = [];
        if (role === 'user' && customerId) {
            query += ' WHERE s.CUSTOMERID = ?';
            params.push(customerId);
        }

        query += ' ORDER BY p.PAYMENTID DESC';

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Summary stats for payment dashboard cards
router.get('/summary', async (req, res) => {
    try {
        const [[stats]] = await db.query(`
            SELECT
                COUNT(*) as total,
                SUM(s.TOTALCOST) as totalRevenue,
                SUM(CASE WHEN p.PAYMENTSTATUS IN ('Paid', 'Completed') THEN s.TOTALCOST ELSE 0 END) as paidRevenue,
                SUM(CASE WHEN p.PAYMENTSTATUS = 'Pending' THEN s.TOTALCOST ELSE 0 END) as pendingRevenue,
                SUM(CASE WHEN p.PAYMENTSTATUS IN ('Failed', 'Overdue') THEN 1 ELSE 0 END) as failedCount
            FROM PAYMENT p
            LEFT JOIN SHIPMENT s ON p.SHIPMENTID = s.SHIPMENTID
        `);
        res.json(stats);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Auto-generated GET schema endpoint to retrieve column names (useful if table is empty)
router.get('/schema/columns', async (req, res) => {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM PAYMENT');
        res.json(columns.map(c => c.Field));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auto-generated POST endpoint to add a new record
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        const keys = Object.keys(data);
        const values = Object.values(data);
        
        if (keys.length === 0) {
            return res.status(400).json({ error: 'No data provided' });
        }

        const placeholders = keys.map(() => '?').join(', ');
        const query = `INSERT INTO PAYMENT (${keys.join(', ')}) VALUES (${placeholders})`;
        
        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Record created successfully', insertId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Auto-generated DELETE endpoint
// Note: Assumes the first column of the table is the primary key (e.g., CUSTOMERID, SHIPMENTID)
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Fetch column names to dynamically find the primary key
        const [columns] = await db.query('SHOW COLUMNS FROM PAYMENT');
        const primaryKey = columns[0].Field;

        const query = `DELETE FROM PAYMENT WHERE ${primaryKey} = ?`;
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
