// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const db = require('../database');

/* =========================
   CRUD: Expenses
   ========================= */

// GET /api/expenses
router.get('/', async (req, res) => {
  try {
    const q = `SELECT * FROM expenses ORDER BY date DESC, id DESC;`;
    const r = await db.query(q);
    res.json(r.rows);
  } catch (e) {
    console.error('❌ Error fetching expenses:', e.message);
    res.status(500).json({ error: 'فشل تحميل المصاريف' });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    let {
      date,        // اختياري, لو غاب نستخدم CURRENT_DATE
      type,        // REQUIRED (اسم النوع)
      amount,      // REQUIRED
      beneficiary, // الجهة المستفيدة
      payment_method, // 'كاش' | 'فيزا' | 'ذمم'
      description,
      notes
    } = req.body || {};

    if (!type || !amount) {
      return res.status(400).json({ error: 'النوع والمبلغ مطلوبان' });
    }

    // ضبط القيم الافتراضية
    if (!payment_method) payment_method = 'كاش';

    const q = `
      INSERT INTO expenses (date, type, amount, beneficiary, payment_method, description, notes)
      VALUES (COALESCE($1::date, CURRENT_DATE), $2, $3, $4, $5, $6, $7)
      RETURNING *;
    `;
    const v = [date || null, type, amount, beneficiary || null, payment_method, description || null, notes || null];
    const r = await db.query(q, v);
    res.json(r.rows[0]);
  } catch (e) {
    console.error('❌ Error inserting expense:', e.message);
    res.status(500).json({ error: 'فشل إضافة المصروف' });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    let {
      date,
      type,
      amount,
      beneficiary,
      payment_method,
      description,
      notes,
      status
    } = req.body || {};

    const q = `
      UPDATE expenses SET
        date = COALESCE($1::date, date),
        type = COALESCE($2, type),
        amount = COALESCE($3, amount),
        beneficiary = COALESCE($4, beneficiary),
        payment_method = COALESCE($5, payment_method),
        description = COALESCE($6, description),
        notes = COALESCE($7, notes),
        status = COALESCE($8, status)
      WHERE id = $9
      RETURNING *;
    `;
    const v = [date || null, type || null, amount || null, beneficiary || null, payment_method || null, description || null, notes || null, status || null, id];
    const r = await db.query(q, v);
    if (r.rowCount === 0) return res.status(404).json({ error: 'لم يتم العثور على المصروف' });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('❌ Error updating expense:', e.message);
    res.status(500).json({ error: 'فشل تعديل المصروف' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const r = await db.query(`DELETE FROM expenses WHERE id = $1 RETURNING id;`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'لم يتم العثور على المصروف' });
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error deleting expense:', e.message);
    res.status(500).json({ error: 'فشل حذف المصروف' });
  }
});

/* =========================
   Expense Types (إدارة الأنواع)
   endpoints تحت /api/expenses/types
   ========================= */

// GET /api/expenses/types
router.get('/types', async (_req, res) => {
  try {
    const r = await db.query(`SELECT id, name FROM expense_types ORDER BY name;`);
    res.json(r.rows);
  } catch (e) {
    console.error('❌ Error fetching expense types:', e.message);
    res.status(500).json({ error: 'فشل تحميل أنواع المصاريف' });
  }
});

// POST /api/expenses/types
router.post('/types', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name) return res.status(400).json({ error: 'الاسم مطلوب' });
    const r = await db.query(
      `INSERT INTO expense_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name;`,
      [name.trim()]
    );
    if (r.rowCount === 0) return res.status(200).json({ duplicated: true, name });
    res.json(r.rows[0]);
  } catch (e) {
    console.error('❌ Error adding expense type:', e.message);
    res.status(500).json({ error: 'فشل إضافة النوع' });
  }
});

// DELETE /api/expenses/types/:id
router.delete('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // ملاحظة: إن كان النوع مستخدم في جدول expenses سيبقى في المصاريف كـ string
    const r = await db.query(`DELETE FROM expense_types WHERE id = $1 RETURNING id;`, [id]);
    if (r.rowCount === 0) return res.status(404).json({ error: 'لم يتم العثور على النوع' });
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error deleting expense type:', e.message);
    res.status(500).json({ error: 'فشل حذف النوع' });
  }
});

module.exports = router;
