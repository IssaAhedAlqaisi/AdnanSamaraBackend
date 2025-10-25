// backend/routes/revenue.js
const express = require("express");
const router = express.Router();
const db = require("../database").getConnection();

// ✅ جلب كل الإيرادات
router.get("/", (req, res) => {
  db.all(`SELECT id, date, source, amount, notes, created_at FROM revenue ORDER BY date DESC`, [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ✅ إضافة إيراد جديد
router.post("/", (req, res) => {
  const { date, source, amount, notes } = req.body;
  if (!date || !amount) {
    return res.status(400).json({ error: "الرجاء إدخال التاريخ والمبلغ" });
  }

  const query = `
    INSERT INTO revenue (date, source, amount, notes, created_at)
    VALUES (?, ?, ?, ?, datetime('now', 'localtime'))
  `;

  db.run(query, [date, source || "غير محدد", amount, notes || ""], function (err) {
    if (err) {
      console.error("DB Insert Error:", err.message);
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true, id: this.lastID });
  });
});

// ✅ حذف إيراد
router.delete("/:id", (req, res) => {
  const { id } = req.params;
  db.run(`DELETE FROM revenue WHERE id = ?`, [id], function (err) {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ success: true, deleted: this.changes });
  });
});

module.exports = router;
