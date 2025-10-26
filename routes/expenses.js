// backend/routes/expenses.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection(); // PostgreSQL pool instance

/* ==================== GET - جلب جميع المصاريف ==================== */
router.get('/', (req, res) => {
  const sql = `
    SELECT id, date, type, category, amount, recipient, payment_method, description, notes, status, created_at
    FROM expenses
    ORDER BY id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error("❌ Database error (GET):", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows);
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
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
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

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("❌ Database error (INSERT):", err.message);
      return res.status(500).json({ error: err.message });
    }

    const expense = result.rows[0];
    console.log(`✅ تم إضافة المصروف (ID: ${expense.id}) بنجاح!`);

    res.json({
      message: '✅ تمت إضافة المصروف بنجاح',
      id: expense.id,
      expense
    });
  });
});

/* ==================== DELETE - حذف مصروف ==================== */
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const sql = 'DELETE FROM expenses WHERE id = $1';

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("❌ Database error (DELETE):", err.message);
      return res.status(500).json({ error: err.message });
    }

    if (result.rowCount === 0) {
      return res.status(404).json({ message: '⚠️ لم يتم العثور على المصروف المطلوب حذفه' });
    }

    res.json({ message: '🗑️ تم حذف المصروف بنجاح' });
  });
});

module.exports = router;
