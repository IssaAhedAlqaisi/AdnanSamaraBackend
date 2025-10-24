// backend/routes/suppliers.js
const express = require("express");
const router = express.Router();
const database = require("../database");
const db = database.getConnection();

/* ========== جلب كل الموردين ========== */
router.get("/", (req, res) => {
  const sql = `SELECT id, name, source_type, area, phone, price_per_meter, price_per_tank, capacity, notes, status, created_at 
               FROM suppliers ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

/* ========== إضافة مورد جديد ========== */
router.post("/", (req, res) => {
  const { name, source_type, area, phone, price_per_meter, price_per_tank, capacity, notes, status } = req.body;

  if (!name || !source_type || !area) {
    return res.status(400).json({ error: "اسم المورد، نوع المصدر والمنطقة مطلوبة" });
  }

  const sql = `INSERT INTO suppliers 
              (name, source_type, area, phone, price_per_meter, price_per_tank, capacity, notes, status)
              VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;

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

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      message: "✅ تمت إضافة المورد بنجاح",
      id: this.lastID,
      supplier: {
        id: this.lastID,
        name,
        source_type,
        area,
        phone,
        price_per_meter,
        price_per_tank,
        capacity,
        notes,
        status: "active",
      },
    });
  });
});

/* ========== حذف مورد ========== */
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.run("DELETE FROM suppliers WHERE id = ?", [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ تم حذف المورد بنجاح" });
  });
});

module.exports = router;
