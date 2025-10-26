// backend/routes/vehicles.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

/* ==================== GET - جلب جميع المركبات ==================== */
router.get('/', (req, res) => {
  const sql = `
    SELECT id, number, driver_name, current_location, capacity, model, status, notes, created_at 
    FROM vehicles
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Database error (GET vehicles):", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows);
  });
});

/* ==================== POST - إضافة مركبة جديدة ==================== */
router.post('/', (req, res) => {
  const { number, driver_name, current_location, capacity, model, status, notes } = req.body;

  if (!number) {
    return res.status(400).json({ error: '⚠️ رقم المركبة مطلوب' });
  }

  const sql = `
    INSERT INTO vehicles 
    (number, driver_name, current_location, capacity, model, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;

  const params = [
    number,
    driver_name || '',
    current_location || '',
    capacity || '',
    model || '',
    status || 'active',
    notes || ''
  ];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Database error (INSERT vehicle):", err.message);
      return res.status(500).json({ error: err.message });
    }

    const vehicle = result.rows[0];
    console.log(`✅ تمت إضافة المركبة (ID: ${vehicle.id}) بنجاح!`);

    res.json({
      message: '✅ تمت إضافة المركبة بنجاح',
      id: vehicle.id,
      vehicle
    });
  });
});

/* ==================== DELETE - حذف مركبة ==================== */
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM vehicles WHERE id = $1`;

  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error("❌ Database error (DELETE vehicle):", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ error: '⚠️ المركبة غير موجودة' });
    }

    res.json({ message: '🗑️ تم حذف المركبة بنجاح' });
  });
});

module.exports = router;
