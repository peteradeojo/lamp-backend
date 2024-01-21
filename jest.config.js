/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  moduleNameMapper: {
    '@entities/(.*)$': "<rootDir>/src/typeorm/entities/$1",
    '@config/(.*)$': '<rootDir>/src/config/$1',
    '@lib/(.*)$': '<rootDir>/src/lib/$1',
    '@routes/(.*)$': '<rootDir>/src/routes/$1',
    '@services/(.*)$': '<rootDir>/src/services/$1',
    '@middleware/(.*)$': '<rootDir>/src/middleware/$1',
  },
  globalSetup: './src/tests/setup.js',
  globalTeardown: "./src/tests/teardown.ts"
};