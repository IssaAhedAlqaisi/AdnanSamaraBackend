// backend/routes/clients.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

// GET جميع العملاء
router.get('/', (req, res) => {
  const sql = `SELECT id, name, phone, area, address, type, source, notes, status, created_at
               FROM clients ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST إضافة عميل جديد
router.post('/', (req, res) => {
  const { name, phone, area, address, type, source, notes, status } = req.body;
  if (!name || !phone || !area)
    return res.status(400).json({ error: 'Name, phone, and area are required' });

  const sql = `INSERT INTO clients 
               (name, phone, area, address, type, source, notes, status)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)`;
  const params = [name, phone, area, address || '', type || '', source || '', notes || '', status || 'active'];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      id: this.lastID,
      name, phone, area, address, type, source, notes, status
    });
  });
});

// DELETE حذف عميل
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM clients WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Client deleted successfully' });
  });
});

module.exports = router;
