const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const { sequelize, testConnection } = require('./config/database');
const User = require('./models/User');
const userRoutes = require('./routes/users');
const authRoutes = require('./routes/auth');
const { errorHandler } = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3001;

// Load JWT public key for sharing
let publicKey;
try {
  publicKey = fs.readFileSync('/app/keys/jwt-public.key', 'utf8');
  console.log('✅ JWT public key loaded');
} catch (error) {
  try {
    publicKey = fs.readFileSync('./keys/jwt-public.key', 'utf8');
    console.log('✅ JWT public key loaded (local)');
  } catch (err) {
    try {
      publicKey = fs.readFileSync('../../keys/jwt-public.key', 'utf8');
      console.log('✅ JWT public key loaded (shared)');
    } catch (e) {
      console.warn('⚠️  JWT public key not found');
    }
  }
}

// Security middleware
app.use(helmet());
app.use(cors());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    service: 'User Service (REST API with PostgreSQL)',
    database: 'PostgreSQL',
    timestamp: new Date().toISOString()
  });
});

// Public key endpoint for API Gateway
app.get('/api/public-key', (req, res) => {
  if (!publicKey) {
    return res.status(500).json({ error: 'Public key not available' });
  }
  res.json({ publicKey });
});

const authMiddleware = require('./middleware/authMiddleware');

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', authMiddleware, userRoutes);

// Error handling middleware
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Test database connection
    await testConnection();

    // Sync database models
    await sequelize.sync({ alter: true });
    console.log('✅ Database models synchronized');

    // Seed default users
    await User.seedDefaultUsers();

    // Start server
    app.listen(PORT, () => {
      console.log(`🚀 User Service (REST API) running on port ${PORT}`);
      console.log(`📋 Health check: http://localhost:${PORT}/health`);
      console.log(`🔑 Public key: http://localhost:${PORT}/api/public-key`);
      console.log(`💾 Database: PostgreSQL`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;