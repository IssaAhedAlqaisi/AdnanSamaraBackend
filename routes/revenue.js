// backend/routes/revenue.js
const express = require("express");
const router = express.Router();
const pool = require("../database");

/* 📅 Helper لتنسيق التاريخ */
function normalizeDate() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/* ==================== GET - جلب كل الإيرادات ==================== */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM revenue ORDER BY date DESC;");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء تحميل البيانات" });
  }
});

/* ==================== POST - إضافة إيراد جديد ==================== */
router.post("/", async (req, res) => {
  try {
    // ✅ أسماء المفاتيح أصبحت متوافقة مع ما يرسله الـfrontend
    const {
      amount,
      payment_method, // كان اسمها payment_type
      tank_type,
      water_amount,
      source, // كان اسمها source_type
      driver_name,
      vehicle_number,
      notes
    } = req.body;

    if (!amount) return res.status(400).json({ error: "⚠️ المبلغ مطلوب" });

    const date = normalizeDate();

    const sql = `
      INSERT INTO revenue
        (date, source, type, amount, client_name, vehicle_number, payment_method, notes, status, created_at)
      VALUES
        ($1, $2, $3, $4, $5, $6, $7, $8, 'completed', NOW())
      RETURNING *;
    `;

    const values = [
      date,
      source || "غير محدد",
      tank_type || "نقلة مياه",
      amount,
      driver_name || "غير معروف",
      vehicle_number || "غير محدد",
      payment_method || "نقد",
      notes || ""
    ];

    const result = await pool.query(sql, values);
    res.json({
      message: "✅ تمت إضافة الإيراد بنجاح",
      revenue: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error inserting revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء إضافة الإيراد" });
  }
});

/* ==================== DELETE - حذف إيراد ==================== */
router.delete("/:id", async (req, res) => {
  try {
    const result = await pool.query("DELETE FROM revenue WHERE id = $1", [req.params.id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "الإيراد غير موجود" });
    res.json({ message: "🗑️ تم حذف الإيراد" });
  } catch (err) {
    console.error("❌ Error deleting revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء الحذف" });
  }
});

module.exports = router;
