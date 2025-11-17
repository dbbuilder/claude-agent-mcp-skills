/**
 * Jest + Supertest Test Generator
 * Generates integration tests for Express/Node.js APIs
 */

import { TestCase, TestSuite, GenerateResult } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class JestGenerator {
  /**
   * Generate Jest + Supertest tests
   */
  generate(testCases: TestCase[], outputPath?: string): GenerateResult {
    try {
      const testSuite = this.buildTestSuite(testCases);
      const content = this.generateTestFile(testSuite);

      const finalPath = outputPath || 'tests/api.test.ts';

      if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, content, 'utf-8');
      }

      return {
        success: true,
        outputPath: finalPath,
        content,
        testsGenerated: testCases.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build test suite structure
   */
  private buildTestSuite(testCases: TestCase[]): TestSuite {
    return {
      name: 'API Integration Tests',
      framework: 'jest',
      testCases,
      setupCode: this.generateSetup(),
      teardownCode: this.generateTeardown(),
      imports: [
        "import request from 'supertest';",
        "import app from '../src/app';",
        "import { setupTestDB, teardownTestDB } from './helpers/db';",
      ],
    };
  }

  /**
   * Generate complete test file
   */
  private generateTestFile(testSuite: TestSuite): string {
    const lines: string[] = [];

    // Imports
    lines.push(...testSuite.imports);
    lines.push('');

    // Group test cases by endpoint
    const grouped = this.groupByEndpoint(testSuite.testCases);

    // Main describe block
    lines.push(`describe('${testSuite.name}', () => {`);
    lines.push('  let authToken: string;');
    lines.push('');

    // Setup
    lines.push('  beforeAll(async () => {');
    lines.push('    await setupTestDB();');
    lines.push('    // Login and get auth token');
    lines.push("    const res = await request(app)");
    lines.push("      .post('/api/auth/login')");
    lines.push('      .send({ email: \'test@example.com\', password: \'password\' });');
    lines.push('    authToken = res.body.token;');
    lines.push('  });');
    lines.push('');

    // Teardown
    lines.push('  afterAll(async () => {');
    lines.push('    await teardownTestDB();');
    lines.push('  });');
    lines.push('');

    // Test cases grouped by endpoint
    for (const [endpoint, cases] of Object.entries(grouped)) {
      lines.push(`  describe('${endpoint}', () => {`);

      for (const testCase of cases) {
        lines.push(...this.generateTestCase(testCase));
      }

      lines.push('  });');
      lines.push('');
    }

    lines.push('});');

    return lines.join('\n');
  }

  /**
   * Generate individual test case
   */
  private generateTestCase(testCase: TestCase): string[] {
    const lines: string[] = [];

    lines.push(`    it('${testCase.name}', async () => {`);

    // Build request
    const endpoint = testCase.endpoint;
    let requestPath = endpoint.path;

    // Replace path parameters with example values
    for (const param of endpoint.parameters) {
      if (param.location === 'path') {
        requestPath = requestPath.replace(`:${param.name}`, param.example || '123');
        requestPath = requestPath.replace(`{${param.name}}`, param.example || '123');
      }
    }

    // Start request
    lines.push(`      const res = await request(app)`);
    lines.push(`        .${endpoint.method.toLowerCase()}('${requestPath}')`);

    // Add auth header if required (except for auth-error scenario)
    if (endpoint.requiresAuth && testCase.scenario !== 'auth-error') {
      lines.push(`        .set('Authorization', \`Bearer \${authToken}\`)`);
    }

    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      if (testCase.scenario === 'validation-error') {
        lines.push(`        .send({})  // Empty body to trigger validation error`);
      } else if (testCase.scenario === 'success') {
        lines.push(`        .send(${this.generateExampleBody(endpoint)})`);
      }
    }

    // Add query parameters if any
    const queryParams = endpoint.parameters.filter(p => p.location === 'query');
    if (queryParams.length > 0 && testCase.scenario === 'success') {
      for (const param of queryParams) {
        lines.push(`        .query({ ${param.name}: '${param.example || 'value'}' })`);
      }
    }

    lines.push(`        .expect(${testCase.expectedStatus});`);
    lines.push('');

    // Assertions based on scenario
    switch (testCase.scenario) {
      case 'success':
        if (endpoint.method === 'GET') {
          lines.push(`      expect(res.body).toBeDefined();`);
        } else if (endpoint.method === 'POST') {
          lines.push(`      expect(res.body.id).toBeDefined();`);
        } else if (endpoint.method === 'DELETE') {
          lines.push(`      expect(res.body.message).toBeDefined();`);
        }
        break;

      case 'validation-error':
        lines.push(`      expect(res.body.error).toBeDefined();`);
        lines.push(`      expect(res.body.message).toContain('validation');`);
        break;

      case 'auth-error':
        lines.push(`      expect(res.body.error).toBe('Unauthorized');`);
        break;

      case 'not-found':
        lines.push(`      expect(res.body.error).toBe('Not Found');`);
        break;
    }

    lines.push(`    });`);
    lines.push('');

    return lines;
  }

  /**
   * Generate example request body
   */
  private generateExampleBody(endpoint: any): string {
    if (endpoint.requestBody) {
      return JSON.stringify(endpoint.requestBody.example || {});
    }

    // Generate based on endpoint
    if (endpoint.path.includes('user')) {
      return JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      }, null, 10);
    }

    return JSON.stringify({ data: 'test' }, null, 10);
  }

  /**
   * Group test cases by endpoint
   */
  private groupByEndpoint(testCases: TestCase[]): Record<string, TestCase[]> {
    const grouped: Record<string, TestCase[]> = {};

    for (const testCase of testCases) {
      const key = `${testCase.endpoint.method} ${testCase.endpoint.path}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(testCase);
    }

    return grouped;
  }

  /**
   * Generate setup code
   */
  private generateSetup(): string {
    return `
beforeAll(async () => {
  await setupTestDB();
});
`.trim();
  }

  /**
   * Generate teardown code
   */
  private generateTeardown(): string {
    return `
afterAll(async () => {
  await teardownTestDB();
});
`.trim();
  }
}
