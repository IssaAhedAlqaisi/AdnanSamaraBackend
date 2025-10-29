// backend/routes/vehicles.js
const express = require("express");
const router = express.Router();
const db = require("../database");

/* 🚚 جلب كل المركبات */
router.get("/", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, number, driver_name, current_location, status, created_at FROM vehicles ORDER BY id DESC;"
    );
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
      RETURNING id, number, driver_name, current_location, status, created_at;
    `;

    const values = [
      number,
      driver_name,
      (current_location || "غير محدد"),
      (capacity || "غير محدد"),
      (model || "غير معروف"),
      (status || "active"),
    ];

    const result = await db.query(sql, values);
    res.json({ message: "✅ تم إضافة المركبة بنجاح", vehicle: result.rows[0] });
  } catch (err) {
    console.error("❌ Error adding vehicle:", err.message);
    res.status(500).json({ error: "فشل إضافة المركبة" });
  }
});

/* ================================
   🚛 سجلات المركبات اليومية (ثابتة)
   ================================ */

// رجّع كل السجلات (الأحدث أولاً)
router.get("/logs", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT id, date, driver_name, vehicle_number, odometer_start, odometer_end, distance FROM vehicle_logs ORDER BY date DESC, id DESC;"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("❌ Error fetching logs:", err.message);
    res.status(500).json({ error: "فشل تحميل السجلات" });
  }
});

// أضف سجل جديد — من دون رفض بسبب قيم ناقصة: نكمّل بقيم افتراضية ونحوّل الأرقام
router.post("/logs", async (req, res) => {
  try {
    const driver_name    = (req.body.driver_name || "").toString().trim() || "غير معروف";
    const vehicle_number = (req.body.vehicle_number || "").toString().trim() || "غير محدد";
    const odometer_start = Number.parseFloat(req.body.odometer_start) || 0;
    const odometer_end   = Number.parseFloat(req.body.odometer_end)   || 0;

    const sql = `
      INSERT INTO vehicle_logs
        (date, driver_name, vehicle_number, odometer_start, odometer_end)
      VALUES (CURRENT_DATE, $1, $2, $3, $4)
      RETURNING id, date, driver_name, vehicle_number, odometer_start, odometer_end, distance;
    `;
    const result = await db.query(sql, [
      driver_name,
      vehicle_number,
      odometer_start,
      odometer_end,
    ]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("❌ Error adding log:", err.message);
    res.status(500).json({ error: "فشل إضافة السجل" });
  }
});

/* 🗑️ حذف مركبة */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await db.query("DELETE FROM vehicles WHERE id = $1 RETURNING id;", [id]);
    if (result.rowCount === 0) return res.status(404).json({ error: "لم يتم العثور على المركبة" });
    res.json({ success: true, message: "🗑️ تم حذف المركبة" });
  } catch (err) {
    console.error("❌ Error deleting vehicle:", err.message);
    res.status(500).json({ error: "فشل حذف المركبة" });
  }
});

module.exports = router;
