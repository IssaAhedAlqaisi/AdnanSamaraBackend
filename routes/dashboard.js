// backend/routes/dashboard.js
const express = require("express");
const router = express.Router();
const database = require("../database");
const db = database.getConnection();

// 🔹 إجمالي الإيرادات والمصاريف + عدد الموظفين والمركبات
router.get("/stats", (req, res) => {
  const result = {};

  const queries = {
    revenue: "SELECT IFNULL(SUM(amount), 0) AS total_revenue FROM revenue WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
    expenses: "SELECT IFNULL(SUM(amount), 0) AS total_expenses FROM expenses WHERE strftime('%Y-%m', date) = strftime('%Y-%m', 'now')",
    employees: "SELECT COUNT(*) AS count_employees FROM employees",
    vehicles: "SELECT COUNT(*) AS count_vehicles FROM vehicles"
  };

  db.all(queries.revenue, [], (err, rows) => {
    result.revenue = rows[0].total_revenue;
    db.all(queries.expenses, [], (err2, rows2) => {
      result.expenses = rows2[0].total_expenses;
      db.all(queries.employees, [], (err3, rows3) => {
        result.employees = rows3[0].count_employees;
        db.all(queries.vehicles, [], (err4, rows4) => {
          result.vehicles = rows4[0].count_vehicles;
          res.json(result);
        });
      });
    });
  });
});

// 🔹 الإيرادات والمصاريف آخر 6 أشهر
router.get("/monthly", (req, res) => {
  const sql = `
    SELECT 
      strftime('%Y-%m', date) AS month,
      SUM(CASE WHEN type='revenue' THEN amount ELSE 0 END) AS total_revenue,
      SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) AS total_expense
    FROM (
      SELECT date, amount, 'revenue' AS type FROM revenue
      UNION ALL
      SELECT date, amount, 'expense' AS type FROM expenses
    )
    GROUP BY month
    ORDER BY month DESC
    LIMIT 6
  `;
  db.all(sql, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows.reverse());
  });
});

module.exports = router;
