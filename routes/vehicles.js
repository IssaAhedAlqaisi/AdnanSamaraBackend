// backend/routes/vehicles.js
const express = require("express");
const router = express.Router();
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
      INSERT INTO vehicles (number, driver_name, current_location, capacity, model, status, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
      RETURNING *;
    `;
    const result = await db.query(sql, [
      number,
      driver_name,
      current_location || "غير محدد",
      capacity || "غير محدد",
      model || "غير معروف",
      status || "active"
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding vehicle:", err.message);
    res.status(500).json({ error: "فشل إضافة المركبة" });
  }
});

/* 🗑️ حذف مركبة */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM vehicles WHERE id = $1 RETURNING *;", [id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: "لم يتم العثور على المركبة" });
    res.json({ success: true, message: "تم حذف المركبة بنجاح" });
  } catch (err) {
    console.error("❌ Error deleting vehicle:", err.message);
    res.status(500).json({ error: "فشل حذف المركبة" });
  }
});

/* 🚛 جلب كل السجلات اليومية */
router.get("/logs", async (req, res) => {
  try {
    const result = await db.query("SELECT * FROM vehicle_logs ORDER BY id DESC;");
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching logs:", err.message);
    res.status(500).json({ error: "فشل تحميل السجلات" });
  }
});

/* ➕ إضافة سجل يومي */
router.post("/logs", async (req, res) => {
  try {
    const { driver_name, vehicle_number, odometer_start, odometer_end } = req.body;
    if (!driver_name || !vehicle_number) {
      console.warn("⚠️ Missing driver or vehicle, skipping log insert");
      return res.json({ warning: "تم تجاوز السجل لأن البيانات ناقصة" });
    }

    const sql = `
      INSERT INTO vehicle_logs (driver_name, vehicle_number, odometer_start, odometer_end)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const result = await db.query(sql, [
      driver_name,
      vehicle_number,
      odometer_start,
      odometer_end
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding log:", err.message);
    res.status(500).json({ error: "فشل إضافة السجل" });
  }
});

module.exports = router;
