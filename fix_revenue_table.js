const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, '../adnan_samara.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  console.log("🧩 Rebuilding revenue table to match latest structure...");

  db.run("DROP TABLE IF EXISTS revenue_new;");
  
  // إنشاء جدول جديد مؤقت
  db.run(`
    CREATE TABLE revenue_new (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      source TEXT,
      amount REAL NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `, (err) => {
    if (err) return console.error("❌ Error creating new table:", err.message);

    console.log("📥 Migrating data from old table (if exists)...");
    db.run(`
      INSERT INTO revenue_new (id, date, amount, notes)
      SELECT id, date, amount, notes FROM revenue;
    `, (err2) => {
      if (err2) console.warn("⚠️ Old revenue table not found or empty:", err2.message);

      console.log("♻️ Dropping old table if exists...");
      db.run("DROP TABLE IF EXISTS revenue;", (err3) => {
        if (err3) return console.error("❌ Error dropping old table:", err3.message);

        console.log("🔁 Renaming new table...");
        db.run("ALTER TABLE revenue_new RENAME TO revenue;", (err4) => {
          if (err4) console.error("❌ Rename failed:", err4.message);
          else console.log("✅ Table structure fixed successfully!");
          db.close();
        });
      });
    });
  });
});
