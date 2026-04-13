const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all customers with City and State
router.get('/', async (req, res) => {
    try {
        const query = `
            SELECT 
                c.*, 
                cp.CITY, 
                cp.STATE 
            FROM customer c
            LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Search customers by name or ID
router.get('/search', async (req, res) => {
    console.log('[DEBUG] GET /api/customers/search hit with query:', req.query);
    try {
        const { q } = req.query;
        if (!q) return res.json([]);
        const query = `
            SELECT 
                c.*, 
                cp.CITY, 
                cp.STATE 
            FROM customer c
            LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            WHERE c.CUSTOMERID LIKE ? OR c.NAME LIKE ?
            LIMIT 10
        `;
        const [rows] = await db.query(query, [`%${q}%`, `%${q}%`]);
        console.log('[DEBUG] Search results count:', rows.length);
        res.json(rows);
    } catch (err) {
        console.error('[DEBUG] Search error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/customers/:id - Get a single customer with details
router.get('/:id', async (req, res) => {
    console.log('[DEBUG] GET /api/customers/:id hit with id:', req.params.id);
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                c.*, 
                cp.CITY, 
                cp.STATE 
            FROM customer c
            LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            WHERE c.CUSTOMERID = ?
        `;
        const [rows] = await db.query(query, [id]);
        if (rows.length === 0) return res.status(404).json({ error: 'Customer not found' });
        res.json(rows[0]);
    } catch (err) {
        console.error('[DEBUG] ID fetch error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/customers/statuses - Fetch distinct status values
router.get('/statuses', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT DISTINCT STATUS FROM CUSTOMER WHERE STATUS IS NOT NULL AND STATUS != ""');
        res.json(rows.map(r => r.STATUS));
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Auto-generated GET schema endpoint to retrieve column names (useful if table is empty)
router.get('/schema/columns', async (req, res) => {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM CUSTOMER');
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
        const query = `INSERT INTO CUSTOMER (${keys.join(', ')}) VALUES (${placeholders})`;
        
        const [result] = await db.query(query, values);
        res.status(201).json({ message: 'Record created successfully', insertId: result.insertId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PUT /api/customers/:id - Edit an existing customer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { NAME, EMAIL, STATUS, STREET, PINCODE } = req.body;
        
        // Use a parameterized update query specifically for the requested fields
        const query = `
            UPDATE CUSTOMER 
            SET NAME = ?, EMAIL = ?, STATUS = ?, STREET = ?, PINCODE = ? 
            WHERE CUSTOMERID = ?
        `;
        
        const [result] = await db.query(query, [NAME, EMAIL, STATUS, STREET, PINCODE, id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        res.json({ message: 'Customer updated successfully' });
    } catch (err) {
        console.error('[Update Customer Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

// Auto-generated DELETE endpoint
// Note: Assumes the first column of the table is the primary key (e.g., CUSTOMERID, SHIPMENTID)
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Fetch column names to dynamically find the primary key
        const [columns] = await db.query('SHOW COLUMNS FROM CUSTOMER');
        const primaryKey = columns[0].Field;

        const query = `DELETE FROM CUSTOMER WHERE ${primaryKey} = ?`;
        const [result] = await db.query(query, [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Record not found' });
        }
        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get all shipments for a specific customer
router.get('/:id/shipments', async (req, res) => {
    try {
        const { id } = req.params;
        const [shipments] = await db.query(
            `SELECT s.*, r.NAME as RECEIVER_NAME 
             FROM shipment s 
             LEFT JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
             WHERE s.CUSTOMERID = ? 
             ORDER BY s.BOOKINGDATE DESC`,
            [id]
        );
        res.json(shipments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
