// backend/server.js
require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');

// ✅ فعّل إنشاء الجداول والاتصال بقاعدة البيانات بمجرد تشغيل السيرفر
require('./database');

const app = express();

// Render عادةً بيستخدم 10000
const PORT = process.env.PORT || 10000;

/* ============================
   🧠 إعداد CORS (واجهاتك فقط)
   ============================ */
const ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'http://localhost:5173',
  'https://adnansamara.pages.dev',
  'https://samara.pages.dev',
  'https://adnansamarafrontend.pages.dev',
  'https://adnansamarabackend.onrender.com',
  'https://adnansamarabackend-1.onrender.com'
];

app.use(
  cors({
    origin(origin, cb) {
      // اسمح للطلبات الخالية من Origin (curl / مراقبات صحية)
      if (!origin) return cb(null, true);
      if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      // اسمح بأي صفحات *.pages.dev تابعة لمشروعك (اختياري)
      if (/\.pages\.dev$/.test(origin)) return cb(null, true);
      // اسمح لأي onrender.com لنفس الباك (اختياري)
      if (/\.onrender\.com$/.test(origin)) return cb(null, true);
      return cb(null, false);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
    optionsSuccessStatus: 200
  })
);

// دعم preflight
app.options('*', cors());

/* ============================
   Middleware
   ============================ */
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true }));

/* ============================
   Routes
   ============================ */
// ملاحظة: تأكد أن هذه المسارات موجودة داخل مجلد routes
app.use('/api/clients', require('./routes/clients'));
app.use('/api/employees', require('./routes/employees'));
app.use('/api/revenue', require('./routes/revenue'));

// ⚠️ مهم: هذا هو راوتر المصاريف الذي يضم (expenses + expenses/types)
app.use('/api/expenses', require('./routes/expenses'));

app.use('/api/suppliers', require('./routes/suppliers'));
app.use('/api/vehicles', require('./routes/vehicles'));
app.use('/api/dashboard', require('./routes/dashboard'));

/* ============================
   Root & Health
   ============================ */
app.get('/', (_req, res) => {
  res.json({
    status: '✅ Backend is running',
    message: 'Welcome to Adnan Samara Water Backend API',
    available_endpoints: [
      '/api/clients',
      '/api/employees',
      '/api/revenue',
      '/api/expenses',
      '/api/expenses/types',
      '/api/suppliers',
      '/api/vehicles',
      '/api/dashboard',
      '/api/health'
    ]
  });
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'OK',
    message: 'Adnan Samara Backend is running!',
    timestamp: new Date().toISOString()
  });
});

/* ============================
   Error handling
   ============================ */
app.use((err, _req, res, _next) => {
  console.error('Error:', err.stack || err);
  res.status(500).json({
    error: 'Something went wrong!',
    message: err.message || 'Internal Server Error'
  });
});

app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/* ============================
   Start server
   ============================ */
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API available at http://localhost:${PORT}/api`);
});
