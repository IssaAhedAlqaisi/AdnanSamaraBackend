// backend/database.js
const { Pool } = require('pg');

// 🔗 الاتصال بقاعدة بيانات PostgreSQL على Render
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // ضروري حتى Render يسمح بالاتصال
  },
});

// ✅ اختبار الاتصال
pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err.message));

/* ============================
   🧱 إنشاء الجداول (إن لم تكن موجودة)
   ============================ */
async function createTables() {
  console.log('📊 Ensuring PostgreSQL tables exist...');

  try {
    // 👇 العملاء
    await pool.query(`
      CREATE TABLE IF NOT EXISTS clients (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 👇 الموظفين
    await pool.query(`
      CREATE TABLE IF NOT EXISTS employees (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 👇 الإيرادات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        id SERIAL PRIMARY KEY,
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 👇 المصاريف
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL,
        type TEXT NOT NULL,
        amount REAL NOT NULL,
        category TEXT NOT NULL,
        recipient TEXT,
        payment_method TEXT DEFAULT 'cash',
        description TEXT,
        notes TEXT,
        status TEXT DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 👇 الموردين
    await pool.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        source_type TEXT NOT NULL,
        area TEXT NOT NULL,
        phone TEXT,
        price_per_meter REAL,
        price_per_tank REAL,
        capacity TEXT,
        notes TEXT,
        status TEXT DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 👇 المركبات
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        number TEXT NOT NULL UNIQUE,
        driver_name TEXT,
        current_location TEXT,
        capacity TEXT,
        model TEXT,
        status TEXT DEFAULT 'active',
        last_maintenance DATE,
        notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 👇 سجل عداد المركبات
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

    console.log('✅ All tables are ready!');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
}

// إنشاء الجداول عند تشغيل السيرفر
createTables();

/* ============================
   دالة الإرجاع العامة للاتصال
   ============================ */
function getConnection() {
  return pool;
}

module.exports = getConnection();
