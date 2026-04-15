const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
    try {
        const role = req.headers['x-user-role'];
        const customerId = req.headers['x-customer-id'];

        let query = `
            SELECT 
                s.*, 
                c.NAME AS customer_name,
                cp.CITY AS customer_city,
                r.NAME AS receiver_name,
                rp.CITY AS receiver_city
            FROM shipment s
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            LEFT JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
        `;
        
        const { search, status } = req.query;
        
        const params = [];
        let whereClauses = [];

        if (role === 'user' && customerId) {
            whereClauses.push('s.CUSTOMERID = ?');
            params.push(customerId);
        }

        if (search) {
            whereClauses.push('(s.SHIPMENTID LIKE ? OR c.NAME LIKE ?)');
            params.push(`%${search}%`, `%${search}%`);
        }

        if (status) {
            whereClauses.push('s.CURRENTSTATUS = ?');
            params.push(status);
        }

        if (whereClauses.length > 0) {
            query += ' WHERE ' + whereClauses.join(' AND ');
        }

        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});



router.get('/schema/columns', async (req, res) => {
    try {
        const [columns] = await db.query('SHOW COLUMNS FROM shipment');
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
        const query = `INSERT INTO shipment (${keys.join(', ')}) VALUES (${placeholders})`;
        
        const [result] = await db.query(query, values);
        const shipmentId = data.SHIPMENTID || result.insertId;

        
        await db.query(
            `INSERT INTO tracking (SHIPMENTID, STATUS, LOCATION, TIMESTAMP) 
             SELECT ?, 'Booked', CONCAT(cp.CITY, ' Warehouse'), ?
             FROM customer c 
             JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE 
             WHERE c.CUSTOMERID = ?`,
            [shipmentId, new Date(), data.CUSTOMERID]
        );

        
        await db.query(
            'INSERT INTO payment (SHIPMENTID, PAYMENTSTATUS, PAYMENTDATE, PAYMENTMETHOD, TRANSACTIONID) VALUES (?, ?, ?, ?, ?)',
            [shipmentId, 'Pending', new Date(), 'Not Set', `TXN${shipmentId}${Date.now().toString().slice(-4)}`]
        );

        res.status(201).json({ message: 'Record created successfully', insertId: shipmentId });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { CURRENTSTATUS, PRIORITY, TOTALCOST } = req.body;
        
        
        const [oldShipment] = await db.query('SELECT CURRENTSTATUS FROM shipment WHERE SHIPMENTID = ?', [id]);
        if (oldShipment.length === 0) return res.status(404).json({ error: 'Shipment not found' });
        
        const statusChanged = CURRENTSTATUS && oldShipment[0].CURRENTSTATUS !== CURRENTSTATUS;

        
        const query = `
            UPDATE shipment 
            SET CURRENTSTATUS = ?, PRIORITY = ?, TOTALCOST = ? 
            WHERE SHIPMENTID = ?
        `;
        
        const [result] = await db.query(query, [CURRENTSTATUS, PRIORITY, TOTALCOST, id]);
        
        
        if (statusChanged) {
            
            const [shipmentInfo] = await db.query(`
                SELECT rp.CITY 
                FROM shipment s
                JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
                LEFT JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
                WHERE s.SHIPMENTID = ?
            `, [id]);

            const location = (CURRENTSTATUS === 'Delivered' || CURRENTSTATUS === 'Out for Delivery') 
                ? (shipmentInfo[0]?.CITY || 'Destination')
                : 'Operational Hub';

            await db.query(
                'INSERT INTO tracking (SHIPMENTID, STATUS, LOCATION, TIMESTAMP) VALUES (?, ?, ?, NOW())',
                [id, CURRENTSTATUS, location]
            );
        }

        res.json({ message: 'Shipment updated successfully' });
    } catch (err) {
        console.error('[Update Shipment Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.patch('/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        const validStatuses = ['Booked', 'In Transit', 'Out for Delivery', 'Delivered', 'Delayed', 'Cancelled'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status value' });
        }

        
        const [shipmentInfo] = await db.query(`
            SELECT rp.CITY, s.CURRENTSTATUS
            FROM shipment s
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            LEFT JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
            WHERE s.SHIPMENTID = ?
        `, [id]);

        if (shipmentInfo.length === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }

        
        const [result] = await db.query(
            'UPDATE shipment SET CURRENTSTATUS = ? WHERE SHIPMENTID = ?',
            [status, id]
        );

        
        const location = (status === 'Delivered' || status === 'Out for Delivery') 
            ? (shipmentInfo[0].CITY || 'Destination')
            : 'Operational Hub'; 

        await db.query(
            'INSERT INTO tracking (SHIPMENTID, STATUS, LOCATION, TIMESTAMP) VALUES (?, ?, ?, NOW())',
            [id, status, location]
        );

        res.json({ message: 'Status updated and tracking recorded', status });
    } catch (err) {
        console.error('[Status Update Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.get('/:id/timeline', async (req, res) => {
    try {
        const { id } = req.params;
        const [timeline] = await db.query(
            `SELECT 
                STATUS as status, 
                LOCATION as location, 
                TIMESTAMP as timestamp 
             FROM tracking 
             WHERE SHIPMENTID = ? 
             ORDER BY TIMESTAMP ASC`,
            [id]
        );
        res.json(timeline);
    } catch (err) {
        console.error('[Timeline Fetch Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.get('/:id/map', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT 
                c.PINCODE as sender_city, 
                r.PINCODE as receiver_city,
                (SELECT LOCATION FROM tracking WHERE SHIPMENTID = s.SHIPMENTID ORDER BY TIMESTAMP DESC LIMIT 1) as current_location
            FROM shipment s
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            WHERE s.SHIPMENTID = ?
        `;
        const [rows] = await db.query(query, [id]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Shipment not found' });
        }
        res.json(rows[0]);
    } catch (err) {
        console.error('[Map Data Fetch Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        
        // Check if tracking records still exist for this shipment
        const [trackingRows] = await db.query('SELECT COUNT(*) as count FROM tracking WHERE SHIPMENTID = ?', [id]);
        if (trackingRows[0].count > 0) {
            return res.status(400).json({ 
                error: `Cannot delete shipment. ${trackingRows[0].count} tracking record(s) still exist. Delete them from the Tracking page first.` 
            });
        }

        // Check if payment records still exist for this shipment
        const [paymentRows] = await db.query('SELECT COUNT(*) as count FROM payment WHERE SHIPMENTID = ?', [id]);
        if (paymentRows[0].count > 0) {
            return res.status(400).json({ 
                error: `Cannot delete shipment. ${paymentRows[0].count} payment record(s) still exist. Delete them from the Payments page first.` 
            });
        }

        // Safe to delete — no dependent records
        const [columns] = await db.query('SHOW COLUMNS FROM shipment');
        const primaryKey = columns[0].Field;
        const [result] = await db.query(`DELETE FROM shipment WHERE ${primaryKey} = ?`, [id]);
        
        if (result.affectedRows === 0) return res.status(404).json({ error: 'Record not found' });
        res.json({ message: 'Record deleted successfully' });
    } catch (err) {
        console.error('[Delete Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.get('/customer/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { search, status } = req.query;

        
        const [customer] = await db.query('SELECT EMAIL FROM customer WHERE CUSTOMERID = ?', [id]);
        if (customer.length === 0) {
            return res.status(404).json({ error: 'Customer not found' });
        }
        const userEmail = customer[0].EMAIL;

        
        const params = [id, userEmail];
        let whereClauses = ['(s.CUSTOMERID = ? OR r.EMAIL = ?)'];

        if (search) {
            whereClauses.push('(s.SHIPMENTID LIKE ? OR r.NAME LIKE ? OR c.NAME LIKE ?)');
            params.push(`%${search}%`, `%${search}%`, `%${search}%`);
        }

        if (status) {
            whereClauses.push('s.CURRENTSTATUS = ?');
            params.push(status);
        }

        const query = `
            SELECT 
                s.*, 
                c.NAME AS customer_name,
                cp.CITY AS customer_city,
                cp.STATE AS customer_state,
                r.NAME AS receiver_name,
                r.EMAIL AS receiver_email,
                rp.CITY AS receiver_city,
                rp.STATE AS receiver_state
            FROM shipment s
            JOIN customer c ON s.CUSTOMERID = c.CUSTOMERID
            LEFT JOIN customer_pincode cp ON c.PINCODE = cp.PINCODE
            JOIN receiver r ON s.RECEIVERID = r.RECEIVERID
            LEFT JOIN receiver_pincode rp ON r.PINCODE = rp.PINCODE
            WHERE ${whereClauses.join(' AND ')}
            ORDER BY s.BOOKINGDATE DESC
        `;
        const [rows] = await db.query(query, params);
        res.json(rows);
    } catch (err) {
        console.error('[Fetch Customer Shipments Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.post('/create-with-receiver', async (req, res) => {
    try {
        console.log('[Create Shipment DEBUG] Payload:', JSON.stringify(req.body));
        const { customerId, sender, receiver, serviceTypeId, priority } = req.body;
        
        if (!customerId || !receiver || !serviceTypeId || !priority) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        
        const senderPincode = parseInt(sender?.pincode);
        const receiverPincode = parseInt(receiver?.pincode);

        
        if (senderPincode) {
            
            
            const city = sender.city?.trim() || 'Unknown';
            const state = sender.state?.trim() || 'Unknown';
            
            await db.query(
                `INSERT INTO customer_pincode (PINCODE, CITY, STATE) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE 
                    CITY = IF(VALUES(CITY) != 'Unknown', VALUES(CITY), CITY),
                    STATE = IF(VALUES(STATE) != 'Unknown', VALUES(STATE), STATE)`,
                [senderPincode, city, state]
            );
            
            await db.query(
                'UPDATE customer SET STREET = ?, PINCODE = ? WHERE CUSTOMERID = ?',
                [sender.street, senderPincode, customerId]
            );
        }

        
        let receiverId;
        
        if (receiverPincode) {
            await db.query(
                `INSERT INTO receiver_pincode (PINCODE, CITY, STATE) VALUES (?, ?, ?)
                 ON DUPLICATE KEY UPDATE CITY = VALUES(CITY), STATE = VALUES(STATE)`,
                [receiverPincode, receiver.city || 'Unknown', receiver.state || 'Unknown']
            );
        }

        const [existingReceivers] = await db.query('SELECT RECEIVERID FROM receiver WHERE EMAIL = ?', [receiver.email]);
        
        if (existingReceivers.length > 0) {
            receiverId = existingReceivers[0].RECEIVERID;
            
            await db.query(
                'UPDATE receiver SET STREET = ?, PINCODE = ? WHERE RECEIVERID = ?',
                [receiver.street, receiverPincode, receiverId]
            );
        } else {
            const [newReceiver] = await db.query(
                'INSERT INTO receiver (NAME, EMAIL, STREET, PINCODE) VALUES (?, ?, ?, ?)',
                [receiver.name, receiver.email, receiver.street, receiverPincode]
            );
            receiverId = newReceiver.insertId;
        }

        
        const [serviceTypes] = await db.query('SELECT * FROM service_type WHERE SERVICETYPEID = ?', [serviceTypeId]);
        if (serviceTypes.length === 0) return res.status(404).json({ error: 'Service type not found' });
        const service = serviceTypes[0];

        
        const [couriers] = await db.query('SELECT COURIERID FROM courier LIMIT 5');
        if (couriers.length === 0) return res.status(500).json({ error: 'No couriers available' });
        const courierId = couriers[Math.floor(Math.random() * couriers.length)].COURIERID;

        
        const bookingDate = new Date();
        const expectedDate = new Date();
        expectedDate.setDate(bookingDate.getDate() + (service.DELIVERYDAYS || 3));
        
        let priorityMultiplier = 1.0;
        if (priority === 'High') priorityMultiplier = 1.5;
        if (priority === 'Urgent') priorityMultiplier = 2.0;
        const totalCost = (service.BASERATE || 50) * priorityMultiplier;

        
        const shipmentData = {
            BOOKINGDATE: bookingDate.toISOString().split('T')[0],
            CURRENTSTATUS: 'Booked',
            PRIORITY: priority,
            TOTALCOST: totalCost,
            CUSTOMERID: customerId,
            RECEIVERID: receiverId
        };

        const keys = Object.keys(shipmentData);
        const placeholders = keys.map(() => '?').join(', ');
        const [result] = await db.query(
            `INSERT INTO shipment (${keys.join(', ')}) VALUES (${placeholders})`,
            Object.values(shipmentData)
        );

        const shipmentId = result.insertId || shipmentData.SHIPMENTID;

        
        const senderCity = req.body.sender?.city || 'Origin';
        await db.query(
            'INSERT INTO tracking (SHIPMENTID, STATUS, LOCATION, TIMESTAMP) VALUES (?, ?, ?, ?)',
            [shipmentId, 'Booked', `${senderCity} Warehouse`, new Date()]
        );

        
        await db.query(
            'INSERT INTO payment (SHIPMENTID, PAYMENTSTATUS, PAYMENTDATE, PAYMENTMETHOD, TRANSACTIONID) VALUES (?, ?, ?, ?, ?)',
            [shipmentId, 'Pending', new Date(), 'Not Set', `TXN${shipmentId}${Date.now().toString().slice(-4)}`]
        );

        res.status(201).json({ 
            message: 'Shipment created successfully!', 
            shipmentId: shipmentId 
        });

    } catch (err) {
        console.error('[Create Shipment Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});



module.exports = router;
