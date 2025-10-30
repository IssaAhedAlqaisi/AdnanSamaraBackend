// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const pool = require('../database');

/* ========== helpers ========== */
function toPgDate(input) {
  if (!input) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(input)) return input;             // 2025-10-30
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(input)) {                       // 10/30/2025
    const [mm, dd, yyyy] = input.split('/');
    return `${yyyy}-${mm}-${dd}`;
  }
  return input;
}
function asNumber(n) {
  if (n === null || n === undefined || n === '') return null;
  const v = Number(n);
  return Number.isFinite(v) ? v : null;
}
function isNumericStr(v) { return typeof v === 'string' && /^[0-9]+$/.test(v); }
function normalizePayMethod(v) {
  if (!v) return null;
  const s = String(v).trim().toLowerCase();
  if (['كاش','نقد','نقدي','cash'].includes(s)) return 'cash';
  if (['visa','فيزا','بطاقة','credit','debit','بطاقه'].includes(s)) return 'visa';
  if (['ذمم','دين','آجل','creditor','receivable','on account'].includes(s)) return 'credit';
  return v;
}
async function ensureTypeAndGetId(name) {
  const clean = String(name || '').trim();
  if (!clean) return null;
  const { rows } = await pool.query(
    `INSERT INTO expense_types (name)
     VALUES ($1)
     ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
     RETURNING id;`,
    [clean]
  );
  return rows[0]?.id || null;
}

/* ========== TYPES CRUD ========== */
router.get('/types', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, name, to_char(created_at,'YYYY-MM-DD') AS created_at
       FROM expense_types ORDER BY name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('GET /expenses/types error:', err);
    res.status(500).json({ error: 'Failed to fetch expense types', detail: err.message });
  }
});

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
    res.status(500).json({ error: 'Failed to add expense type', detail: err.message, code: err.code });
  }
});

router.delete('/types/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid type id' });
    await pool.query(`DELETE FROM expense_types WHERE id=$1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /expenses/types/:id error:', err);
    res.status(500).json({ error: 'Failed to delete expense type', detail: err.message, code: err.code });
  }
});

/* ========== EXPENSES ========== */
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
    res.status(500).json({ error: 'Failed to fetch expenses', detail: err.message, code: err.code });
  }
});

router.post('/', async (req, res) => {
  console.log('POST /expenses payload:', req.body);
  try {
    const b = req.body || {};

    // resolve type_id + readable type name for legacy columns
    let type_id = null, type_name = null;
    if (b.type_id !== undefined && b.type_id !== null && b.type_id !== '') {
      type_id = Number(b.type_id);
    } else if (isNumericStr(b.type)) {
      type_id = Number(b.type);
    } else if (b.type) {
      type_name = String(b.type).trim();
      type_id = await ensureTypeAndGetId(type_name);
    }

    // if still no type_name, fetch by id
    if (!type_name && type_id) {
      const q = await pool.query(`SELECT name FROM expense_types WHERE id=$1`, [type_id]);
      type_name = q.rows[0]?.name || null;
    }
    // fallback readable name
    const legacyName = type_name || 'غير مصنف';

    const date = toPgDate(b.date) || new Date().toISOString().slice(0, 10);
    const amount = asNumber(b.amount);
    const beneficiary = (b.beneficiary || '').trim() || null;
    const pay_method = normalizePayMethod(b.pay_method || b.payment_method);
    const description = (b.description || '').trim() || null;
    const notes = (b.notes || '').trim() || null;

    if (amount === null) {
      return res.status(400).json({ error: 'amount is required and must be a number' });
    }

    // Insert — نعبّي type و category بنفس الاسم (للتوافق مع أعمدة قديمة)
    const { rows } = await pool.query(
      `INSERT INTO expenses
         (date, type_id, type, category, amount, beneficiary, pay_method, description, notes, status)
       VALUES ($1, $2, $3, $3, $4, $5, $6, $7, $8, 'paid')
       RETURNING id`,
      [date, type_id, legacyName, amount, beneficiary, pay_method, description, notes]
    );

    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('POST /expenses ERROR:', err);
    res.status(500).json({ error: 'Failed to add expense', detail: err?.detail || err?.message, code: err?.code });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });

    const b = req.body || {};
    let type_id = null, type_name = null;
    if (b.type_id !== undefined && b.type_id !== null && b.type_id !== '') {
      type_id = Number(b.type_id);
    } else if (isNumericStr(b.type)) {
      type_id = Number(b.type);
    } else if (b.type) {
      type_name = String(b.type).trim();
      type_id = await ensureTypeAndGetId(type_name);
    }
    if (!type_name && type_id) {
      const q = await pool.query(`SELECT name FROM expense_types WHERE id=$1`, [type_id]);
      type_name = q.rows[0]?.name || null;
    }

    const date = b.date ? toPgDate(b.date) : null;
    const amount = b.amount !== undefined ? asNumber(b.amount) : null;
    const beneficiary = b.beneficiary ?? null;
    const pay_method = b.pay_method ? normalizePayMethod(b.pay_method)
      : (b.payment_method ? normalizePayMethod(b.payment_method) : null);
    const description = b.description ?? null;
    const notes = b.notes ?? null;
    const status = b.status ?? null;

    const { rows } = await pool.query(
      `UPDATE expenses
         SET date = COALESCE($1, date),
             type_id = COALESCE($2, type_id),
             type = COALESCE($3, type),
             category = COALESCE($3, category),
             amount = COALESCE($4, amount),
             beneficiary = COALESCE($5, beneficiary),
             pay_method = COALESCE($6, pay_method),
             description = COALESCE($7, description),
             notes = COALESCE($8, notes),
             status = COALESCE($9, status)
       WHERE id = $10
       RETURNING id`,
      [date, type_id, (type_name || null), amount, beneficiary, pay_method, description, notes, status, id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Expense not found' });
    res.json({ id: rows[0].id });
  } catch (err) {
    console.error('PUT /expenses/:id error:', err);
    res.status(500).json({ error: 'Failed to update expense', detail: err.message, code: err.code });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid id' });
    await pool.query(`DELETE FROM expenses WHERE id=$1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('DELETE /expenses/:id error:', err);
    res.status(500).json({ error: 'Failed to delete expense', detail: err.message, code: err.code });
  }
});

module.exports = router;
