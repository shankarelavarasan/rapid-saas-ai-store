module.exports = {
  load: jest.fn(() => ({
    text: jest.fn(() => 'Mock HTML content'),
    find: jest.fn(() => ({
      text: jest.fn(() => 'Mock text'),
      attr: jest.fn(() => 'Mock attribute'),
      length: 0
    }))
  }))
};