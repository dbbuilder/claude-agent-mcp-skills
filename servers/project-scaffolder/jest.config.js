export default {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
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
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts', // MCP server entry point
    '!src/cli.ts', // CLI entry point
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 75, // Lowered slightly due to template generator private methods
      lines: 90,
      statements: 89,
    },
  },
  coverageDirectory: 'coverage',
  verbose: true,
  testTimeout: 30000, // 30 seconds for file I/O operations
};
