// backend/expenses.js
const express = require('express');
const router = express.Router();
const db = require('./database'); // هذا بيرجع pool جاهز

// Helper: تنظيف طريقة الدفع (اختياري)
function normalizePayMethod(v) {
  if (!v) return null;
  const s = String(v).trim();
  if (['كاش', 'cash'].includes(s)) return 'كاش';
  if (['فيزا', 'visa'].includes(s)) return 'فيزا';
  if (['ذمم', 'credit', 'ذِمم'].includes(s)) return 'ذمم';
  return s; // اقبل أي قيمة قديمة/قد تجي من الداتا
}

// ---------- GET /api/expenses ----------
// رجّع المصاريف مع اسم النوع (join)
router.get('/', async (req, res) => {
  try {
    const q = `
      SELECT e.id, e.date, e.type_id, t.name AS type_name,
             e.amount, e.beneficiary, e.pay_method, e.description, e.notes, e.status
      FROM expenses e
      LEFT JOIN expense_types t ON t.id = e.type_id
      ORDER BY e.date DESC, e.id DESC;
    `;
    const { rows } = await db.query(q);
    res.json(rows);
  } catch (err) {
    console.error('GET /expenses error:', err.message);
    res.status(500).json({ error: 'Internal error fetching expenses' });
  }
});

// ---------- POST /api/expenses ----------
// إضافة مصروف جديد
router.post('/', async (req, res) => {
  try {
    const {
      amount,
      date,          // yyyy-mm-dd (اختياري)
      type_id,       // رقم النوع REQUIRED
      beneficiary,   // اختياري
      pay_method,    // اختياري
      description,   // اختياري
      notes          // اختياري
    } = req.body || {};

    // تحقق أساسي
    if (amount === undefined || amount === null || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'amount is required and must be a number' });
    }
    if (!type_id) {
      return res.status(400).json({ error: 'type_id is required' });
    }

    const cleanAmount = Number(amount);
    const cleanDate = date && String(date).trim() ? date : null; // لو null الداتا بيس بتحط CURRENT_DATE
    const cleanPay = normalizePayMethod(pay_method);

    const q = `
      INSERT INTO expenses (date, type_id, amount, beneficiary, pay_method, description, notes)
      VALUES (COALESCE($1::date, CURRENT_DATE), $2::int, $3::real, $4::text, $5::text, $6::text, $7::text)
      RETURNING id, date, type_id, amount, beneficiary, pay_method, description, notes, status;
    `;
    const params = [cleanDate, type_id, cleanAmount, beneficiary || null, cleanPay, description || null, notes || null];
    const { rows } = await db.query(q, params);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /expenses error:', err.message, 'payload=', req.body);
    res.status(500).json({ error: 'Internal error inserting expense' });
  }
});

// ---------- DELETE /api/expenses/:id ----------
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM expenses WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /expenses error:', err.message);
    res.status(500).json({ error: 'Internal error deleting expense' });
  }
});

/* ===============================
   أنواع المصاريف
   =============================== */

// GET /api/expenses/types
router.get('/types', async (_req, res) => {
  try {
    const { rows } = await db.query('SELECT id, name FROM expense_types ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    console.error('GET /expenses/types error:', err.message);
    res.status(500).json({ error: 'Internal error fetching types' });
  }
});

// POST /api/expenses/types
router.post('/types', async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'name is required' });

    const q = `
      INSERT INTO expense_types (name)
      VALUES ($1)
      ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
      RETURNING id, name;
    `;
    const { rows } = await db.query(q, [name]);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST /expenses/types error:', err.message);
    res.status(500).json({ error: 'Internal error adding type' });
  }
});

// DELETE /api/expenses/types/:id
router.delete('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query('DELETE FROM expense_types WHERE id=$1', [id]);
    res.json({ ok: true });
  } catch (err) {
    console.error('DELETE /expenses/types error:', err.message);
    res.status(500).json({ error: 'Internal error deleting type' });
  }
});

module.exports = router;
