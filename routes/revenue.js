// backend/routes/revenue.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

/* ===========================
   GET /api/revenue  — جلب الإيرادات
   =========================== */
router.get('/', (req, res) => {
  const sql = `
    SELECT id, date, source, type, amount, notes, status, created_at
    FROM revenue
    ORDER BY date DESC, id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error('❌ Error fetching revenue:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/* ===========================
   POST /api/revenue — إضافة إيراد
   =========================== */
router.post('/', (req, res) => {
  // لوج تشخيصي — شو اللي وصل من الواجهة
  console.log('📥 POST /api/revenue body =>', req.body);

  const { date, source, type, amount, notes } = req.body || {};

  const amt = Number(amount);
  const src = (source && String(source).trim()) || 'غير محدد';
  const typ = (type && String(type).trim()) || 'water_sale';
  const nts = (notes && String(notes).trim()) || '';

  if (!date || !Number.isFinite(amt)) {
    return res.status(400).json({ error: 'التاريخ والمبلغ مطلوبان' });
  }

  const sql = `
    INSERT INTO revenue (date, source, type, amount, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'completed', datetime('now','localtime'))
  `;
  const params = [date, src, typ, amt, nts];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('❌ DB Insert Error (revenue):', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'تمت إضافة الإيراد بنجاح ✅', id: this.lastID });
  });
});

/* ===========================
   DELETE /api/revenue/:id — حذف
   =========================== */
router.delete('/:id', (req, res) => {
  db.run(`DELETE FROM revenue WHERE id = ?`, [req.params.id], function (err) {
    if (err) {
      console.error('❌ Error deleting revenue:', err);
      return res.status(500).json({ error: err.message });
    }
    if (!this.changes) return res.status(404).json({ error: 'الإيراد غير موجود' });
    res.json({ message: 'تم حذف الإيراد 🗑️' });
  });
});

module.exports = router;
