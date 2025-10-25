// backend/server.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./database'); // ⬅️ استدعاء قاعدة البيانات

/* ============================
   قاعدة البيانات
   ============================ */
const dbPath = path.join(__dirname, 'adnan_samara.db');
console.log('✅ Using database at:', dbPath);

/* ============================
   إنشاء التطبيق
   ============================ */
const app = express();
const PORT = process.env.PORT || 3000;

/* ============================
   Middleware
   ============================ */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://adnansamara.pages.dev"
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"]
}));

app.use(bodyParser.json());

/* ============================
   Routes
   ============================ */
app.use('/api/clients', require('./routes/clients'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/revenue', require('./routes/revenue'));
app.use('/api/expenses', require('./routes/expenses'));
app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/dashboard', require('./routes/dashboard'));

/* ============================
   Frontend serving
   ============================ */
// ✅ لاحظ: هذا الجزء مش ضروري لـ Cloudflare Pages، لكن نخليه احتياطي
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../frontend/index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.send('<h1>Adnan Samara Backend is running ✅</h1>');
  }
});

app.get('/:page', (req, res) => {
  const page = req.params.page;
  const validPages = [
    'clients', 'employees', 'revenue', 'expenses',
    'suppliers', 'vehicles', 'settings'
  ];

  const filePath = path.join(__dirname, `../frontend/${page}.html`);
  if (validPages.includes(page) && fs.existsSync(filePath)) {
    res.sendFile(filePath);
  } else {
    res.status(404).json({ error: 'Page not found' });
  }
});

/* ============================
   Health check
   ============================ */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Adnan Samara Backend is running!',
    timestamp: new Date().toISOString()
  });
});

/* ============================
   Error handling
   ============================ */
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message
  });
});

// 404
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ============================
   Start server
   ============================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
  console.log(`🌐 Frontend available at http://localhost:${PORT}`);
});
