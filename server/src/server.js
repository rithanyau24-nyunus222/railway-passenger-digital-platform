const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { seedDatabase } = require('./database/db');
const authRoutes = require('./routes/auth.routes');
const trainRoutes = require('./routes/train.routes');
const bookingRoutes = require('./routes/booking.routes');
const notificationRoutes = require('./routes/notification.routes');
const adminRoutes = require('./routes/admin.routes');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize & seed database automatically
seedDatabase();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Request logging in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
    next();
  });
}

// API Health Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'Railway Passenger Digital Platform API',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/trains', trainRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);

// Direct ZIP package download endpoint
app.get('/download-zip', (req, res) => {
  const zipPath = path.resolve(__dirname, '../../railway-passenger-digital-platform.zip');
  if (fs.existsSync(zipPath)) {
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="railway-passenger-digital-platform.zip"');
    res.download(zipPath, 'railway-passenger-digital-platform.zip');
  } else {
    res.status(404).json({ message: 'ZIP package not found. Run npm run zip first.' });
  }
});

// Serve Frontend in Production or if client/dist exists
const clientDistPath = path.resolve(__dirname, '../../client/dist');
if (fs.existsSync(clientDistPath)) {
  console.log(`Serving static client files from: ${clientDistPath}`);
  app.use(express.static(clientDistPath));

  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.resolve(clientDistPath, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({
      message: 'Railway Passenger Digital Platform API is running.',
      frontend: 'Client build not found. Run "npm run dev" for development or "npm run build" to build client.',
      healthCheck: '/api/health'
    });
  });
}

// Central 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ message: 'API endpoint not found.' });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({
    message: 'An unexpected server error occurred. Please try again later.'
  });
});

app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🚆 Railway Passenger Digital Platform Server is running!`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`🧪 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
});

module.exports = app;
