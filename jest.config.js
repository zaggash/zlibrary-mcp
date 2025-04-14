module.exports = {
  testEnvironment: 'node',
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.js',
    'index.js'
  ],
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'clover'
  ],
  testMatch: [
    '**/__tests__/**/*.test.js'
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/'
  ],
  // transformIgnorePatterns removed as env-paths is mocked in venv-manager.test.js
  // Skip integration tests by default
  testTimeout: 10000,
  // Automatically clear mock calls and instances between every test
  clearMocks: true,
  // Indicates whether the coverage information should be collected while executing the test
  collectCoverage: true,
  // Automatically mock the MCP server package
  moduleNameMapper: {
    '^@modelcontextprotocol/server$': '<rootDir>/__mocks__/@modelcontextprotocol/server.js'
  },
  // Force exit after tests using global teardown
  globalTeardown: '<rootDir>/jest.teardown.js'
};