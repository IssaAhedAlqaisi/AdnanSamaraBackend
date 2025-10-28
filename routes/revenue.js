// backend/routes/revenue.js
const express = require("express");
const router = express.Router();
const { getConnection } = require("../database");
const db = getConnection();

/* ✅ Helper لتنسيق التاريخ */
function normalizeDate(input) {
  if (!input) return new Date().toISOString().slice(0, 10);
  const d = new Date(input);
  if (!isNaN(d)) return d.toISOString().slice(0, 10);
  return new Date().toISOString().slice(0, 10);
}

/* ==================== GET - جميع الإيرادات مع الفلاتر ==================== */
router.get("/", async (req, res) => {
  try {
    const { date_from, date_to } = req.query;
    let sql = `SELECT id, date, source, type, amount, notes, status, created_at FROM revenue`;
    const params = [];

    if (date_from && date_to) {
      sql += ` WHERE date BETWEEN $1 AND $2 ORDER BY date DESC`;
      params.push(date_from, date_to);
    } else {
      sql += ` ORDER BY date DESC`;
    }

    const result = await db.query(sql, params);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching revenue:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ==================== POST - إضافة إيراد جديد ==================== */
router.post("/", async (req, res) => {
  try {
    const {
      amount,
      payment_type, // كاش / ذمم / فيزا
      tank_type, // نوع النقلة (3 متر، 8 متر، ...)
      water_amount, // كمية المياه
      source_type, // مصدر الماء (ذمم / نقد)
      driver_name, // اسم السائق
      vehicle_number, // رقم السيارة
      notes,
    } = req.body;

    if (!amount || !payment_type || !tank_type) {
      return res
        .status(400)
        .json({ error: "⚠️ المبلغ ونوع الدفع والنقلة مطلوبة" });
    }

    const date = normalizeDate(new Date());
    const meta = {
      payment_type,
      tank_type,
      water_amount,
      source_type,
      driver_name,
      vehicle_number,
    };

    const fullNotes =
      (notes ? notes.trim() + " " : "") + "##META##" + JSON.stringify(meta);

    const sql = `
      INSERT INTO revenue (date, source, type, amount, notes, status, created_at)
      VALUES ($1, $2, $3, $4, $5, 'completed', NOW())
      RETURNING *
    `;
    const params = [date, source_type || "غير محدد", payment_type, amount, fullNotes];

    const result = await db.query(sql, params);
    const row = result.rows[0];
    res.json({ message: "✅ تمت إضافة الإيراد بنجاح", revenue: row });
  } catch (err) {
    console.error("❌ Error inserting revenue:", err);
    res.status(500).json({ error: err.message });
  }
});

/* ==================== DELETE - حذف إيراد ==================== */
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query(`DELETE FROM revenue WHERE id = $1`, [
      req.params.id,
    ]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "⚠️ الإيراد غير موجود" });
    res.json({ message: "🗑️ تم حذف الإيراد بنجاح" });
  } catch (err) {
    console.error("❌ Error deleting revenue:", err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
