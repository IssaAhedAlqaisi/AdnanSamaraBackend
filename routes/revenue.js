const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

/* Helper: طَبِّع التاريخ إلى YYYY-MM-DD حتى لو أجا mm/dd/yyyy */
function normalizeDate(input) {
  if (!input) return '';
  // لو شكله mm/dd/yyyy أو dd/mm/yyyy خلّيه Date()
  const d = new Date(input);
  if (!isNaN(d)) return d.toISOString().slice(0, 10); // YYYY-MM-DD
  // آخر حل: طابق أرقام وافصلها
  const m = String(input).match(/^(\d{4})-(\d{2})-(\d{2})$/); // أصلاً جاهز
  if (m) return input;
  const m2 = String(input).match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m2) {
    const mm = String(m2[1]).padStart(2, '0');
    const dd = String(m2[2]).padStart(2, '0');
    const yyyy = m2[3];
    // اعتبر التنسيق المعروض mm/dd/yyyy (كما يظهر في المتصفح)
    return `${yyyy}-${mm}-${dd}`;
  }
  // رجِّعه كما هو لو ما قدرنا نفسّره (SQLite يخزّنه نص)
  return String(input);
}

/* GET: كل الإيرادات */
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

/* POST: إضافة إيراد */
router.post('/', (req, res) => {
  console.log('📥 POST /api/revenue body =>', req.body);

  const { date, source, type, amount, notes } = req.body || {};

  const dt  = normalizeDate(date);
  const amt = Number(amount);
  const src = (source && String(source).trim()) || 'غير محدد';
  const typ = (type && String(type).trim()) || 'water_sale';
  const nts = (notes && String(notes).trim()) || '';

  if (!dt || !Number.isFinite(amt)) {
    return res.status(400).json({ error: 'التاريخ والمبلغ مطلوبان' });
  }

  const sql = `
    INSERT INTO revenue (date, source, type, amount, notes, status, created_at)
    VALUES (?, ?, ?, ?, ?, 'completed', datetime('now','localtime'))
  `;
  const params = [dt, src, typ, amt, nts];

  db.run(sql, params, function (err) {
    if (err) {
      console.error('❌ DB Insert Error (revenue):', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: 'تمت إضافة الإيراد بنجاح ✅', id: this.lastID });
  });
});

/* DELETE: حذف */
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
