// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const app = express();
const PORT = process.env.PORT || 3000;

/* ============================
   🧠 إعداد CORS (السماح للواجهات الأمامية الموثوقة)
   ============================ */
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://adnansamara.pages.dev",
    "https://samara.pages.dev",
    "https://adnansamarafrontend.pages.dev",
    "https://adnansamarabackend.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
  optionsSuccessStatus: 200
}));

// دعم preflight requests
app.options('*', cors());

/* ============================
   Middleware
   ============================ */
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
   🧭 مسار رئيسي بسيط على Render (بدل frontend المحلي)
   ============================ */
app.get('/', (req, res) => {
  res.json({
    status: '✅ Backend is running',
    message: 'Welcome to Adnan Samara Water Backend API',
    available_endpoints: [
      '/api/clients',
      '/api/employees',
      '/api/revenue',
      '/api/expenses',
      '/api/suppliers',
      '/api/vehicles',
      '/api/dashboard',
      '/api/health'
    ]
  });
});

/* ============================
   Health check endpoint
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
