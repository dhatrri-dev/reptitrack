const express = require('express');
const router = express.Router();
const db = require('../db/db');


router.get('/', async (req, res) => {
    try {
        const [users] = await db.query('SELECT id, email AS username, role FROM USERS ORDER BY id ASC');
        res.json(users);
    } catch (err) {
        console.error('[Get Users Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.put('/:id/promote', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('UPDATE USERS SET role = ? WHERE id = ?', ['admin', id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User promoted to admin successfully' });
    } catch (err) {
        console.error('[Promote User Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});


router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [result] = await db.query('DELETE FROM USERS WHERE id = ?', [id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('[Delete User Error]', err.message);
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
