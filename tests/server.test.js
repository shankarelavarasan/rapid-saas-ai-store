const request = require('supertest');

// Set test environment
process.env.NODE_ENV = 'test';
const app = require('../server');

describe('Server Health Check', () => {
  test('GET /health should return 200', async () => {
    const response = await request(app)
      .get('/health');
    
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'OK');
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