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
import appRoutes from './routes/apps.js';
import userRoutes from './routes/users.js';
import analyticsRoutes from './routes/analytics.js';
import aiRoutes from './routes/ai.js';
import traeAIRoutes from './routes/traeai.js';
import legalRoutes from './routes/legal.js';
import qualityRoutes from './routes/quality.js';
import partnershipRoutes from './routes/partnerships.js';
import globalRoutes from './routes/global.js';
import proxyRoutes from './routes/proxy.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? [
        'https://shankarelavarasan.github.io',
        'https://rapid-saas-ai-store.onrender.com',
        'https://rapid-saas-ai-store-1.onrender.com'
      ] 
    : ['http://localhost:3000'],
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
app.use(morgan('combined'));

// API Routes
app.use('/api/apps', appRoutes);
app.use('/api/users', userRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/traeai', traeAIRoutes);
app.use('/api/legal', legalRoutes);
app.use('/api/quality', qualityRoutes);
app.use('/api/partnerships', partnershipRoutes);
app.use('/api/global', globalRoutes);
app.use('/api/proxy', proxyRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Rapid SaaS AI Store API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Health check endpoint for Docker and monitoring
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve static files from both root and public directories
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Serve publish.html specifically
app.get('/publish.html', (req, res) => {
  const publishPath = path.join(__dirname, 'publish.html');
  if (fs.existsSync(publishPath)) {
    res.sendFile(publishPath);
  } else {
    res.status(404).send('publish.html not found');
  }
});

// Serve dashboard.html specifically
app.get('/dashboard.html', (req, res) => {
  const dashboardPath = path.join(__dirname, 'dashboard.html');
  if (fs.existsSync(dashboardPath)) {
    res.sendFile(dashboardPath);
  } else {
    res.status(404).send('dashboard.html not found');
  }
});

// Serve index.html for all non-API routes
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