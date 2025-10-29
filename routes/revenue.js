// backend/routes/revenue.js
const express = require("express");
const router = express.Router();
const db = require("../database");

/* ==================== GET - جلب كل الإيرادات ==================== */
router.get("/", async (_req, res) => {
  try {
    const result = await db.query(`
      SELECT id, date, amount, payment_method, tank_type, water_amount,
             source, driver_name, vehicle_number, notes, status, created_at
      FROM revenue
      ORDER BY date DESC, id DESC;
    `);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء تحميل البيانات" });
  }
});

/* ==================== POST - إضافة إيراد جديد ==================== */
router.post("/", async (req, res) => {
  try {
    const {
      amount,
      payment_method,    // مثال: "كاش" / "ذمم" / "فيزا"
      tank_type,         // نوع النقلة
      water_amount,      // كمية المياه
      source,            // مصدر الماء
      driver_name,
      vehicle_number,
      notes
    } = req.body;

    if (!amount || isNaN(Number(amount))) {
      return res.status(400).json({ error: "⚠️ المبلغ مطلوب وبشكل صحيح" });
    }

    const sql = `
      INSERT INTO revenue
        (date, amount, payment_method, tank_type, water_amount, source,
         driver_name, vehicle_number, notes, status, created_at)
      VALUES
        (CURRENT_DATE, $1, $2, $3, $4, $5,
         $6, $7, $8, 'completed', NOW())
      RETURNING *;
    `;

    const values = [
      Number(amount),
      payment_method || 'cash',
      tank_type || null,
      water_amount || null,
      source || 'system',
      driver_name || null,
      vehicle_number || null,
      notes || null
    ];

    const result = await db.query(sql, values);
    res.json({ message: "✅ تمت إضافة الإيراد بنجاح", revenue: result.rows[0] });
  } catch (err) {
    console.error("❌ Error inserting revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء إضافة الإيراد" });
  }
});

/* ==================== DELETE - حذف إيراد ==================== */
router.delete("/:id", async (req, res) => {
  try {
    const result = await db.query("DELETE FROM revenue WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "الإيراد غير موجود" });
    res.json({ message: "🗑️ تم حذف الإيراد" });
  } catch (err) {
    console.error("❌ Error deleting revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء الحذف" });
  }
});

module.exports = router;
