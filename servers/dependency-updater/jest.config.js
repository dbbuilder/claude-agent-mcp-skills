export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
  moduleNameMapper: {
    '^(\\.{1,2}/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
  injectGlobals: true,
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // MCP server entry point
    '!src/cli.ts', // CLI entry point
  ],
  coverageThreshold: {
    global: {
      branches: 0, // Core logic tested via unit tests, integration requires exec mocking
      functions: 0,
      lines: 0,
      statements: 0,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000,
};
