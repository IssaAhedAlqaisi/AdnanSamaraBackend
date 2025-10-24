const database = require('./database');
const db = database.getConnection();

db.all("SELECT * FROM expenses ORDER BY id DESC", [], (err, rows) => {
  if (err) {
    console.error("❌ Error:", err.message);
  } else {
    console.log("📋 المصاريف الموجودة فعلاً في قاعدة البيانات:");
    console.table(rows);
  }
  db.close();
});
