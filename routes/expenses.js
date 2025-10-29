// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const db = require('../database');

/* =========================
   📥 جلب المصاريف (مع اسم النوع)
   ========================= */
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      `
      SELECT e.id,
             e.date,
             e.amount,
             e.beneficiary,
             e.pay_method,
             e.description,
             e.notes,
             e.status,
             e.type_id,
             t.name AS type_name
      FROM expenses e
      LEFT JOIN expense_types t ON t.id = e.type_id
      ORDER BY e.date DESC, e.id DESC;
      `
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching expenses:', err.message);
    res.status(500).json({ error: 'فشل تحميل المصاريف' });
  }
});

/* =========================
   ➕ إضافة مصروف
   ========================= */
router.post('/', async (req, res) => {
  try {
    // نتوقع: { date?, type_id, amount, beneficiary?, pay_method, description?, notes? }
    const {
      date, type_id, amount,
      beneficiary, pay_method, description, notes
    } = req.body;

    if (!amount || !pay_method) {
      return res.status(400).json({ error: 'المبلغ وطريقة الدفع مطلوبان' });
    }

    // توحيد طريقة الدفع
    const method = (pay_method || '').toLowerCase();
    const allowed = ['cash', 'visa', 'ذمم', 'كاش', 'فيزا'];
    if (!allowed.includes(method) && !allowed.includes(pay_method)) {
      // بنقبل عربي/انجليزي – بنحوّل 3 قيم أساسية
    }

    // تحويل عربي -> انجليزي للاتساق الداخلي (اختياري)
    let normalized = method;
    if (['كاش'].includes(pay_method)) normalized = 'cash';
    if (['فيزا'].includes(pay_method)) normalized = 'visa';
    if (['ذمم'].includes(pay_method)) normalized = 'ذمم'; // نخليها كما هي إن حابها بالعربي

    const sql = `
      INSERT INTO expenses
        (date, type_id, amount, beneficiary, pay_method, description, notes, status)
      VALUES
        ($1,   $2,      $3,     $4,         $5,         $6,         $7,   'paid')
      RETURNING *;
    `;
    const values = [
      date || new Date(), // التاريخ تلقائي لو مش مبعوث
      type_id || null,
      amount,
      beneficiary || null,
      normalized || 'cash',
      description || null,
      notes || null
    ];

    const result = await db.query(sql, values);
    res.json({ message: '✅ تم إضافة المصروف', expense: result.rows[0] });
  } catch (err) {
    console.error('❌ Error adding expense:', err.message);
    res.status(500).json({ error: 'فشل إضافة المصروف' });
  }
});

/* =========================
   📚 جلب أنواع المصاريف
   ========================= */
router.get('/types', async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, name, created_at FROM expense_types ORDER BY name ASC;`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching expense types:', err.message);
    res.status(500).json({ error: 'فشل تحميل الأنواع' });
  }
});

/* =========================
   ➕ إضافة نوع مصروف
   ========================= */
router.post('/types', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'اسم النوع مطلوب' });
    }
    const result = await db.query(
      `INSERT INTO expense_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING *;`,
      [name.trim()]
    );
    // لو موجود مسبقًا، ما برجع سطر — خلّينا نرجّع OK
    if (result.rows[0]) {
      res.json({ message: '✅ تم إضافة النوع', type: result.rows[0] });
    } else {
      res.json({ message: 'ℹ️ النوع موجود مسبقًا' });
    }
  } catch (err) {
    console.error('❌ Error adding expense type:', err.message);
    res.status(500).json({ error: 'فشل إضافة النوع' });
  }
});

/* =========================
   🗑️ حذف نوع مصروف
   ========================= */
router.delete('/types/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // نحذف فقط لو لا يوجد مصروف مرتبط
    const inUse = await db.query(`SELECT 1 FROM expenses WHERE type_id=$1 LIMIT 1`, [id]);
    if (inUse.rowCount > 0) {
      return res.status(400).json({ error: 'لا يمكن حذف النوع لوجود مصاريف مرتبطة به' });
    }
    const result = await db.query(`DELETE FROM expense_types WHERE id=$1 RETURNING *;`, [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'النوع غير موجود' });
    }
    res.json({ message: '🗑️ تم حذف النوع', ok: true });
  } catch (err) {
    console.error('❌ Error deleting expense type:', err.message);
    res.status(500).json({ error: 'فشل حذف النوع' });
  }
});

module.exports = router;
