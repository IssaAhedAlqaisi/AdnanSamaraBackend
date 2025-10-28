// backend/routes/clients.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = require('../database'); // pg.Pool instance

// 🟢 GET - جميع العملاء
router.get('/', (req, res) => {
  const sql = `
    SELECT id, name, phone, area, address, type, source, notes, status, created_at
    FROM clients
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('❌ Error fetching clients:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows);
  });
});

// 🟢 POST - إضافة عميل جديد
router.post('/', (req, res) => {
  const { name, phone, area, address, type, source, notes, status } = req.body;

  if (!name || !phone || !area) {
    return res.status(400).json({ error: 'Name, phone, and area are required' });
  }

  const sql = `
    INSERT INTO clients (name, phone, area, address, type, source, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *
  `;
  const params = [
    name,
    phone,
    area,
    address || '',
    type || 'regular',
    source || 'reference',
    notes || '',
    status || 'active'
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ Error inserting client:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows[0]);
  });
});

// 🟢 DELETE - حذف عميل
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM clients WHERE id = $1`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting client:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'Client deleted successfully' });
  });
});

module.exports = router;
