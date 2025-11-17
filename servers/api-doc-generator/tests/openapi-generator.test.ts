/**
 * Tests for OpenAPI generator
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { OpenAPIGenerator } from '../src/generators/openapi.js';
import { ApiDocumentation, ApiEndpoint } from '../src/types.js';

describe('OpenAPIGenerator', () => {
  let generator: OpenAPIGenerator;

  beforeEach(() => {
    generator = new OpenAPIGenerator();
  });

  const mockEndpoint: ApiEndpoint = {
    path: '/users',
    method: 'GET',
    handler: 'getUsers',
    description: 'Get all users',
    summary: 'List users',
    tags: ['Users'],
    parameters: [],
    responses: [
      {
        statusCode: 200,
        description: 'Success',
        schema: { type: 'array' },
      },
    ],
    authentication: [],
    filePath: '/test/routes.ts',
  };

  describe('generate', () => {
    it('should generate valid OpenAPI 3.0 spec', () => {
      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        description: 'Test API description',
        endpoints: [mockEndpoint],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toBeDefined();
      expect(result.content).toContain('openapi: 3.0.3');
      expect(result.content).toContain('title: Test API');
      expect(result.content).toContain('version: 1.0.0');
    });

    it('should include all endpoints', () => {
      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [
          { ...mockEndpoint, path: '/users', method: 'GET' },
          { ...mockEndpoint, path: '/users', method: 'POST' },
          { ...mockEndpoint, path: '/users/{id}', method: 'GET' },
        ],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('/users');
      expect(result.content).toContain('/users/{id}');
      expect(result.content).toContain('get:');
      expect(result.content).toContain('post:');
    });

    it('should include path parameters', () => {
      const endpointWithParam: ApiEndpoint = {
        ...mockEndpoint,
        path: '/users/{id}',
        parameters: [
          {
            name: 'id',
            location: 'path',
            type: 'string',
            required: true,
            description: 'User ID',
          },
        ],
      };

      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [endpointWithParam],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('parameters:');
      expect(result.content).toContain('name: id');
      expect(result.content).toContain('in: path');
      expect(result.content).toContain('required: true');
    });

    it('should include query parameters', () => {
      const endpointWithQuery: ApiEndpoint = {
        ...mockEndpoint,
        parameters: [
          {
            name: 'limit',
            location: 'query',
            type: 'integer',
            required: false,
            description: 'Max items',
          },
        ],
      };

      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [endpointWithQuery],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('name: limit');
      expect(result.content).toContain('in: query');
      expect(result.content).toContain('required: false');
    });

    it('should handle POST endpoints', () => {
      const postEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        method: 'POST',
        description: 'Create user',
      };

      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [postEndpoint],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('post:');
      expect(result.content).toContain('Create user');
    });

    it('should include response schemas', () => {
      const endpointWithResponse: ApiEndpoint = {
        ...mockEndpoint,
        responses: [
          {
            statusCode: 200,
            description: 'Success',
            schema: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
              },
            },
          },
          {
            statusCode: 404,
            description: 'Not found',
          },
        ],
      };

      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [endpointWithResponse],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('responses:');
      expect(result.content).toMatch(/'200':|"200":/);
      expect(result.content).toMatch(/'404':|"404":/);
    });

    it('should include security schemes for authenticated endpoints', () => {
      const authEndpoint: ApiEndpoint = {
        ...mockEndpoint,
        authentication: ['Bearer'],
      };

      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [authEndpoint],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('security:');
    });

    it('should group endpoints by tags', () => {
      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [
          { ...mockEndpoint, tags: ['Users'] },
          { ...mockEndpoint, path: '/posts', tags: ['Posts'] },
        ],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('tags:');
      expect(result.content).toContain('- Users');
      expect(result.content).toContain('- Posts');
    });

    it('should generate JSON format when output path ends with .json', () => {
      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [mockEndpoint],
      };

      const result = generator.generate(documentation, '/tmp/spec.json');

      expect(result.success).toBe(true);
      expect(() => JSON.parse(result.content!)).not.toThrow();
      const parsed = JSON.parse(result.content!);
      expect(parsed.openapi).toBe('3.0.3');
    });

    it('should generate YAML format by default', () => {
      const documentation: ApiDocumentation = {
        title: 'Test API',
        version: '1.0.0',
        endpoints: [mockEndpoint],
      };

      const result = generator.generate(documentation);

      expect(result.success).toBe(true);
      expect(result.content).toContain('openapi: 3.0.3');
    });

    it('should return error on failure', () => {
      // Pass invalid documentation to trigger error
      const result = generator.generate(null as any);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
