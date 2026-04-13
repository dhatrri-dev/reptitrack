const express = require('express');
const router = express.Router();
const db = require('../db/db');

router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName } = req.body;
        if (!email || !password || !fullName) return res.status(400).json({ error: 'Email, password, and Full Name are required' });
        
        // Check if user exists
        const [existing] = await db.query('SELECT * FROM USERS WHERE email = ?', [email]);
        if (existing.length > 0) return res.status(400).json({ error: 'This email is already registered. Try logging in!' });
        
        // 1. Create a matching Customer profile with the captured Full Name and Email
        const [customerResult] = await db.query(
            'INSERT INTO CUSTOMER (NAME, EMAIL, REGISTRATIONDATE, STATUS) VALUES (?, ?, CURRENT_DATE(), ?)',
            [fullName, email, 'Active']
        );
        const customerId = customerResult.insertId;

        // 2. Insert new user with the linked customer_id and Email
        await db.query(
            'INSERT INTO USERS (email, password, role, customer_id) VALUES (?, ?, ?, ?)',
            [email, password, 'user', customerId]
        );
        
        res.status(201).json({ message: 'Account created successfully! Your Customer profile is linked.' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
        
        const [users] = await db.query('SELECT * FROM USERS WHERE email = ? AND password = ?', [email, password]);
        if (users.length === 0) return res.status(401).json({ error: 'Invalid email or password' });
        
        const user = users[0];
        
        // Fetch the Customer name for a better greeting
        const [customers] = await db.query('SELECT NAME FROM CUSTOMER WHERE CUSTOMERID = ?', [user.customer_id]);
        const displayName = customers.length > 0 ? customers[0].NAME : email;

        res.json({ 
            message: 'Login successful', 
            email, 
            username: displayName, // Keep 'username' key for frontend compatibility
            role: user.role || 'user',
            customer_id: user.customer_id 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Public Tracking Endpoint
router.get('/track/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.query(`
            SELECT 
                s.SHIPMENTID, s.BOOKINGDATE, s.CURRENTSTATUS,
                c.NAME AS customer_name,
                cp.CITY AS customer_city,
                r.NAME AS receiver_name,
                rp.CITY AS receiver_city,
                t.LOCATION as LAST_LOCATION,
                t.TIMESTAMP as LAST_UPDATED
            FROM shipment s
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
            LEFT JOIN (
                SELECT 
                    t1.SHIPMENTID, t1.LOCATION, t1.TIMESTAMP
                FROM TRACKING t1
                INNER JOIN (
                    SELECT SHIPMENTID, MAX(TIMESTAMP) as MaxTS
                    FROM TRACKING
                    GROUP BY SHIPMENTID
                ) t2 ON t1.SHIPMENTID = t2.SHIPMENTID AND t1.TIMESTAMP = t2.MaxTS
            ) t ON s.SHIPMENTID = t.SHIPMENTID
            WHERE s.SHIPMENTID = ?
        `, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Shipment not found. Please check your ID.' });
        }
        console.log("Tracking Data:", rows[0]);
        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
