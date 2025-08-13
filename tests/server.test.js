const request = require('supertest');

// Set test environment
process.env.NODE_ENV = 'test';
// Set mock environment variables for testing
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
process.env.OPENAI_API_KEY = 'mock-openai-key';
process.env.GEMINI_API_KEY = 'mock-gemini-key';
process.env.CLOUDINARY_CLOUD_NAME = 'mock-cloud';
process.env.CLOUDINARY_API_KEY = 'mock-api-key';
process.env.CLOUDINARY_API_SECRET = 'mock-api-secret';
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