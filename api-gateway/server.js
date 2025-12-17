const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

let publicKey = null;

// Fetch public key from User Service on startup
async function fetchPublicKey() {
  try {
    const restApiUrl = process.env.REST_API_URL || 'http://user-service:3001';
    const response = await axios.get(`${restApiUrl}/api/public-key`);
    publicKey = response.data.publicKey;
    console.log('✅ Public key fetched from User Service');
  } catch (error) {
    console.warn('⚠️  Failed to fetch public key:', error.message);
    console.warn('⚠️  JWT verification will not work until User Service is available');
  }
}

// Fallback secret for development (must match User Service)
const DEV_SECRET = 'dev-secret-key-123';

// JWT verification middleware
const verifyToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const token = authHeader.substring(7);

  // If we don't have the public key yet, try to fetch it now
  if (!publicKey) {
    console.log('🔄 Public key not loaded, attempting lazy fetch...');
    await fetchPublicKey();
  }

  try {
    let decoded;

    // Try RS256 with public key first
    if (publicKey) {
      try {
        decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
        console.log('✅ Token verified with RS256');
      } catch (rsaError) {
        // If RS256 fails, try HS256 with DEV_SECRET
        console.warn('RS256 verification failed:', rsaError.message);
        console.warn('Trying HS256 fallback...');
        decoded = jwt.verify(token, DEV_SECRET, { algorithms: ['HS256'] });
      }
    } else {
      // No public key available, use DEV_SECRET
      console.warn('No public key available, using DEV_SECRET for HS256');
      decoded = jwt.verify(token, DEV_SECRET, { algorithms: ['HS256'] });
    }

    req.user = decoded;

    // Forward user info to backend services
    const userStr = JSON.stringify(decoded);
    req.headers['user'] = userStr;
    console.log('✅ Token verified, user:', decoded.email);
    next();
  } catch (error) {
    console.error('❌ Token verification failed:', error.message);
    return res.status(401).json({
      error: 'Invalid or expired token',
      message: error.message
    });
  }
};

const optionalVerifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  const token = authHeader.substring(7);
  try {
    let decoded;
    if (publicKey) {
      try {
        decoded = jwt.verify(token, publicKey, { algorithms: ['RS256'] });
      } catch (rsaError) {
        decoded = jwt.verify(token, DEV_SECRET, { algorithms: ['HS256'] });
      }
    } else {
      decoded = jwt.verify(token, DEV_SECRET, { algorithms: ['HS256'] });
    }
    req.user = decoded;
    req.headers['user'] = JSON.stringify(decoded);
  } catch (error) {
    console.warn('Optional token verification failed:', error.message);
  }
  next();
};

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
  origin: [
    'http://localhost:3002', // Frontend
    'http://localhost:3000', // Gateway itself
    'http://frontend-app:3002' // Docker container name
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use(limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    publicKeyLoaded: !!publicKey,
    services: {
      'user-service': process.env.REST_API_URL || 'http://user-service:3001',
      'payment-service': process.env.PAYMENT_API_URL || 'http://payment-service:4000',
      'store-service': process.env.STORE_API_URL || 'http://store-service:4001',
      'booking-service': process.env.BOOKING_API_URL || 'http://booking-service:4002'
    }
  });
});

// Proxy configuration for REST API
const restApiProxy = createProxyMiddleware({
  target: process.env.REST_API_URL || 'http://user-service:3001',
  changeOrigin: true,
  pathRewrite: {
    '^/api': '/api',
  },
  onError: (err, req, res) => {
    console.error('User Service Proxy Error:', err.message);
    res.status(500).json({
      error: 'User Service unavailable',
      message: err.message
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    // Forward user info if available
    if (req.headers['user']) {
      proxyReq.setHeader('user', req.headers['user']);
    }
    console.log(`[User Service] ${req.method} ${req.url}`);
  }
});

// Proxy configuration for Payment Service
const paymentServiceProxy = createProxyMiddleware({
  target: process.env.PAYMENT_API_URL || 'http://payment-service:4000',
  changeOrigin: true,
  pathRewrite: {
    '^/graphql-payment': '/graphql',
  },
  ws: true,
  onError: (err, req, res) => {
    console.error('Payment Service Proxy Error:', err.message);
    res.status(500).json({
      error: 'Payment Service unavailable',
      message: err.message
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers['user']) {
      proxyReq.setHeader('user', req.headers['user']);
    }
    console.log(`[Payment Service] ${req.method} ${req.url}`);
  }
});

// Proxy configuration for Store Service
const storeServiceProxy = createProxyMiddleware({
  target: process.env.STORE_API_URL || 'http://store-service:4001',
  changeOrigin: true,
  pathRewrite: {
    '^/graphql-store': '/graphql', // Rewrite path
  },
  onError: (err, req, res) => {
    console.error('Store Service Proxy Error:', err.message);
    res.status(500).json({
      error: 'Store Service unavailable',
      message: err.message
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers['user']) {
      proxyReq.setHeader('user', req.headers['user']);
    }
    console.log(`[Store Service] ${req.method} ${req.url}`);
  }
});

// Proxy configuration for Booking Service (NEW)
const bookingServiceProxy = createProxyMiddleware({
  target: process.env.BOOKING_API_URL || 'http://booking-service:4002',
  changeOrigin: true,
  pathRewrite: {
    '^/graphql-booking': '/graphql',
  },
  onError: (err, req, res) => {
    console.error('Booking Service Proxy Error:', err.message);
    res.status(500).json({
      error: 'Booking Service unavailable',
      message: err.message
    });
  },
  onProxyReq: (proxyReq, req, res) => {
    if (req.headers['user']) {
      proxyReq.setHeader('user', req.headers['user']);
    }
    console.log(`[Booking Service] ${req.method} ${req.url}`);
  }
});

// Public routes (no authentication required)
app.use('/api/auth', restApiProxy);
app.use('/api/public-key', restApiProxy);

// Protected routes (authentication required)
app.use('/api', verifyToken, restApiProxy);
app.use('/graphql-payment', verifyToken, paymentServiceProxy);
app.use('/graphql-store', optionalVerifyToken, storeServiceProxy);
app.use('/graphql-booking', verifyToken, bookingServiceProxy);

// Catch-all route
app.get('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    availableRoutes: [
      '/health',
      '/api/* (proxied to REST API)',
      '/graphql (proxied to GraphQL API)'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Gateway Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

async function startServer() {
  // Fetch public key on startup
  await fetchPublicKey();

  const server = app.listen(PORT, () => {
    console.log(`🚀 API Gateway running on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
    console.log(`🔄 Proxying /api/* to: ${process.env.REST_API_URL || 'http://user-service:3001'}`);
    console.log(`🔄 Proxying /graphql to: ${process.env.GRAPHQL_API_URL || 'http://laundry-service:4000'}`);
    console.log(`🔄 Proxying /graphql-store to: ${process.env.STORE_API_URL || 'http://store-service:4001'}`);
    console.log(`🔄 Proxying /graphql-booking to: ${process.env.BOOKING_API_URL || 'http://booking-service:4002'}`);
    console.log(`🔐 JWT verification: ${publicKey ? 'ENABLED' : 'DISABLED'}`);
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down gracefully');
    server.close(() => {
      console.log('Process terminated');
    });
  });
}

startServer();

module.exports = app;