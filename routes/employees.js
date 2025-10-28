// backend/routes/employees.js
const express = require('express');
const router = express.Router();
const database = require('../database');
const db = require("../database"); // PostgreSQL pool

// 🟢 GET - جلب جميع الموظفين
router.get('/', (req, res) => {
  const sql = `SELECT * FROM employees ORDER BY created_at DESC`;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('❌ Error fetching employees:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows);
  });
});

// 🟢 POST - إضافة موظف جديد
router.post('/', (req, res) => {
  const { name, job_title, department, salary, phone, social_number, hire_date, status, notes } = req.body;

  if (!name || !department || !salary) {
    return res.status(400).json({ error: 'Name, department, and salary are required' });
  }

  const sql = `
    INSERT INTO employees 
    (name, job_title, department, salary, phone, social_number, hire_date, status, notes)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `;
  const params = [name, job_title, department, salary, phone, social_number, hire_date, status || 'active', notes || ''];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ Error inserting employee:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json({
      message: 'Employee created successfully',
      employee: result.rows[0]
    });
  });
});

// 🟢 PUT - تعديل بيانات موظف
router.put('/:id', (req, res) => {
  const { name, job_title, department, salary, phone, social_number, hire_date, status, notes } = req.body;

  const sql = `
    UPDATE employees
    SET name = $1, job_title = $2, department = $3, salary = $4, phone = $5,
        social_number = $6, hire_date = $7, status = $8, notes = $9, updated_at = CURRENT_TIMESTAMP
    WHERE id = $10
    RETURNING *
  `;
  const params = [name, job_title, department, salary, phone, social_number, hire_date, status, notes, req.params.id];

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('❌ Error updating employee:', err);
      return res.status(500).json({ error: err.message });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee updated successfully', employee: result.rows[0] });
  });
});

// 🟢 DELETE - حذف موظف
router.delete('/:id', (req, res) => {
  const sql = `DELETE FROM employees WHERE id = $1`;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) {
      console.error('❌ Error deleting employee:', err);
      return res.status(500).json({ error: err.message });
    }
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Employee not found' });
    }
    res.json({ message: 'Employee deleted successfully' });
  });
});

// 🟢 GET - إحصائيات الموظفين
router.get('/stats/summary', (req, res) => {
  const sql = `
    SELECT 
      COUNT(*) as total_employees,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_employees,
      SUM(CASE WHEN status = 'trial' THEN 1 ELSE 0 END) as trial_employees,
      SUM(salary) as total_salaries,
      department,
      COUNT(*) as department_count
    FROM employees
    GROUP BY department
  `;

  db.query(sql, (err, result) => {
    if (err) {
      console.error('❌ Error fetching employee stats:', err);
      return res.status(500).json({ error: err.message });
    }
    res.json(result.rows);
  });
});

module.exports = router;
