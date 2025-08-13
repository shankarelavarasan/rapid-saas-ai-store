module.exports = {
  testEnvironment: 'node',
  collectCoverageFrom: [
    '**/*.{js,jsx}',
    '!**/node_modules/**',
    '!**/coverage/**',
    '!**/public/**'
  ],
  testMatch: [
    '**/tests/**/*.test.js'
  ],
  transform: {
    '^.+\.js$': 'babel-jest'
  },
  transformIgnorePatterns: [
    'node_modules/(?!(cheerio|undici)/)',
  ],
  moduleNameMapper: {
    '^cheerio$': '<rootDir>/tests/__mocks__/cheerio.js',
    '^puppeteer$': '<rootDir>/tests/__mocks__/puppeteer.js',
    '^sharp$': '<rootDir>/tests/__mocks__/sharp.js'
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js']
};