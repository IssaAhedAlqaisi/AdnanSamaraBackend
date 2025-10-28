// backend/routes/vehicles.js
const express = require('express');
const router = express.Router();
const { getConnection } = require('../database');
const pool = getConnection();

/* ✅ جلب جميع المركبات */
router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching vehicles:', err.message);
    res.status(500).json({ error: 'Database error' });
  }
});

/* ✅ إضافة مركبة جديدة */
router.post('/', async (req, res) => {
  const { number, driver_name, current_location, status } = req.body;

  if (!number || !driver_name) {
    return res.status(400).json({ error: ⚠️ رقم اللوحة واسم السائق مطلوبان' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO vehicles (number, driver_name, current_location, status)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [number, driver_name, current_location || '', status || 'active']
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error adding vehicle:', err.message);
    res.status(500).json({ error: 'Insert failed' });
  }
});

/* ✅ حذف مركبة */
router.delete('/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM vehicles WHERE id = $1', [req.params.id]);
    if (result.rowCount === 0)
      return res.status(404).json({ error: '⚠️ المركبة غير موجودة' });
    res.json({ success: true, message: '🗑️ تم حذف المركبة بنجاح' });
  } catch (err) {
    console.error('❌ Error deleting vehicle:', err.message);
    res.status(500).json({ error: 'Delete failed' });
  }
});

module.exports = router;
