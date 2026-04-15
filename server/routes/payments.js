const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
    try {
        const role = req.headers['x-user-role'];
        const customerId = req.headers['x-customer-id'];

        let query = `
            SELECT 
                p.*,
                s.TOTALCOST as AMOUNT,
                c.NAME as CUSTOMER_NAME,
                cp.CITY as customer_city,
                r.NAME as receiver_name,
                rp.CITY as receiver_city
            FROM PAYMENT p
            LEFT JOIN SHIPMENT s ON p.SHIPMENTID = s.SHIPMENTID
            LEFT JOIN CUSTOMER c ON s.CUSTOMERID = c.CUSTOMERID
            LEFT JOIN CUSTOMER_PINCODE cp ON c.PINCODE = cp.PINCODE
            LEFT JOIN RECEIVER r ON s.RECEIVERID = r.RECEIVERID
            LEFT JOIN RECEIVER_PINCODE rp ON r.PINCODE = rp.PINCODE
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



router.get('/schema/columns', async (req, res) => {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM PAYMENT');
        const fields = columns.map(c => c.Field);
        
        res.json([...fields, 'CUSTOMER_NAME', 'AMOUNT']);
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
        const query = `INSERT INTO PAYMENT (${keys.join(', ')}) VALUES (${placeholders})`;
        
        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Record created successfully', insertId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        
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



router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        console.log(`[PAYMENT UPDATE] ID: ${id}`, data);
        
        
        const status = data.STATUS || data.PAYMENTSTATUS;
        const method = data.METHOD || data.PAYMENTMETHOD;
        const rawDate = data.DATE || data.PAYMENTDATE || new Date();
        const date = new Date(rawDate).toISOString().split('T')[0];
        const txnId = data.TRANSACTIONID;
        const shipmentId = data.SHIPMENTID;
        
        let finalTxnId = txnId;
        
        
        if (['Paid', 'Completed'].includes(status) && (!txnId || txnId === 'null' || txnId === '—')) {
            finalTxnId = `TXN${shipmentId || id}${Date.now().toString().slice(-4)}`;
        }

        const query = `
            UPDATE PAYMENT 
            SET PAYMENTSTATUS = ?, PAYMENTMETHOD = ?, PAYMENTDATE = ?, TRANSACTIONID = ?
            WHERE PAYMENTID = ?
        `;
        
        const [result] = await db.query(query, [status, method, date, finalTxnId, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Payment not found' });
        }
        res.json({ message: 'Payment updated successfully', transactionId: finalTxnId });
    } catch (err) {
        console.error('[Update Payment Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
