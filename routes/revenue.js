const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

// ===========================
// 📦 GET /api/revenue - جلب كل الإيرادات
// ===========================
router.get('/', (req, res) => {
    const sql = `SELECT * FROM revenue ORDER BY date DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error('Error fetching revenue:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// ===========================
// ➕ POST /api/revenue - إضافة إيراد جديد
// ===========================
router.post('/', (req, res) => {
    const { date, source, amount, notes } = req.body;

    if (!date || !amount) {
        return res.status(400).json({ error: 'التاريخ والمبلغ مطلوبان' });
    }

    const sql = `
        INSERT INTO revenue 
        (date, source, type, amount, notes, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', 'localtime'))
    `;

    const params = [
        date,
        source || 'غير محدد',
        'manual', // ✅ نوع العملية افتراضي
        amount,
        notes || '',
        'completed'
    ];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('DB Insert Error:', err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'تمت إضافة الإيراد بنجاح ✅',
            revenueId: this.lastID
        });
    });
});

// ===========================
// ✏️ PUT /api/revenue/:id - تعديل الإيراد
// ===========================
router.put('/:id', (req, res) => {
    const { date, source, amount, notes, status } = req.body;

    const sql = `
        UPDATE revenue
        SET date = ?, source = ?, amount = ?, notes = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    `;

    const params = [date, source, amount, notes, status, req.params.id];

    db.run(sql, params, function (err) {
        if (err) {
            console.error('Error updating revenue:', err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'الإيراد غير موجود' });
        }
        res.json({ message: 'تم تعديل الإيراد بنجاح ✅' });
    });
});

// ===========================
// ❌ DELETE /api/revenue/:id - حذف الإيراد
// ===========================
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM revenue WHERE id = ?`;

    db.run(sql, [req.params.id], function (err) {
        if (err) {
            console.error('Error deleting revenue:', err);
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'الإيراد غير موجود' });
        }
        res.json({ message: 'تم حذف الإيراد بنجاح 🗑️' });
    });
});

// ===========================
// 📈 GET /api/revenue/stats - إحصائيات الإيرادات
// ===========================
router.get('/stats/summary', (req, res) => {
    const sql = `
        SELECT 
            COUNT(*) as total_revenue,
            SUM(amount) as total_amount,
            SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as completed_amount
        FROM revenue
    `;

    db.get(sql, [], (err, row) => {
        if (err) {
            console.error('Error fetching revenue stats:', err);
            return res.status(500).json({ error: err.message });
        }
        res.json(row);
    });
});

module.exports = router;
