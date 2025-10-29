// backend/routes/expenses.js
const express = require("express");
const router = express.Router();
const db = require("../database");

/* ─────────────────────────────
   أنواع المصاريف
   ───────────────────────────── */

// GET /api/expenses/types
router.get("/types", async (_req, res) => {
  try {
    const q = await db.query("SELECT id, name FROM expense_types ORDER BY name ASC;");
    res.json(q.rows);
  } catch (e) {
    console.error("❌ get types:", e.message);
    res.status(500).json({ error: "فشل تحميل أنواع المصاريف" });
  }
});

// POST /api/expenses/types { name }
router.post("/types", async (req, res) => {
  try {
    const name = (req.body?.name || "").trim();
    if (!name) return res.status(400).json({ error: "اسم النوع مطلوب" });
    const q = await db.query(
      "INSERT INTO expense_types (name) VALUES ($1) ON CONFLICT (name) DO NOTHING RETURNING id, name;",
      [name]
    );
    // لو موجود أصلاً، رجّع السطر اللاعب
    if (q.rowCount === 0) {
      const again = await db.query("SELECT id, name FROM expense_types WHERE name=$1;", [name]);
      return res.json(again.rows[0]);
    }
    res.json(q.rows[0]);
  } catch (e) {
    console.error("❌ add type:", e.message);
    res.status(500).json({ error: "فشل إضافة النوع" });
  }
});

// DELETE /api/expenses/types/:id
router.delete("/types/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM expense_types WHERE id=$1;", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ delete type:", e.message);
    res.status(500).json({ error: "فشل حذف النوع" });
  }
});

/* ─────────────────────────────
   المصاريف
   ───────────────────────────── */

// GET /api/expenses
router.get("/", async (_req, res) => {
  try {
    const q = await db.query(`
      SELECT e.id, e.date, e.amount, e.beneficiary, e.pay_method, e.description, e.notes, e.status,
             et.name AS type_name, e.type_id
      FROM expenses e
      LEFT JOIN expense_types et ON et.id = e.type_id
      ORDER BY e.date DESC, e.id DESC;
    `);
    res.json(q.rows);
  } catch (e) {
    console.error("❌ get expenses:", e.message);
    res.status(500).json({ error: "فشل تحميل المصاريف" });
  }
});

// POST /api/expenses
router.post("/", async (req, res) => {
  try {
    const {
      date,          // string (YYYY-MM-DD) أو فارغ -> DEFAULT
      type_id,       // integer
      amount,        // number
      beneficiary,   // text
      pay_method,    // 'كاش' | 'فيزا' | 'ذمم'
      description,   // text
      notes          // text
    } = req.body || {};

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: "المبلغ مطلوب وصحيح" });
    }

    const sql = `
      INSERT INTO expenses (date, type_id, amount, beneficiary, pay_method, description, notes, status)
      VALUES (COALESCE($1::date, CURRENT_DATE), $2, $3, $4, $5, $6, $7, 'paid')
      RETURNING id;
    `;
    const vals = [
      date || null,
      Number(type_id) || null,
      Number(amount),
      (beneficiary || "").trim() || null,
      (pay_method || "").trim() || null,
      (description || "").trim() || null,
      (notes || "").trim() || null
    ];
    const q = await db.query(sql, vals);
    res.json({ success: true, id: q.rows[0].id });
  } catch (e) {
    console.error("❌ add expense:", e.message);
    res.status(500).json({ error: "فشل إضافة المصروف" });
  }
});

// PUT /api/expenses/:id
router.put("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const {
      date, type_id, amount, beneficiary, pay_method, description, notes, status
    } = req.body || {};

    const sql = `
      UPDATE expenses
      SET date = COALESCE($1::date, date),
          type_id = COALESCE($2, type_id),
          amount = COALESCE($3, amount),
          beneficiary = COALESCE($4, beneficiary),
          pay_method = COALESCE($5, pay_method),
          description = COALESCE($6, description),
          notes = COALESCE($7, notes),
          status = COALESCE($8, status)
      WHERE id=$9
      RETURNING id;
    `;
    const vals = [
      date || null,
      type_id != null ? Number(type_id) : null,
      amount != null ? Number(amount) : null,
      beneficiary || null,
      pay_method || null,
      description || null,
      notes || null,
      status || null,
      id
    ];
    const q = await db.query(sql, vals);
    if (!q.rowCount) return res.status(404).json({ error: "المصروف غير موجود" });
    res.json({ success: true });
  } catch (e) {
    console.error("❌ update expense:", e.message);
    res.status(500).json({ error: "فشل تعديل المصروف" });
  }
});

// DELETE /api/expenses/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM expenses WHERE id=$1;", [req.params.id]);
    res.json({ success: true });
  } catch (e) {
    console.error("❌ delete expense:", e.message);
    res.status(500).json({ error: "فشل حذف المصروف" });
  }
});

module.exports = router;
