// backend/routes/vehicles.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

// GET جميع المركبات
router.get('/', (req, res) => {
  const sql = `SELECT id, number, driver_name, current_location, capacity, model, status, notes, created_at 
               FROM vehicles ORDER BY id DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// POST إضافة مركبة جديدة
router.post('/', (req, res) => {
  const { number, driver_name, current_location, capacity, model, status, notes } = req.body;
  if (!number)
    return res.status(400).json({ error: 'Vehicle number is required' });

  const sql = `INSERT INTO vehicles 
               (number, driver_name, current_location, capacity, model, status, notes)
               VALUES (?, ?, ?, ?, ?, ?, ?)`;
  const params = [number, driver_name || '', current_location || '', capacity || '', model || '', status || 'active', notes || ''];

  db.run(sql, params, function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({
      id: this.lastID,
      number, driver_name, current_location, capacity, model, status, notes
    });
  });
});

// DELETE حذف مركبة
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM vehicles WHERE id = ?', [req.params.id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: 'Vehicle deleted successfully' });
  });
});

module.exports = router;
