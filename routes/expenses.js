// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const db = require('../database');

/* ============ المصاريف ============ */

// GET /api/expenses
router.get('/', async (_req, res) => {
  try {
    const q = `SELECT id, date, type, amount, payment_method, beneficiary, description, notes
               FROM expenses
               ORDER BY date DESC, id DESC;`;
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
    const {
      amount,
      type,
      date,              // اختياري – إن ما وصل بنستخدم DEFAULT CURRENT_DATE
      payment_method,    // كاش / فيزا / ذمم
      beneficiary,
      description,
      notes,
    } = req.body;

    if (amount == null || isNaN(Number(amount))) {
      return res.status(400).json({ error: 'المبلغ مطلوب' });
    }

    const q = `
      INSERT INTO expenses (date, type, amount, payment_method, beneficiary, description, notes)
      VALUES (COALESCE($1::date, DEFAULT), $2, $3, COALESCE($4,'كاش'), $5, $6, $7)
      RETURNING *;
    `;
    const v = [date || null, type || null, Number(amount), payment_method || null, beneficiary || null, description || null, notes || null];
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
    const {
      date,
      type,
      amount,
      payment_method,
      beneficiary,
      description,
      notes,
    } = req.body;

    const q = `
      UPDATE expenses
      SET date = COALESCE($1::date, date),
          type = COALESCE($2, type),
          amount = COALESCE($3, amount),
          payment_method = COALESCE($4, payment_method),
          beneficiary = COALESCE($5, beneficiary),
          description = COALESCE($6, description),
          notes = COALESCE($7, notes)
      WHERE id = $8
      RETURNING *;
    `;
    const v = [date || null, type || null, amount != null ? Number(amount) : null, payment_method || null, beneficiary || null, description || null, notes || null, id];
    const r = await db.query(q, v);
    if (!r.rowCount) return res.status(404).json({ error: 'المصروف غير موجود' });
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
    const r = await db.query(`DELETE FROM expenses WHERE id=$1`, [id]);
    if (!r.rowCount) return res.status(404).json({ error: 'المصروف غير موجود' });
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error deleting expense:', e.message);
    res.status(500).json({ error: 'فشل حذف المصروف' });
  }
});


/* ============ أنواع المصاريف ============ */

// GET /api/expenses/types
router.get('/types', async (_req, res) => {
  try {
    const r = await db.query(`SELECT id, name FROM expense_types ORDER BY name ASC;`);
    res.json(r.rows);
  } catch (e) {
    console.error('❌ Error fetching expense types:', e.message);
    res.status(500).json({ error: 'فشل تحميل أنواع المصاريف' });
  }
});

// POST /api/expenses/types
router.post('/types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم النوع مطلوب' });
    }
    const r = await db.query(
      `INSERT INTO expense_types (name) VALUES ($1)
       ON CONFLICT (name) DO NOTHING
       RETURNING *;`,
      [name.trim()]
    );
    const added = r.rows[0] || (await db.query(`SELECT id, name FROM expense_types WHERE name=$1`, [name.trim()])).rows[0];
    res.status(201).json(added);
  } catch (e) {
    console.error('❌ Error adding expense type:', e.message);
    res.status(500).json({ error: 'فشل إضافة نوع المصروف' });
  }
});

// DELETE /api/expenses/types/:id
router.delete('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.query(`DELETE FROM expense_types WHERE id=$1`, [id]);
    res.json({ success: true });
  } catch (e) {
    console.error('❌ Error deleting expense type:', e.message);
    res.status(500).json({ error: 'فشل حذف نوع المصروف' });
  }
});

module.exports = router;
