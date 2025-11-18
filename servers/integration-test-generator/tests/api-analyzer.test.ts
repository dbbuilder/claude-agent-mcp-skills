/**
 * Tests for API analyzer
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { APIAnalyzer } from '../src/analyzers/api-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('APIAnalyzer', () => {
  let analyzer: APIAnalyzer;
  let tempDir: string;

  beforeEach(() => {
    analyzer = new APIAnalyzer();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-analyzer-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('analyze', () => {
    it('should discover Express endpoints', async () => {
      const routeFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        routeFile,
        `
        import express from 'express';
        const router = express.Router();

        router.get('/users', (req, res) => res.json([]));
        router.post('/users', (req, res) => res.status(201).json({}));
        `
      );

      const result = await analyzer.analyze(tempDir, 'express');

      // Should have at least one test case per endpoint
      expect(result.length).toBeGreaterThanOrEqual(2);
      // Check both endpoints were discovered
      const paths = result.map(tc => tc.endpoint.path);
      expect(paths).toContain('/users');
    });

    it('should generate success test cases', async () => {
      const routeFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        routeFile,
        `router.get('/items', (req, res) => res.json([]));`
      );

      const result = await analyzer.analyze(tempDir, 'express');
      const successCase = result.find(tc => tc.scenario === 'success');

      expect(successCase).toBeDefined();
      expect(successCase?.expectedStatus).toBe(200);
    });

    it('should generate auth error cases for protected endpoints', async () => {
      const routeFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        routeFile,
        `
        import { authenticate } from './middleware';
        router.get('/profile', authenticate, (req, res) => res.json({}));
        `
      );

      const result = await analyzer.analyze(tempDir, 'express');
      const authCase = result.find(tc => tc.scenario === 'auth-error');

      expect(authCase).toBeDefined();
      expect(authCase?.expectedStatus).toBe(401);
    });

    it('should generate validation error cases for POST/PUT/PATCH', async () => {
      const routeFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        routeFile,
        `router.post('/users', (req, res) => res.status(201).json({}));`
      );

      const result = await analyzer.analyze(tempDir, 'express');
      const validationCase = result.find(tc => tc.scenario === 'validation-error');

      expect(validationCase).toBeDefined();
      expect(validationCase?.expectedStatus).toBe(400);
    });

    it('should generate not-found cases for GET with ID parameter', async () => {
      const routeFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        routeFile,
        `router.get('/users/:id', (req, res) => res.json({}));`
      );

      const result = await analyzer.analyze(tempDir, 'express');
      const notFoundCase = result.find(tc => tc.scenario === 'not-found');

      expect(notFoundCase).toBeDefined();
      expect(notFoundCase?.expectedStatus).toBe(404);
    });

    it('should extract path parameters', async () => {
      const routeFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        routeFile,
        `router.get('/users/:id/posts/:postId', (req, res) => res.json({}));`
      );

      const result = await analyzer.analyze(tempDir, 'express');
      const testCase = result[0];

      expect(testCase.endpoint.parameters.length).toBeGreaterThanOrEqual(2);
      expect(testCase.endpoint.parameters).toContainEqual(
        expect.objectContaining({ name: 'id', location: 'path' })
      );
      expect(testCase.endpoint.parameters).toContainEqual(
        expect.objectContaining({ name: 'postId', location: 'path' })
      );
    });

    it('should discover FastAPI endpoints', async () => {
      const routeFile = path.join(tempDir, 'main.py');
      fs.writeFileSync(
        routeFile,
        `
        from fastapi import FastAPI
        app = FastAPI()

        @app.get("/users")
        async def get_users():
            return []
        `
      );

      const result = await analyzer.analyze(tempDir, 'fastapi');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].endpoint.path).toBe('/users');
    });

    it('should discover ASP.NET endpoints', async () => {
      const controllerFile = path.join(tempDir, 'UsersController.cs');
      fs.writeFileSync(
        controllerFile,
        `
        [ApiController]
        [Route("api/[controller]")]
        public class UsersController : ControllerBase
        {
            [HttpGet]
            public IActionResult GetUsers() => Ok();
        }
        `
      );

      const result = await analyzer.analyze(tempDir, 'aspnet');

      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty directory', async () => {
      const result = await analyzer.analyze(tempDir, 'express');

      expect(result).toEqual([]);
    });

    it('should detect framework automatically', async () => {
      // Create package.json with express dependency
      fs.writeFileSync(
        path.join(tempDir, 'package.json'),
        JSON.stringify({ dependencies: { express: '^4.0.0' } })
      );

      const routeFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        routeFile,
        `router.get('/test', (req, res) => res.json({}));`
      );

      const result = await analyzer.analyze(tempDir);

      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('generateTestCasesForEndpoint', () => {
    it('should generate multiple scenarios for endpoint', () => {
      const endpoint = {
        path: '/users/:id',
        method: 'GET' as const,
        handler: 'getUser',
        requiresAuth: true,
        parameters: [
          {
            name: 'id',
            location: 'path' as const,
            type: 'string',
            required: true,
            example: '123',
          },
        ],
        responses: [{ statusCode: 200, description: 'Success' }],
      };

      // Access private method through casting
      const testCases = (analyzer as any).generateTestCasesForEndpoint(endpoint);

      expect(testCases.length).toBeGreaterThanOrEqual(3); // success, auth-error, not-found
      expect(testCases.map((tc: any) => tc.scenario)).toContain('success');
      expect(testCases.map((tc: any) => tc.scenario)).toContain('auth-error');
      expect(testCases.map((tc: any) => tc.scenario)).toContain('not-found');
    });
  });
});
