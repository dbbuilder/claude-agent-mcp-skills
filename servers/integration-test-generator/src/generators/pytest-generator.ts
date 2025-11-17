/**
 * Pytest Test Generator
 * Generates integration tests for FastAPI/Python APIs
 */

import { TestCase, TestSuite, GenerateResult } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class PytestGenerator {
  /**
   * Generate Pytest tests
   */
  generate(testCases: TestCase[], outputPath?: string): GenerateResult {
    try {
      const testSuite = this.buildTestSuite(testCases);
      const content = this.generateTestFile(testSuite);

      const finalPath = outputPath || 'tests/test_api.py';

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
      framework: 'pytest',
      testCases,
      setupCode: '',
      teardownCode: '',
      imports: [
        'import pytest',
        'from fastapi.testclient import TestClient',
        'from app.main import app',
        'from app.database import get_db',
        'from tests.helpers.db import setup_test_db, teardown_test_db',
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
    lines.push('');

    // Client fixture
    lines.push('@pytest.fixture(scope="module")');
    lines.push('def client():');
    lines.push('    """Create test client"""');
    lines.push('    return TestClient(app)');
    lines.push('');
    lines.push('');

    // Auth token fixture
    lines.push('@pytest.fixture(scope="module")');
    lines.push('def auth_token(client):');
    lines.push('    """Get authentication token"""');
    lines.push('    response = client.post(');
    lines.push('        "/api/auth/login",');
    lines.push('        json={"email": "test@example.com", "password": "password"}');
    lines.push('    )');
    lines.push('    return response.json()["token"]');
    lines.push('');
    lines.push('');

    // Setup/teardown
    lines.push('@pytest.fixture(scope="module", autouse=True)');
    lines.push('def setup_teardown():');
    lines.push('    """Setup and teardown test database"""');
    lines.push('    setup_test_db()');
    lines.push('    yield');
    lines.push('    teardown_test_db()');
    lines.push('');
    lines.push('');

    // Group test cases by endpoint
    const grouped = this.groupByEndpoint(testSuite.testCases);

    // Test classes
    for (const [endpoint, cases] of Object.entries(grouped)) {
      const className = this.generateClassName(endpoint);
      lines.push(`class ${className}:`);
      lines.push(`    """Tests for ${endpoint}"""`);
      lines.push('');

      for (const testCase of cases) {
        lines.push(...this.generateTestCase(testCase));
      }

      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Generate individual test case
   */
  private generateTestCase(testCase: TestCase): string[] {
    const lines: string[] = [];

    const functionName = this.generateFunctionName(testCase.name);

    // Function signature with fixtures
    const fixtures = ['client'];
    if (testCase.endpoint.requiresAuth && testCase.scenario !== 'auth-error') {
      fixtures.push('auth_token');
    }

    lines.push(`    def ${functionName}(self, ${fixtures.join(', ')}):`);
    lines.push(`        """${testCase.name}"""`);

    // Build request
    const endpoint = testCase.endpoint;
    let requestPath = endpoint.path;

    // Replace path parameters
    for (const param of endpoint.parameters) {
      if (param.location === 'path') {
        requestPath = requestPath.replace(`{${param.name}}`, param.example || '123');
      }
    }

    // Build headers
    const headers: string[] = [];
    if (endpoint.requiresAuth && testCase.scenario !== 'auth-error') {
      headers.push('            "Authorization": f"Bearer {auth_token}"');
    }

    // Make request
    const method = endpoint.method.toLowerCase();

    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      lines.push(`        response = client.${method}(`);
      lines.push(`            "${requestPath}",`);

      if (headers.length > 0) {
        lines.push(`            headers={`);
        lines.push(...headers);
        lines.push(`            },`);
      }

      if (testCase.scenario === 'validation-error') {
        lines.push(`            json={}  # Empty body to trigger validation`);
      } else if (testCase.scenario === 'success') {
        const body = this.generateExampleBody(endpoint);
        lines.push(`            json=${body}`);
      }

      lines.push(`        )`);
    } else {
      lines.push(`        response = client.${method}(`);
      lines.push(`            "${requestPath}"`);

      if (headers.length > 0) {
        lines.push(`,            headers={`);
        lines.push(...headers);
        lines.push(`            }`);
      }

      lines.push(`        )`);
    }

    lines.push('');

    // Assertions
    lines.push(`        assert response.status_code == ${testCase.expectedStatus}`);

    switch (testCase.scenario) {
      case 'success':
        if (endpoint.method === 'GET') {
          lines.push(`        assert response.json() is not None`);
        } else if (endpoint.method === 'POST') {
          lines.push(`        assert "id" in response.json()`);
        } else if (endpoint.method === 'DELETE') {
          lines.push(`        assert "message" in response.json()`);
        }
        break;

      case 'validation-error':
        lines.push(`        assert "detail" in response.json()`);
        break;

      case 'auth-error':
        lines.push(`        assert "detail" in response.json()`);
        break;

      case 'not-found':
        lines.push(`        assert "detail" in response.json()`);
        break;
    }

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

    if (endpoint.path.includes('user')) {
      return JSON.stringify({
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
      });
    }

    return '{"data": "test"}';
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
   * Generate class name from endpoint
   */
  private generateClassName(endpoint: string): string {
    // Convert "GET /users/:id" to "TestGetUsers"
    const parts = endpoint.split(' ');
    const method = parts[0];
    const path = parts[1] || '';
    const resource = path.split('/').filter(p => p && !p.startsWith(':') && !p.startsWith('{')).join('_');

    return `Test${method.charAt(0).toUpperCase() + method.slice(1).toLowerCase()}${this.toPascalCase(resource)}`;
  }

  /**
   * Generate function name from test case name
   */
  private generateFunctionName(name: string): string {
    // Convert "GET /users/:id - Success" to "test_success"
    const scenario = name.split(' - ')[1] || name;
    return `test_${scenario.toLowerCase().replace(/\s+/g, '_')}`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }
}
