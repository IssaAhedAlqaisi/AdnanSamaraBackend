// backend/routes/revenue.js
const express = require("express");
const router = express.Router();

// ✅ استخدم نفس الإكسبورت من database.js (بترجع Pool جاهز)
const db = require("../database");

/* 🔧 Helper: تاريخ اليوم بصيغة YYYY-MM-DD */
function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

/* ==================== GET - جلب كل الإيرادات ==================== */
router.get("/", async (req, res) => {
  try {
    // نعمل alias للأعمدة عشان توافق أسماء الفرونت الحالية
    const sql = `
      SELECT
        id,
        date,
        amount,
        payment_method,
        type              AS tank_type,       -- نوع النقلة (اسم متوقّعه الواجهة)
        description,
        notes,
        client_name       AS driver_name,     -- اسم السائق (موقّتًا)
        vehicle_number,
        source            AS source_type      -- مصدر الماء
      FROM revenue
      ORDER BY date DESC, id DESC;
    `;
    const result = await db.query(sql);
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء تحميل الإيرادات" });
  }
});

/* ==================== POST - إضافة إيراد جديد ==================== */
router.post("/", async (req, res) => {
  try {
    // نستقبل حقول الفرونت ونحوّلها لأعمدة الجدول الموجودة
    const {
      amount,
      payment_type,   // -> payment_method
      tank_type,      // -> type
      water_amount,   // نلصقه في description/notes
      source_type,    // -> source
      driver_name,    // -> client_name (مؤقت)
      vehicle_number, // -> vehicle_number
      notes
    } = req.body;

    if (!amount) {
      return res.status(400).json({ error: "⚠️ المبلغ مطلوب" });
    }

    const description = water_amount
      ? `كمية المياه: ${water_amount}`
      : null;

    const sql = `
      INSERT INTO revenue
        (date, source, type, amount, client_name, vehicle_number, payment_method, description, notes, status, created_at)
      VALUES
        ($1,   $2,     $3,   $4,     $5,          $6,             $7,             $8,          $9,   'completed', NOW())
      RETURNING
        id, date, amount, payment_method,
        type AS tank_type, description, notes,
        client_name AS driver_name, vehicle_number, source AS source_type;
    `;

    const values = [
      today(),
      source_type || "غير محدد",
      tank_type || "نقلة مياه",
      amount,
      driver_name || "غير معروف",
      vehicle_number || "غير محدد",
      payment_type || "كاش",
      description,
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
    const result = await db.query("DELETE FROM revenue WHERE id = $1;", [req.params.id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "الإيراد غير موجود" });
    res.json({ message: "🗑️ تم حذف الإيراد" });
  } catch (err) {
    console.error("❌ Error deleting revenue:", err.message);
    res.status(500).json({ error: "خطأ أثناء الحذف" });
  }
});

module.exports = router;
