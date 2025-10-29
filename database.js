// backend/database.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

pool.connect()
  .then(() => console.log('✅ Connected to PostgreSQL database'))
  .catch(err => console.error('❌ PostgreSQL connection error:', err.message));

async function createTables() {
  console.log('📊 Ensuring PostgreSQL tables exist...');
  try {
    // ======= clients =======
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

    // ======= employees =======
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

    // ======= suppliers =======
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

    // ======= vehicles =======
    await pool.query(`
      CREATE TABLE IF NOT EXISTS vehicles (
        id SERIAL PRIMARY KEY,
        number TEXT NOT NULL,
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

    // ======= vehicle_logs (اليومي) =======
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

    // ======= revenue =======
    await pool.query(`
      CREATE TABLE IF NOT EXISTS revenue (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
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

    // ======= expense_types (جديدة) =======
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_types (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // ======= expenses =======
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        type TEXT NOT NULL,                     -- اسم النوع (يرتبط بـ expense_types.name)
        amount REAL NOT NULL,
        beneficiary TEXT,                       -- الجهة المستفيدة
        payment_method TEXT NOT NULL DEFAULT 'كاش' CHECK (payment_method IN ('كاش','فيزا','ذمم')),
        description TEXT,
        notes TEXT,
        status TEXT DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ All tables are ready!');
  } catch (err) {
    console.error('❌ Error creating tables:', err.message);
  }
}
createTables();

function getConnection() {
  return pool;
}
module.exports = getConnection();
