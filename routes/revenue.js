const express = require("express");
const router = express.Router();
const db = require("../database");

function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

router.get("/", async (req, res) => {
  try {
    const sql = `
      SELECT
        id,
        date,
        amount,
        payment_method,
        type              AS tank_type,
        description,
        notes,
        client_name       AS driver_name,
        vehicle_number,
        source            AS source_type
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

router.post("/", async (req, res) => {
  try {
    const {
      amount,
      payment_type,
      tank_type,
      water_amount,
      source_type,
      driver_name,
      vehicle_number,
      notes
    } = req.body;

    if (!amount) return res.status(400).json({ error: "⚠️ المبلغ مطلوب" });

    const description = water_amount ? `كمية المياه: ${water_amount}` : null;

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
