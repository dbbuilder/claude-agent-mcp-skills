/**
 * Tests for Jest test generator
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { JestGenerator } from '../src/generators/jest-generator.js';
import { TestCase, ApiEndpoint } from '../src/types.js';

describe('JestGenerator', () => {
  let generator: JestGenerator;

  beforeEach(() => {
    generator = new JestGenerator();
  });

  const mockEndpoint: ApiEndpoint = {
    path: '/users',
    method: 'GET',
    handler: 'getUsers',
    requiresAuth: false,
    parameters: [],
    responses: [{ statusCode: 200, description: 'Success' }],
  };

  const mockTestCase: TestCase = {
    name: 'GET /users - Success',
    endpoint: mockEndpoint,
    scenario: 'success',
    expectedStatus: 200,
  };

  describe('generate', () => {
    it('should generate valid Jest test file', () => {
      const result = generator.generate([mockTestCase]);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain("import request from 'supertest'");
      expect(result.content).toContain("describe('API Integration Tests'");
    });

    it('should include setup and teardown', () => {
      const result = generator.generate([mockTestCase]);

      expect(result.content).toContain('beforeAll');
      expect(result.content).toContain('afterAll');
      expect(result.content).toContain('setupTestDB');
      expect(result.content).toContain('teardownTestDB');
    });

    it('should generate success test case', () => {
      const result = generator.generate([mockTestCase]);

      expect(result.content).toContain("it('GET /users - Success'");
      expect(result.content).toContain('.get(\'/users\')');
      expect(result.content).toContain('.expect(200)');
    });

    it('should generate auth error test case', () => {
      const authEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        requiresAuth: true,
      };

      const authErrorCase: TestCase = {
        name: 'GET /users - Unauthorized',
        endpoint: authEndpoint,
        scenario: 'auth-error',
        expectedStatus: 401,
      };

      const result = generator.generate([authErrorCase]);

      expect(result.content).toContain("it('GET /users - Unauthorized'");
      expect(result.content).toContain('.expect(401)');
      expect(result.content).not.toContain('Authorization');
    });

    it('should add auth header for authenticated endpoints', () => {
      const authEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        requiresAuth: true,
      };

      const authTestCase: TestCase = {
        ...mockTestCase,
        endpoint: authEndpoint,
      };

      const result = generator.generate([authTestCase]);

      expect(result.content).toContain('Authorization');
      expect(result.content).toContain('Bearer ${authToken}');
    });

    it('should generate POST request with body', () => {
      const postEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        method: 'POST',
        path: '/users',
      };

      const postTestCase: TestCase = {
        name: 'POST /users - Success',
        endpoint: postEndpoint,
        scenario: 'success',
        expectedStatus: 201,
      };

      const result = generator.generate([postTestCase]);

      expect(result.content).toContain('.post(\'/users\')');
      expect(result.content).toContain('.send(');
      expect(result.content).toContain('.expect(201)');
    });

    it('should generate validation error test', () => {
      const postEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        method: 'POST',
      };

      const validationCase: TestCase = {
        name: 'POST /users - Invalid Body',
        endpoint: postEndpoint,
        scenario: 'validation-error',
        expectedStatus: 400,
      };

      const result = generator.generate([validationCase]);

      expect(result.content).toContain('.send({})');
      expect(result.content).toContain('.expect(400)');
    });

    it('should replace path parameters', () => {
      const paramEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        path: '/users/:id',
        parameters: [
          {
            name: 'id',
            location: 'path',
            type: 'string',
            required: true,
            example: '123',
          },
        ],
      };

      const paramTestCase: TestCase = {
        ...mockTestCase,
        endpoint: paramEndpoint,
      };

      const result = generator.generate([paramTestCase]);

      expect(result.content).toContain('.get(\'/users/123\')');
      // Path params should be replaced in the actual request, but describe block can keep original path
      expect(result.content).toMatch(/\.get\(['"]\/users\/123['"]\)/);
    });

    it('should add query parameters', () => {
      const queryEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        parameters: [
          {
            name: 'limit',
            location: 'query',
            type: 'number',
            required: false,
            example: '10',
          },
        ],
      };

      const queryTestCase: TestCase = {
        ...mockTestCase,
        endpoint: queryEndpoint,
      };

      const result = generator.generate([queryTestCase]);

      expect(result.content).toContain('.query(');
      expect(result.content).toContain('limit');
    });

    it('should group tests by endpoint', () => {
      const testCases: TestCase[] = [
        { ...mockTestCase, name: 'GET /users - Success' },
        { ...mockTestCase, name: 'GET /users - Unauthorized', scenario: 'auth-error', expectedStatus: 401 },
        { ...mockTestCase, endpoint: { ...mockEndpoint, path: '/posts' }, name: 'GET /posts - Success' },
      ];

      const result = generator.generate(testCases);

      expect(result.content).toContain("describe('GET /users'");
      expect(result.content).toContain("describe('GET /posts'");
    });

    it('should handle DELETE requests', () => {
      const deleteEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        method: 'DELETE',
        path: '/users/:id',
        parameters: [
          {
            name: 'id',
            location: 'path',
            type: 'string',
            required: true,
            example: '123',
          },
        ],
      };

      const deleteTestCase: TestCase = {
        name: 'DELETE /users/:id - Success',
        endpoint: deleteEndpoint,
        scenario: 'success',
        expectedStatus: 204,
      };

      const result = generator.generate([deleteTestCase]);

      expect(result.content).toContain('.delete(\'/users/123\')');
      expect(result.content).toContain('.expect(204)');
    });

    it('should write to file when output path provided', () => {
      const result = generator.generate([mockTestCase], '/tmp/test-output.test.ts');

      expect(result.success).toBe(true);
      expect(result.outputPath).toBe('/tmp/test-output.test.ts');
    });

    it('should return content without writing when no output path', () => {
      const result = generator.generate([mockTestCase]);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      // Generator provides a default output path even when not writing to file
      expect(result.outputPath).toBe('tests/api.test.ts');
    });

    it('should handle empty test cases array', () => {
      const result = generator.generate([]);

      expect(result.success).toBe(true);
      expect(result.testsGenerated).toBe(0);
    });

    it('should count tests correctly', () => {
      const testCases: TestCase[] = [
        mockTestCase,
        { ...mockTestCase, scenario: 'auth-error' },
        { ...mockTestCase, scenario: 'validation-error' },
      ];

      const result = generator.generate(testCases);

      expect(result.testsGenerated).toBe(3);
    });
  });
});
