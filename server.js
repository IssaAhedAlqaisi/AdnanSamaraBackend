// backend/server.js
const fs = require('fs');
const path = require('path');

/* ============================
   🧨 حذف قاعدة البيانات القديمة (مرة واحدة فقط لإعادة البناء)
   ============================ */
const dbPath = path.join(__dirname, '..', 'adnan_samara.db');
if (fs.existsSync(dbPath)) {
  fs.unlinkSync(dbPath);
  console.log('🗑️ Deleted old adnan_samara.db to recreate fresh one');
}

/* ============================
   باقي الاستدعاءات
   ============================ */
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const database = require('./database'); // ⬅️ استدعاء بعد الحذف

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
app.use(express.static(path.join(__dirname, '../frontend')));

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
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.get('/:page', (req, res) => {
  const page = req.params.page;
  const validPages = [
    'clients', 'employees', 'revenue', 'expenses',
    'suppliers', 'vehicles', 'settings'
  ];

  if (validPages.includes(page)) {
    res.sendFile(path.join(__dirname, `../frontend/${page}.html`));
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
