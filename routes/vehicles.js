// backend/routes/vehicles.js
const express = require("express");
const router = express.Router();

// ✅ نربط قاعدة البيانات بالطريقة الجديدة (بدون getConnection)
const db = require("../database");

/* 🚚 جلب كل المركبات */
router.get("/", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM vehicles ORDER BY id DESC;");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching vehicles:", err.message);
    res.status(500).json({ error: "فشل تحميل المركبات" });
  }
});

/* ➕ إضافة مركبة */
router.post("/", async (req, res) => {
  try {
    const { number, driver_name, current_location, capacity, model, status } = req.body;

    if (!number || !driver_name) {
      return res.status(400).json({ error: "رقم اللوحة واسم السائق مطلوبان" });
    }

    const sql = `
      INSERT INTO vehicles
        (number, driver_name, current_location, capacity, model, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;

    const values = [
      number,
      driver_name,
      current_location || "غير محدد",
      capacity || "غير محدد",
      model || "غير معروف",
      status || "active"
    ];

    const result = await db.query(sql, values);
    res.json({
      message: "✅ تم إضافة المركبة بنجاح",
      vehicle: result.rows[0]
    });
  } catch (err) {
    console.error("❌ Error adding vehicle:", err.message);
    res.status(500).json({ error: "فشل إضافة المركبة" });
  }
});

module.exports = router;
