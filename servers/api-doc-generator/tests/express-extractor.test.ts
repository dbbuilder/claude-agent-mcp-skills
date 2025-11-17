/**
 * Tests for Express endpoint extractor
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ExpressExtractor } from '../src/extractors/express.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('ExpressExtractor', () => {
  let extractor: ExpressExtractor;
  let tempDir: string;

  beforeEach(() => {
    extractor = new ExpressExtractor();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'api-doc-test-'));
  });

  afterEach(() => {
    // Cleanup temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('extractEndpoints', () => {
    it('should extract GET endpoint', async () => {
      const testFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        testFile,
        `
        import express from 'express';
        const router = express.Router();

        /**
         * Get all users
         */
        router.get('/users', async (req, res) => {
          res.json({ users: [] });
        });
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0]).toMatchObject({
        path: '/users',
        method: 'GET',
        description: expect.stringContaining('Get all users'),
      });
    });

    it('should extract POST endpoint with parameters', async () => {
      const testFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        testFile,
        `
        /**
         * Create a new user
         * @param {string} name - User name
         * @param {string} email - User email
         */
        router.post('/users', async (req, res) => {
          res.status(201).json({ id: 1 });
        });
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0]).toMatchObject({
        path: '/users',
        method: 'POST',
        description: expect.stringContaining('Create a new user'),
      });
      expect(endpoints[0].parameters.length).toBeGreaterThan(0);
    });

    it('should extract path parameters', async () => {
      const testFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        testFile,
        `
        router.get('/users/:id', async (req, res) => {
          res.json({ id: req.params.id });
        });
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].parameters).toContainEqual(
        expect.objectContaining({
          name: 'id',
          location: 'path',
          required: true,
        })
      );
    });

    it('should detect authentication requirements', async () => {
      const testFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        testFile,
        `
        /**
         * Get user profile
         * @authentication Bearer
         */
        router.get('/profile', authenticate, async (req, res) => {
          res.json({ user: req.user });
        });
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0].authentication).toBeDefined();
      expect(Array.isArray(endpoints[0].authentication)).toBe(true);
    });

    it('should handle multiple HTTP methods', async () => {
      const testFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        testFile,
        `
        router.get('/items', (req, res) => res.json([]));
        router.post('/items', (req, res) => res.status(201).json({}));
        router.put('/items/:id', (req, res) => res.json({}));
        router.delete('/items/:id', (req, res) => res.status(204).send());
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints).toHaveLength(4);
      expect(endpoints.map(e => e.method)).toEqual(['GET', 'POST', 'PUT', 'DELETE']);
    });

    it('should extract multiple routes from same file', async () => {
      const testFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        testFile,
        `
        router.get('/active', (req, res) => res.json({}));
        router.post('/active', (req, res) => res.json({}));
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints.length).toBeGreaterThanOrEqual(1);
      expect(endpoints.map(e => e.path)).toContain('/active');
    });

    it('should extract response information', async () => {
      const testFile = path.join(tempDir, 'routes.ts');
      fs.writeFileSync(
        testFile,
        `
        /**
         * Create user
         * @response 201 User created successfully
         */
        router.post('/users', (req, res) => {
          res.status(201).json({ id: 1 });
        });
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints[0].responses).toBeDefined();
      expect(Array.isArray(endpoints[0].responses)).toBe(true);
    });

    it('should handle app.METHOD() syntax', async () => {
      const testFile = path.join(tempDir, 'app.ts');
      fs.writeFileSync(
        testFile,
        `
        import express from 'express';
        const app = express();

        app.get('/health', (req, res) => res.json({ status: 'ok' }));
        `
      );

      const endpoints = await extractor.extract(tempDir);

      expect(endpoints).toHaveLength(1);
      expect(endpoints[0]).toMatchObject({
        path: '/health',
        method: 'GET',
      });
    });

    it('should return empty array for directory with no routes', async () => {
      const endpoints = await extractor.extract(tempDir);
      expect(endpoints).toEqual([]);
    });
  });
});
