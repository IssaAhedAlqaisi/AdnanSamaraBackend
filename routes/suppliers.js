// backend/routes/suppliers.js
const express = require("express");
const router = express.Router();
const database = require("../database");
const db = database.getConnection();

/* ==================== GET - جلب جميع الموردين ==================== */
router.get("/", (req, res) => {
  const sql = `
    SELECT id, name, source_type, area, phone, price_per_meter, price_per_tank, capacity, notes, status, created_at
    FROM suppliers
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Database error (GET suppliers):", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows);
  });
});

/* ==================== POST - إضافة مورد جديد ==================== */
router.post("/", (req, res) => {
  const { name, source_type, area, phone, price_per_meter, price_per_tank, capacity, notes, status } = req.body;

  if (!name || !source_type || !area) {
    return res.status(400).json({ error: "⚠️ اسم المورد، نوع المصدر والمنطقة مطلوبة" });
  }

  const sql = `
    INSERT INTO suppliers 
    (name, source_type, area, phone, price_per_meter, price_per_tank, capacity, notes, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;

  const params = [
    name,
    source_type,
    area,
    phone || "",
    price_per_meter || 0,
    price_per_tank || 0,
    capacity || "",
    notes || "",
    status || "active",
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Database error (INSERT supplier):", err.message);
      return res.status(500).json({ error: err.message });
    }

    const supplier = result.rows[0];
    console.log(`✅ تمت إضافة المورد (ID: ${supplier.id}) بنجاح!`);

    res.json({
      message: "✅ تمت إضافة المورد بنجاح",
      id: supplier.id,
      supplier,
    });
  });
});

/* ==================== DELETE - حذف مورد ==================== */
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM suppliers WHERE id = $1";

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Database error (DELETE supplier):", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "⚠️ لم يتم العثور على المورد المطلوب" });
    }

    res.json({ message: "🗑️ تم حذف المورد بنجاح" });
  });
});

module.exports = router;
