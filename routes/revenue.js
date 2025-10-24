// backend/routes/revenue.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

// GET جميع الإيرادات
router.get('/', (req, res) => {
  const sql = `
    SELECT id, date, source, amount, notes, created_at
    FROM revenue ORDER BY id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST إضافة إيراد جديد
router.post('/', (req, res) => {
  const { date, source, amount, notes } = req.body;

  if (!date || !source || !amount)
    return res.status(400).json({ error: 'Date, source, and amount are required' });

  const sql = `
    INSERT INTO revenue (date, source, amount, notes)
    VALUES (?, ?, ?, ?)
  `;
  const params = [date, source, amount, notes || ''];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('❌ DB Insert Error:', err.message);
      return res.status(500).json({ error: err.message });
    }
    console.log('✅ تم إضافة الإيراد بنجاح:', { id: this.lastID, date, source, amount });
    res.json({
      id: this.lastID,
      date, source, amount, notes
    });
  });
});

// DELETE حذف إيراد
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM revenue WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Revenue deleted successfully' });
  });
});

module.exports = router;
