// ===============================
// 📦 backend/server.js
// ===============================

const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./database');

const app = express();
const PORT = process.env.PORT || 10000;

// ============================
// 🗃️ تحديد قاعدة البيانات
// ============================
const dbPath = path.join(__dirname, 'adnan_samara.db');
console.log(`✅ Using database at: ${dbPath}`);

// ============================
// 🌍 إعداد CORS (المواقع المسموح تتصل بالسيرفر)
// ============================
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://adnansamarabackend.onrender.com",
    "https://adnansamara.pages.dev"  // ✅ موقعك الرسمي
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

// ============================
// ⚙️ Middleware
// ============================
app.use(bodyParser.json());

// ============================
// 📁 Routes
// ============================
app.use('/api/clients', require('./routes/clients'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/dashboard', require('./routes/dashboard'));

// ============================
// 🩺 Health check
// ============================
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Adnan Samara Backend is running!',
    timestamp: new Date().toISOString()
  });
});

// ============================
// ⚠️ Error handling
// ============================
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// ============================
// 🚀 Start Server
// ============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
