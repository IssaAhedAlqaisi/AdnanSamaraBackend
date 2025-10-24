const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../adnan_samara.db');
const db = new sqlite3.Database(dbPath);

console.log('🛠️ Checking revenue table columns...');

db.all("PRAGMA table_info(revenue);", [], (err, rows) => {
  if (err) throw err;

  const hasSource = rows.some(r => r.name === 'source');

  if (hasSource) {
    console.log('✅ Column "source" already exists.');
    db.close();
  } else {
    console.log('⚙️ Adding column "source"...');
    db.run("ALTER TABLE revenue ADD COLUMN source TEXT;", (err2) => {
      if (err2) {
        console.error('❌ Error adding column:', err2.message);
      } else {
        console.log('✅ Column "source" added successfully!');
      }
      db.close(); // ✅ يغلق بعد ما يخلص الأمر فعلاً
    });
  }
});
