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
    /* ---------- clients ---------- */
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

    /* ---------- employees ---------- */
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

    /* ---------- suppliers ---------- */
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

    /* ---------- vehicles ---------- */
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

    /* ---------- vehicle_logs ---------- */
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

    /* ---------- expense_types ---------- */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expense_types (
        id SERIAL PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* ---------- expenses (base table) ---------- */
    await pool.query(`
      CREATE TABLE IF NOT EXISTS expenses (
        id SERIAL PRIMARY KEY,
        date DATE NOT NULL DEFAULT CURRENT_DATE,
        type_id INTEGER,                -- موجود للتوافق السابق
        amount REAL NOT NULL,
        beneficiary TEXT,
        pay_method TEXT,                -- العمود القديم
        description TEXT,
        notes TEXT,
        status TEXT DEFAULT 'paid',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    /* ---------- ensure/alter columns (no-op if exist) ---------- */
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS date DATE DEFAULT CURRENT_DATE;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS type_id INTEGER;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS amount REAL;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS beneficiary TEXT;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS pay_method TEXT;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS description TEXT;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS notes TEXT;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'paid';`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    /* ---------- NEW columns required by new frontend/backend ---------- */
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS type TEXT;`);
    await pool.query(`ALTER TABLE expenses ADD COLUMN IF NOT EXISTS payment_method TEXT;`);

    /* ---------- FK to expense_types if absent ---------- */
    await pool.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint WHERE conname = 'expenses_type_id_fkey'
        ) THEN
          ALTER TABLE expenses
            ADD CONSTRAINT expenses_type_id_fkey
            FOREIGN KEY (type_id) REFERENCES expense_types(id)
            ON DELETE SET NULL;
        END IF;
      END$$;
    `);

    /* ---------- Gentle backfill (once) ---------- */
    // انسخ القيمة القديمة إلى العمود الجديد إن كانت الجديدة فاضية
    await pool.query(`
      UPDATE expenses
      SET payment_method = pay_method
      WHERE payment_method IS NULL AND pay_method IS NOT NULL;
    `);

    // لو عندك type_id وتقدر تربطه باسم النوع
    await pool.query(`
      UPDATE expenses e
      SET type = et.name
      FROM expense_types et
      WHERE e.type IS NULL AND e.type_id = et.id;
    `);

    console.log('✅ All tables are ready!');
  } catch (err) {
    console.error('❌ Error creating/altering tables:', err.message);
  }
}

createTables();

function getConnection() {
  return pool;
}
module.exports = getConnection();
