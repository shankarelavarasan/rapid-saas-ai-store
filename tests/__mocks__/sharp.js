module.exports = jest.fn(() => ({
  resize: jest.fn().mockReturnThis(),
  png: jest.fn().mockReturnThis(),
  jpeg: jest.fn().mockReturnThis(),
  toBuffer: jest.fn(() => Promise.resolve(Buffer.from('mock-image'))),
  toFile: jest.fn(() => Promise.resolve())
}));