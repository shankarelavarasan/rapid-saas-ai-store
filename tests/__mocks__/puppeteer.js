module.exports = {
  launch: jest.fn(() => Promise.resolve({
    newPage: jest.fn(() => Promise.resolve({
      goto: jest.fn(() => Promise.resolve()),
      screenshot: jest.fn(() => Promise.resolve(Buffer.from('mock-screenshot'))),
      close: jest.fn(() => Promise.resolve())
    })),
    close: jest.fn(() => Promise.resolve())
  }))
};