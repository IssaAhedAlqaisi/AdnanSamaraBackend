// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const db = require('../database');

/* Helpers */
const normalizePayMethod = (raw) => {
  if (!raw) return 'cash';
  const s = String(raw).trim();
  if (['كاش', 'نقد', 'cash'].includes(s)) return 'cash';
  if (['فيزا', 'بطاقة', 'visa'].includes(s)) return 'visa';
  if (['ذمم', 'آجل', 'credit'].includes(s)) return 'credit';
  return 'cash';
};

async function ensureTypeIdByName(name) {
  if (!name || !String(name).trim()) return null;
  const nm = String(name).trim();
  const upsert = await db.query(
    `INSERT INTO expense_types(name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id;`,
    [nm]
  );
  return upsert.rows[0]?.id || null;
}

/* ===== Expense Types ===== */
router.get('/types', async (req, res) => {
  try {
    const r = await db.query(`SELECT id, name FROM expense_types ORDER BY name ASC;`);
    res.json(r.rows);
  } catch (e) {
    console.error('❌ Error fetching expense types:', e.message);
    res.status(500).json({ error: 'فشل تحميل أنواع المصاريف' });
  }
});

router.post('/types', async (req, res) => {
  try {
    const { name } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'اسم النوع مطلوب' });
    }
    const id = await ensureTypeIdByName(name);
    const row = await db.query(`SELECT id, name FROM expense_types WHERE id=$1;`, [id]);
    res.json(row.rows[0]);
  } catch (e) {
    console.error('❌ Error adding expense type:', e.message);
    res.status(500).json({ error: 'فشل إضافة نوع المصروف' });
  }
});

router.delete('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM expense_types WHERE id=$1;`, [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error deleting expense type:', e.message);
    res.status(500).json({ error: 'فشل حذف نوع المصروف' });
  }
});

/* ===== Expenses ===== */
router.get('/', async (_req, res) => {
  try {
    const r = await db.query(`
      SELECT e.id, e.date, e.amount, e.beneficiary, e.pay_method, e.description, e.notes, e.status,
             t.name AS type_name, e.type_id
      FROM expenses e
      LEFT JOIN expense_types t ON t.id = e.type_id
      ORDER BY e.date DESC, e.id DESC;
    `);
    res.json(r.rows);
  } catch (e) {
    console.error('❌ Error fetching expenses:', e.message);
    res.status(500).json({ error: 'فشل تحميل المصاريف' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      amount,
      date,              // optional, if empty => CURRENT_DATE
      pay_method,        // 'كاش' | 'فيزا' | 'ذمم' (or english)
      beneficiary,
      description,
      notes,
      type_id,           // optional
      type_name          // optional (اسم النوع)
    } = req.body || {};

    const amt = parseFloat(amount);
    if (!amt || isNaN(amt)) {
      return res.status(400).json({ error: 'المبلغ غير صالح' });
    }

    // normalize pay method to match DB CHECK
    const pay = normalizePayMethod(pay_method);

    // resolve/ensure type id
    let finalTypeId = type_id || null;
    if (!finalTypeId && type_name) {
      finalTypeId = await ensureTypeIdByName(type_name);
    }

    // insert (let DB default CURRENT_DATE handle when date is null/empty)
    const insert = await db.query(
      `
      INSERT INTO expenses (date, type_id, amount, beneficiary, pay_method, description, notes)
      VALUES (
        COALESCE(NULLIF($1::text,''), NULL)::date,  -- if '', -> NULL -> DEFAULT
        $2, $3, $4, $5, $6, $7
      )
      RETURNING id;
      `,
      [date || '', finalTypeId, amt, beneficiary || null, pay, description || null, notes || null]
    );

    res.json({ id: insert.rows[0].id, success: true });
  } catch (e) {
    console.error('❌ Error adding expense:', e.message);
    res.status(500).json({ error: 'فشل إضافة المصروف' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM expenses WHERE id=$1;`, [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error deleting expense:', e.message);
    res.status(500).json({ error: 'فشل حذف المصروف' });
  }
});

module.exports = router;

