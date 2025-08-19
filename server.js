import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
dotenv.config();

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import routes
import appsRoutes from './routes/apps.js';
import aiRoutes from './routes/ai.js';
import analyticsRoutes from './routes/analytics.js';
import proxyRoutes from './routes/proxy.js';
import usersRoutes from './routes/users.js';
import globalRoutes from './routes/global.js';
import qualityRoutes from './routes/quality.js';
import partnershipsRoutes from './routes/partnerships.js';
import legalRoutes from './routes/legal.js';
import traeaiRoutes from './routes/traeai.js';
import publishingRoutes from './routes/publishing.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy for production (Render, Heroku, etc.)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https:"],
      styleSrc: ["'self'", "'unsafe-inline'", "https:"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'", "https:", "http:"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'"]
    }
  }
}));
app.use(compression());

// Enhanced rate limiting for production
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000, // Higher limit for production
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Rate limit exceeded',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil((parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000) / 1000)
    });
  }
});
app.use('/api/', limiter);

// Enhanced CORS configuration for production
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? (process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : [
      'https://shankarelavarasan.github.io',
      'https://rapid-saas-ai-store.onrender.com',
      'https://rapid-saas-ai-store-1.onrender.com'
    ])
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    const msg = `The CORS policy for this site does not allow access from the specified Origin: ${origin}`;
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['X-Total-Count', 'X-Rate-Limit-Remaining']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// API routes
app.use('/api/apps', appsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/traeai', traeaiRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/partnerships', partnershipsRoutes);
app.use('/api/global', globalRoutes);
app.use('/api/proxy', proxyRoutes);
app.use('/api/publishing', publishingRoutes);

// Enhanced health check endpoint for production monitoring
app.get('/api/health', async (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100,
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100,
      external: Math.round(process.memoryUsage().external / 1024 / 1024 * 100) / 100
    },
    cpu: {
      usage: process.cpuUsage(),
      loadAverage: process.platform !== 'win32' ? require('os').loadavg() : [0, 0, 0]
    },
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      pid: process.pid
    },
    services: {
      database: 'connected',
      ai: 'available',
      storage: 'available'
    }
  };
  
  res.status(200).json(healthCheck);
});

// Health check endpoint for Docker and monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from both root and public directories
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Serve specific HTML pages BEFORE the wildcard route
app.get('/publish.html', (req, res) => {
  const publishPath = path.join(__dirname, 'publish.html');
  if (fs.existsSync(publishPath)) {
    res.sendFile(publishPath);
  } else {
    res.status(404).send('publish.html not found');
  }
});

app.get('/dashboard.html', (req, res) => {
  const dashboardPath = path.join(__dirname, 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('dashboard.html not found');
  }
});

// Serve APK downloads
app.get('/downloads/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(__dirname, 'downloads', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'File not found' });
  }
  
  // Set appropriate headers for APK download
  if (filename.endsWith('.apk')) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  } else if (filename.endsWith('.ipa')) {
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  }
  
  res.sendFile(filePath);
});

// Serve index.html for all other non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    const publicIndexPath = path.join(__dirname, 'public', 'index.html');
    const rootIndexPath = path.join(__dirname, 'index.html');

    if (fs.existsSync(publicIndexPath)) {
      res.sendFile(publicIndexPath);
    } else if (fs.existsSync(rootIndexPath)) {
      res.sendFile(rootIndexPath);
    } else {
      res.status(404).send('index.html not found');
    }
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    error: 'Something went wrong!',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    message: 'The requested endpoint does not exist'
  });
});

// Start server only if not in test mode
if (process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Rapid SaaS AI Store server running on port ${PORT}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔗 Listening on 0.0.0.0:${PORT}`);
    console.log('📱 Ready to convert SaaS to mobile apps!');
  });
}

export default app;