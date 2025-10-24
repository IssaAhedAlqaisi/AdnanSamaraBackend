const express = require('express');
const router = express.Router();
const database = require('../database');
const db = database.getConnection();

// GET /api/employees - جلب كل الموظفين
router.get('/', (req, res) => {
    const sql = `SELECT * FROM employees ORDER BY created_at DESC`;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// POST /api/employees - إضافة موظف جديد
router.post('/', (req, res) => {
    const { name, job_title, department, salary, phone, social_number, hire_date, status, notes } = req.body;
    
    if (!name || !department || !salary) {
        return res.status(400).json({ error: 'Name, department, and salary are required' });
    }

    const sql = `INSERT INTO employees 
                (name, job_title, department, salary, phone, social_number, hire_date, status, notes) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    
    const params = [name, job_title, department, salary, phone, social_number, hire_date, status, notes];
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({
            message: 'Employee created successfully',
            employeeId: this.lastID
        });
    });
});

// PUT /api/employees/:id - تعديل موظف
router.put('/:id', (req, res) => {
    const { name, job_title, department, salary, phone, social_number, hire_date, status, notes } = req.body;
    
    const sql = `UPDATE employees 
                SET name = ?, job_title = ?, department = ?, salary = ?, phone = ?, 
                    social_number = ?, hire_date = ?, status = ?, notes = ?, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?`;
    
    const params = [name, job_title, department, salary, phone, social_number, hire_date, status, notes, req.params.id];
    
    db.run(sql, params, function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee updated successfully' });
    });
});

// DELETE /api/employees/:id - حذف موظف
router.delete('/:id', (req, res) => {
    const sql = `DELETE FROM employees WHERE id = ?`;
    
    db.run(sql, [req.params.id], function(err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (this.changes === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json({ message: 'Employee deleted successfully' });
    });
});

// GET /api/employees/stats - إحصائيات الموظفين
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
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

module.exports = router;