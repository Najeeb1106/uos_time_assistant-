require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const scheduleRoutes = require('./routes/schedule');

const app = express();
const PORT = process.env.PORT || 3000;

// Enable CORS for frontend + mobile clients
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    // Allow localhost origins (web dev server) and private network IPs (mobile on LAN)
    if (
      origin.includes('localhost') ||
      origin.includes('127.0.0.1') ||
      /^https?:\/\/(10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.)/.test(origin)
    ) {
      return callback(null, true);
    }
    callback(null, true); // permissive in dev — tighten for production
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Custom request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[HTTP] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Standard JSON request body parser
app.use(express.json());

// Basic status check route
app.get('/api/status', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'UOS Timetable Server is healthy and running.',
    mode: require('./config/firebase').isFirebaseMode ? 'Firebase Production' : 'Local Fallback',
    timestamp: new Date().toISOString()
  });
});

// Register routers
app.use('/api/auth', authRoutes);
app.use('/api/schedule', scheduleRoutes);

// 404 Route handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found.'
  });
});

// Global Error boundary handler
app.use((err, req, res, next) => {
  console.error('Unhandled Global Server Error:', err);
  
  // Custom message for multer errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'File upload size exceeds the maximum 10MB limit.'
    });
  }

  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    message: err.message || 'An internal server error occurred.'
  });
});

// Boot listening socket — bind to 0.0.0.0 so mobile devices on LAN can reach us
app.listen(PORT, '0.0.0.0', () => {
  console.log(`==================================================`);
  console.log(` UOS Timetable backend listening on port ${PORT} `);
  console.log(` Bound to: 0.0.0.0 (all interfaces)              `);
  console.log(` Base API Url: http://localhost:${PORT}/api      `);
  console.log(` Status check: http://localhost:${PORT}/api/status`);
  console.log(`==================================================`);
});

module.exports = app;
