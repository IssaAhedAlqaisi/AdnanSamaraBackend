// backend/routes/vehicles.js
const express = require("express");
const router = express.Router();
const pool = require("../database");

/* 🚚 جلب كل المركبات */
router.get("/", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM vehicles ORDER BY id DESC;");
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
    if (!number || !driver_name)
      return res.status(400).json({ error: "رقم اللوحة واسم السائق مطلوبان" });

    const sql = `
      INSERT INTO vehicles (number, driver_name, current_location, capacity, model, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const result = await pool.query(sql, [number, driver_name, current_location, capacity, model, status || "active"]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding vehicle:", err.message);
    res.status(500).json({ error: "فشل إضافة المركبة" });
  }
});

module.exports = router;
