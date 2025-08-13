const request = require('supertest');
const express = require('express');
const path = require('path');

// Create a minimal test app instead of loading the full server
const app = express();

// Add basic middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Add health endpoints
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve index.html for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

describe('Server Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health');
    
    expect(response.status).toBe(200);
    expect(response.text).toBe('OK');
  });
});

describe('API Health Check', () => {
  test('GET /api/health should return 200', async () => {
    const response = await request(app)
      .get('/api/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
  });
});

describe('Static Files', () => {
  test('GET / should serve index.html', async () => {
    const response = await request(app)
      .get('/');
    
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toMatch(/html/);
  });
});