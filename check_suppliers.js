// check_suppliers.js
const database = require('./database');
const db = database.getConnection();

db.all("PRAGMA table_info(suppliers)", [], (err, rows) => {
  if (err) {
    console.error("❌ Error:", err.message);
  } else {
    console.log("📋 Table structure for 'suppliers':");
    console.table(rows);
  }
  db.close();
});
