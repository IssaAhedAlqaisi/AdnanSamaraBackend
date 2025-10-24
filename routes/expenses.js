// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

/* ==================== GET - جلب جميع المصاريف ==================== */
router.get('/', (req, res) => {
  const sql = `
    SELECT id, date, type, category, amount, recipient, payment_method, description, notes, status, created_at
    FROM expenses
    ORDER BY id DESC
  `;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error("❌ Database error (GET):", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(rows);
  });
});

/* ==================== POST - إضافة مصروف جديد ==================== */
router.post('/', (req, res) => {
  const { date, type, category, amount, recipient, payment_method, description, notes } = req.body;

  if (!date || !type || !amount) {
    return res.status(400).json({ error: '⚠️ الحقول المطلوبة: التاريخ - النوع - المبلغ' });
  }

  const sql = `
    INSERT INTO expenses 
    (date, type, category, amount, recipient, payment_method, description, notes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `;
  const params = [
    date,
    type,
    category || '',
    amount || 0,
    recipient || '',
    payment_method || '',
    description || '',
    notes || '',
    'paid'
  ];

  db.run(sql, params, function (err) {
    if (err) {
      console.error("❌ Database error (INSERT):", err.message);
      return res.status(500).json({ error: err.message });
    }

    console.log(`✅ تم إضافة المصروف (ID: ${this.lastID}) بنجاح!`);

    res.json({
      message: '✅ تمت إضافة المصروف بنجاح',
      id: this.lastID,
      expense: {
        id: this.lastID,
        date,
        type,
        category,
        amount,
        recipient,
        payment_method,
        description,
        notes,
        status: 'paid'
      }
    });
  });
});

/* ==================== DELETE - حذف مصروف ==================== */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  db.run('DELETE FROM expenses WHERE id = ?', [id], function (err) {
    if (err) {
      console.error("❌ Database error (DELETE):", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ message: '🗑️ تم حذف المصروف بنجاح' });
  });
});

module.exports = router;
