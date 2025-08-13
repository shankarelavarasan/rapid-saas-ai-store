// Test setup file
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.SUPABASE_URL = 'https://mock.supabase.co';
process.env.SUPABASE_ANON_KEY = 'mock-anon-key';
process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
process.env.OPENAI_API_KEY = 'mock-openai-key';
process.env.GEMINI_API_KEY = 'mock-gemini-key';
process.env.CLOUDINARY_CLOUD_NAME = 'mock-cloud';
process.env.CLOUDINARY_API_KEY = 'mock-api-key';
process.env.CLOUDINARY_API_SECRET = 'mock-api-secret';

// Suppress console.error during tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn()
};