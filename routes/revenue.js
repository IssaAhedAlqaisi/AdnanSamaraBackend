// backend/routes/revenue.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

// ✅ جلب كل الإيرادات
router.get('/', (req, res) => {
  const sql = `SELECT id, date, source, type, amount, client_name, vehicle_number, payment_method, description, notes, status
               FROM revenue ORDER BY date DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ إضافة إيراد جديد
router.post('/', (req, res) => {
  const {
    date,
    source,
    type,
    amount,
    client_name,
    vehicle_number,
    payment_method,
    description,
    notes,
    status
  } = req.body;

  // التحقق من الحقول الأساسية
  if (!date || !type || !amount) {
    return res.status(400).json({ error: 'الحقول (التاريخ، النوع، المبلغ) مطلوبة' });
  }

  const sql = `
    INSERT INTO revenue 
      (date, source, type, amount, client_name, vehicle_number, payment_method, description, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;

  const params = [
    date,
    source || '',
    type,
    amount,
    client_name || '',
    vehicle_number || '',
    payment_method || 'cash',
    description || '',
    notes || '',
    status || 'completed'
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('❌ Error inserting revenue:', err.message);
      return res.status(500).json({ error: err.message });
    }

    res.json({
      id: this.lastID,
      message: '✅ Revenue added successfully',
      data: { id: this.lastID, ...req.body }
    });
  });
});

// ✅ حذف إيراد
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  db.run('DELETE FROM revenue WHERE id = ?', [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: '🗑️ Revenue deleted successfully' });
  });
});

module.exports = router;
