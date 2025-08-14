module.exports = {
  env: {
    browser: true,
    commonjs: true,
    es2021: true,
    node: true,
    jest: true
  },
  extends: [],
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'script'
  },
  rules: {},
  ignorePatterns: [
    'node_modules/',
    'public/',
    '*.min.js',
    'tests/__mocks__/'
  ]
};