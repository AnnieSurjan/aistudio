require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS beallitas ---
// A Google AI Studio frontend vagy barmilyen mas frontend URL-je
const allowedOrigins = [
  process.env.FRONTEND_URL,
  'https://aistudio.google.com',
  'https://ai.studio',
  'http://localhost:3000',
  'http://localhost:5173',
].filter(Boolean);

app.use(
  cors({
    origin: function (origin, callback) {
      // Engedelyezzuk a request-eket origin nelkul (pl. mobil appok, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // Engedelyezzuk a Google AI Studio domain-eket
      if (origin.includes('google') || origin.includes('googleapis')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// --- Middleware ---
app.use(express.json());

// --- Request logging ---
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// --- Routes ---
const companiesRouter = require('./routes/companies');
const quickbooksRouter = require('./routes/quickbooks');
const notificationsRouter = require('./routes/notifications');
const insightsRouter = require('./routes/insights');
const scheduleRouter = require('./routes/schedule');
const auditRouter = require('./routes/audit');
const undoRouter = require('./routes/undo');
const cronRouter = require('./routes/cron');
const authRouter = require('./routes/auth');

app.use('/auth', authRouter);
app.use('/api/companies', companiesRouter);
app.use('/api/quickbooks', quickbooksRouter);
app.use('/api/notifications', notificationsRouter);
app.use('/api/insights', insightsRouter);
app.use('/api/schedule', scheduleRouter);
app.use('/api/audit', auditRouter);
app.use('/api/undo', undoRouter);
app.use('/api/cron', cronRouter);

// --- Health check endpoint (Render.com hasznalja) ---
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// --- Root endpoint ---
app.get('/', (req, res) => {
  res.json({
    name: 'Dup-Detect API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      auth: '/auth/quickbooks',
      authCallback: '/auth/quickbooks/callback',
      companies: '/api/companies',
      quickbooks: '/api/quickbooks/transactions',
      notifications: '/api/notifications',
      insights: '/api/insights',
      schedule: '/api/schedule',
      audit: '/api/audit/*',
      undo: '/api/undo/*',
      cron: '/api/cron/scheduled-scan',
    },
  });
});

// --- Frontend static files ---
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA catch-all: minden nem-API route-ra a frontend index.html-t kuldjuk
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// --- Error handler ---
app.use((err, req, res, next) => {
  console.error('[Server] Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// --- Start server ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Dup-Detect API server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
