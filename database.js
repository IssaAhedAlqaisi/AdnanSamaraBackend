// backend/database.js
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class Database {
    constructor() {
        this.dbPath = path.join(__dirname, '..', 'adnan_samara.db');
        this.db = null;
        this.init();
    }

    init() {
        this.db = new sqlite3.Database(this.dbPath, (err) => {
            if (err) {
                console.error('❌ Error opening database:', err.message);
            } else {
                console.log('✅ Connected to SQLite database:', this.dbPath);

                // 🧨 نحذف جدول الإيرادات القديم لو موجود (حتى يُعاد بناؤه بالأعمدة الجديدة)
                this.db.run("DROP TABLE IF EXISTS revenue", (err) => {
                    if (err) console.error("⚠️ Error dropping old revenue table:", err);
                    else console.log("🗑️ Old revenue table dropped successfully.");
                    this.createTables(); // نعيد إنشاء كل الجداول بعد الحذف
                });
            }
        });
    }

    createTables() {
        console.log('📊 Creating database tables...');

        // جدول العملاء
        this.db.run(`CREATE TABLE IF NOT EXISTS clients (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            phone TEXT NOT NULL UNIQUE,
            email TEXT,
            area TEXT NOT NULL,
            address TEXT,
            type TEXT DEFAULT 'regular',
            source TEXT DEFAULT 'reference',
            notes TEXT,
            total_orders INTEGER DEFAULT 0,
            total_purchases REAL DEFAULT 0,
            last_order DATE,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating clients table:', err);
            else console.log('✅ Clients table created');
        });

        // جدول الموظفين
        this.db.run(`CREATE TABLE IF NOT EXISTS employees (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            job_title TEXT,
            department TEXT NOT NULL,
            salary REAL NOT NULL,
            phone TEXT,
            social_number TEXT,
            hire_date DATE,
            status TEXT DEFAULT 'active',
            documents TEXT,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating employees table:', err);
            else console.log('✅ Employees table created');
        });

        // جدول الإيرادات
        this.db.run(`CREATE TABLE IF NOT EXISTS revenue (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            source TEXT DEFAULT 'system',
            type TEXT DEFAULT 'water_sale',
            amount REAL NOT NULL,
            client_id INTEGER,
            client_name TEXT,
            vehicle_id INTEGER,
            vehicle_number TEXT,
            payment_method TEXT DEFAULT 'cash',
            description TEXT,
            notes TEXT,
            status TEXT DEFAULT 'completed',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (client_id) REFERENCES clients (id)
        )`, (err) => {
            if (err) console.error('Error creating revenue table:', err);
            else console.log('✅ Revenue table created (with source + type)');
        });

        // جدول المصاريف
        this.db.run(`CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date DATE NOT NULL,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            recipient TEXT,
            payment_method TEXT DEFAULT 'cash',
            description TEXT,
            notes TEXT,
            status TEXT DEFAULT 'paid',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating expenses table:', err);
            else console.log('✅ Expenses table created');
        });

        // جدول الموردين
        this.db.run(`CREATE TABLE IF NOT EXISTS suppliers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            source_type TEXT NOT NULL,
            area TEXT NOT NULL,
            phone TEXT,
            price_per_meter REAL,
            price_per_tank REAL,
            capacity TEXT,
            notes TEXT,
            status TEXT DEFAULT 'active',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating suppliers table:', err);
            else console.log('✅ Suppliers table created');
        });

        // جدول المركبات
        this.db.run(`CREATE TABLE IF NOT EXISTS vehicles (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            number TEXT NOT NULL UNIQUE,
            driver_name TEXT,
            current_location TEXT,
            capacity TEXT,
            model TEXT,
            status TEXT DEFAULT 'active',
            last_maintenance DATE,
            notes TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`, (err) => {
            if (err) console.error('Error creating vehicles table:', err);
            else console.log('✅ Vehicles table created');
        });

        // بعد الإنشاء، نضيف البيانات التجريبية
        setTimeout(() => {
            this.insertSampleData();
        }, 1000);
    }

    insertSampleData() {
        this.db.get("SELECT COUNT(*) as count FROM clients", (err, row) => {
            if (err) return console.error('Error checking existing data:', err);
            if (row.count === 0) {
                console.log('📝 Inserting sample data...');
                this.insertSampleClients();
                this.insertSampleEmployees();
                this.insertSampleRevenue();
                this.insertSampleExpenses();
                this.insertSampleSuppliers();
                this.insertSampleVehicles();
            } else {
                console.log('ℹ️  Sample data already exists, skipping...');
            }
        });
    }

    insertSampleClients() {
        const clients = [
            ['محمود العواملة', '0798123456', 'mahmoud@email.com', 'الزرقاء', 'حي معصوم', 'regular', 'reference', 'عميل نشط', 15, 4250, '2025-10-15', 'active']
        ];
        const stmt = this.db.prepare(`INSERT INTO clients 
            (name, phone, email, area, address, type, source, notes, total_orders, total_purchases, last_order, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        clients.forEach(c => stmt.run(c));
        stmt.finalize();
        console.log('✅ Sample clients inserted');
    }

    insertSampleEmployees() {
        const employees = [
            ['أحمد الخلايلة', 'سائق', 'drivers', 700, '0791234567', '123456789', '2024-03-01', 'active', '{}', 'موظف متميز']
        ];
        const stmt = this.db.prepare(`INSERT INTO employees 
            (name, job_title, department, salary, phone, social_number, hire_date, status, documents, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        employees.forEach(e => stmt.run(e));
        stmt.finalize();
        console.log('✅ Sample employees inserted');
    }

    insertSampleRevenue() {
        const revenue = [
            ['2025-10-15', 'system', 'water_sale', 350, 1, 'محمود العواملة', 1, 'J-2025', 'cash', 'بيع مياه', '', 'completed']
        ];
        const stmt = this.db.prepare(`INSERT INTO revenue 
            (date, source, type, amount, client_id, client_name, vehicle_id, vehicle_number, payment_method, description, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        revenue.forEach(r => stmt.run(r));
        stmt.finalize();
        console.log('✅ Sample revenue inserted');
    }

    insertSampleExpenses() {
        const expenses = [
            ['2025-10-15', 'fuel', 850, 'fuel', 'محطة وقود الزرقاء', 'cash', 'شراء وقود', '', 'paid']
        ];
        const stmt = this.db.prepare(`INSERT INTO expenses 
            (date, type, amount, category, recipient, payment_method, description, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        expenses.forEach(ex => stmt.run(ex));
        stmt.finalize();
        console.log('✅ Sample expenses inserted');
    }

    insertSampleSuppliers() {
        const suppliers = [
            ['بئر الرشيد', 'well', 'الزرقاء - الرشيد', '0791234567', 0.30, 25, '1000 لتر', 'بئر نشط', 'active']
        ];
        const stmt = this.db.prepare(`INSERT INTO suppliers 
            (name, source_type, area, phone, price_per_meter, price_per_tank, capacity, notes, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);
        suppliers.forEach(s => stmt.run(s));
        stmt.finalize();
        console.log('✅ Sample suppliers inserted');
    }

    insertSampleVehicles() {
        const vehicles = [
            ['J-2025', 'أحمد الزبن', 'الزرقاء - الوسط التجاري', '5000 لتر', 'تويوتا 2023', 'active', '2025-09-01', 'مركبة رئيسية']
        ];
        const stmt = this.db.prepare(`INSERT INTO vehicles 
            (number, driver_name, current_location, capacity, model, status, last_maintenance, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`);
        vehicles.forEach(v => stmt.run(v));
        stmt.finalize();
        console.log('✅ Sample vehicles inserted');
    }

    getConnection() {
        return this.db;
    }

    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) console.error('Error closing database:', err.message);
                else console.log('Database connection closed.');
            });
        }
    }
}

const databaseInstance = new Database();

process.on('SIGINT', () => {
    databaseInstance.close();
    process.exit(0);
});

module.exports = databaseInstance;
