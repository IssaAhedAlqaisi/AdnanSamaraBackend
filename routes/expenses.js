// backend/routes/expenses.js
const express = require('express');
const router = express.Router();

// ✅ لأن الملف داخل routes، لازم ../database
const pool = require('../database');

/* -------------------- Helpers -------------------- */
function toPgDate(input) {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;             // YYYY-MM-DD
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {                        // MM/DD/YYYY
    const [mm, dd, yyyy] = input.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  // last resort: let Postgres try to parse
  return input;
}

function asNumber(n) {
  if (n === null || n === undefined || n === '') return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}

async function ensureTypeAndGetId(name) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const q = `
    INSERT INTO expense_types (name)
    VALUES ($1)
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
    RETURNING id;
  `;
  const { rows } = await pool.query(q, [clean]);
  return rows[0]?.id || null;
}

/* -------------------- Expense Types -------------------- */

// GET /api/expenses/types
router.get('/types', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, to_char(created_at,'YYYY-MM-DD') AS created_at
       FROM expense_types ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /expenses/types error:', err);
    res.status(500).json({ error: 'Failed to fetch expense types' });
  }
});

// POST /api/expenses/types { name }
router.post('/types', async (req, res) => {
  try {
    const name = (req.body?.name || '').trim();
    if (!name) return res.status(400).json({ error: 'Type name is required' });
    const { rows } = await pool.query(
      `INSERT INTO expense_types (name)
       VALUES ($1)
       ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
       RETURNING id, name`,
      [name]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('POST /expenses/types error:', err);
    res.status(500).json({ error: 'Failed to add expense type' });
  }
});

// DELETE /api/expenses/types/:id
router.delete('/types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid type id' });
    await pool.query(`DELETE FROM expense_types WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /expenses/types/:id error:', err);
    res.status(500).json({ error: 'Failed to delete expense type' });
  }
});

/* -------------------- Expenses CRUD -------------------- */

// GET /api/expenses
router.get('/', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT e.id,
              to_char(e.date,'YYYY-MM-DD') AS date,
              e.type_id,
              COALESCE(t.name,'') AS type_name,
              e.amount,
              e.beneficiary,
              e.pay_method,
              e.description,
              e.notes,
              e.status
       FROM expenses e
       LEFT JOIN expense_types t ON t.id = e.type_id
       ORDER BY e.date DESC, e.id DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /expenses error:', err);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/expenses
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    // 👇 يقبل إمّا type_id أو type (اسم)
    let type_id = body.type_id ? Number(body.type_id) : null;
    if (!type_id && body.type) {
      type_id = await ensureTypeAndGetId(body.type);
    }

    const date = toPgDate(body.date) || toPgDate(new Date().toISOString().slice(0,10));
    const amount = asNumber(body.amount);
    const beneficiary = body.beneficiary ?? null;
    const pay_method = body.pay_method ?? null;  // 'كاش' | 'فيزا' | 'ذمم'
    const description = body.description ?? null;
    const notes = body.notes ?? null;

    if (amount === null) {
      return res.status(400).json({ error: 'amount is required and must be a number' });
    }

    const { rows } = await pool.query(
      `INSERT INTO expenses
         (date, type_id, amount, beneficiary, pay_method, description, notes, status)
       VALUES ($1,   $2,      $3,     $4,          $5,         $6,          $7,   'paid')
       RETURNING id`,
      [date, type_id, amount, beneficiary, pay_method, description, notes]
    );

    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('POST /expenses error:', err);
    res.status(500).json({ error: 'Failed to add expense', detail: err.message });
  }
});

// PUT /api/expenses/:id
router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const body = req.body || {};

    let type_id = null;
    if (body.type_id !== undefined) type_id = Number(body.type_id);
    if (!type_id && body.type) type_id = await ensureTypeAndGetId(body.type);

    const date = body.date ? toPgDate(body.date) : null;
    const amount = body.amount !== undefined ? asNumber(body.amount) : null;
    const beneficiary = body.beneficiary ?? null;
    const pay_method = body.pay_method ?? null;
    const description = body.description ?? null;
    const notes = body.notes ?? null;
    const status = body.status ?? null;

    const { rows } = await pool.query(
      `UPDATE expenses
         SET date = COALESCE($1, date),
             type_id = COALESCE($2, type_id),
             amount = COALESCE($3, amount),
             beneficiary = COALESCE($4, beneficiary),
             pay_method = COALESCE($5, pay_method),
             description = COALESCE($6, description),
             notes = COALESCE($7, notes),
             status = COALESCE($8, status)
       WHERE id = $9
       RETURNING id`,
      [date, type_id, amount, beneficiary, pay_method, description, notes, status, id]
    );

    if (!rows.length) return res.status(404).json({ error: 'Expense not found' });
    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('PUT /expenses/:id error:', err);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE /api/expenses/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    await pool.query(`DELETE FROM expenses WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /expenses/:id error:', err);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

module.exports = router;
