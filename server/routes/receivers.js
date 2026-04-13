const express = require('express');
const router = express.Router();
const db = require('../db/db');

// Get all receivers
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM RECEIVER');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// Auto-generated GET schema endpoint to retrieve column names (useful if table is empty)
router.get('/schema/columns', async (req, res) => {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM RECEIVER');
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
        const query = `INSERT INTO RECEIVER (${keys.join(', ')}) VALUES (${placeholders})`;
        
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
        const [columns] = await db.query('SHOW COLUMNS FROM RECEIVER');
        const primaryKey = columns[0].Field;

        const query = `DELETE FROM RECEIVER WHERE ${primaryKey} = ?`;
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
