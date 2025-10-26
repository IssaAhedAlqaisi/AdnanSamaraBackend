// backend/routes/revenue.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

/* Helper: تنسيق التاريخ إلى YYYY-MM-DD */
function normalizeDate(input) {
  if (!input) return '';
  const d = new Date(input);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return input;
  const m2 = String(input).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) {
    const mm = String(m2[1]).padStart(2, '0');
    const dd = String(m2[2]).padStart(2, '0');
    const yyyy = m2[3];
    return `${yyyy}-${mm}-${dd}`;
  }
  return String(input);
}

/* ==================== GET - جميع الإيرادات ==================== */
router.get('/', (req, res) => {
  const sql = `
    SELECT id, date, source, type, amount, notes, status, created_at
    FROM revenue
    ORDER BY date DESC, id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('❌ Error fetching revenue:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows);
  });
});

/* ==================== POST - إضافة إيراد جديد ==================== */
router.post('/', (req, res) => {
  console.log('📥 POST /api/revenue body =>', req.body);

  const { date, source, type, amount, notes } = req.body || {};
  const dt = normalizeDate(date);
  const amt = Number(amount);
  const src = (source && String(source).trim()) || 'غير محدد';
  const typ = (type && String(type).trim()) || 'water_sale';
  const nts = (notes && String(notes).trim()) || '';

  if (!dt || !Number.isFinite(amt)) {
    return res.status(400).json({ error: '⚠️ التاريخ والمبلغ مطلوبان' });
  }

  const sql = `
    INSERT INTO revenue (date, source, type, amount, notes, status, created_at)
    VALUES ($1, $2, $3, $4, $5, 'completed', NOW())
    RETURNING *
  `;
  const params = [dt, src, typ, amt, nts];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ DB Insert Error (revenue):', err);
      return res.status(500).json({ error: err.message });
    }

    const revenue = result.rows[0];
    console.log(`✅ تمت إضافة الإيراد (ID: ${revenue.id}) بنجاح!`);
    res.json({
      message: '✅ تمت إضافة الإيراد بنجاح',
      id: revenue.id,
      revenue
    });
  });
});

/* ==================== DELETE - حذف إيراد ==================== */
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM revenue WHERE id = $1`;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting revenue:', err);
      return res.status(500).json({ error: err.message });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '⚠️ الإيراد غير موجود' });
    }

    res.json({ message: '🗑️ تم حذف الإيراد بنجاح' });
  });
});

module.exports = router;
