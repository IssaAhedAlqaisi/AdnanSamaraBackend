const express = require('express');
const router = express.Router();
const { getConnection } = require('../database');
const pool = getConnection();


/* ==========================
   🚛 المركبات الأساسية
   ========================== */
router.get('/', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicles ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { number, driver_name, current_location, capacity, model, status, notes } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO vehicles (number, driver_name, current_location, capacity, model, status, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [number, driver_name, current_location, capacity, model, status, notes]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM vehicles WHERE id=$1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ==========================
   🚚 عداد المركبات
   ========================== */
(async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS vehicle_logs (
      id SERIAL PRIMARY KEY,
      date DATE DEFAULT CURRENT_DATE,
      driver_name TEXT NOT NULL,
      vehicle_number TEXT NOT NULL,
      odometer_start REAL,
      odometer_end REAL,
      distance REAL GENERATED ALWAYS AS (odometer_end - odometer_start) STORED,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
})();

router.get('/logs', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM vehicle_logs ORDER BY id DESC');
    res.json(rows);
  } catch (err) {
    console.error('Error fetching logs:', err.message);
    res.status(500).json({ error: 'Failed to fetch logs' });
  }
});

router.post('/logs', async (req, res) => {
  const { driver_name, vehicle_number, odometer_start, odometer_end } = req.body;
  try {
    const { rows } = await pool.query(
      `INSERT INTO vehicle_logs (driver_name, vehicle_number, odometer_start, odometer_end)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [driver_name, vehicle_number, odometer_start, odometer_end]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error('Error inserting log:', err.message);
    res.status(500).json({ error: 'Failed to add log' });
  }
});

module.exports = router;
