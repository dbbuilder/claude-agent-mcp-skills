/**
 * Tests for variable discoverer
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { VariableDiscoverer } from '../src/analyzers/variable-discoverer.js';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

describe('VariableDiscoverer', () => {
  let discoverer: VariableDiscoverer;
  let tempDir: string;

  beforeEach(() => {
    discoverer = new VariableDiscoverer();
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true });
    }
  });

  describe('discover', () => {
    it('should discover process.env variables in Node.js', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      fs.writeFileSync(
        testFile,
        `
        const dbUrl = process.env.DATABASE_URL;
        const apiKey = process.env.API_KEY;
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      expect(result.variables.length).toBe(2);
      expect(result.variables.map(v => v.name)).toContain('DATABASE_URL');
      expect(result.variables.map(v => v.name)).toContain('API_KEY');
    });

    it('should discover os.environ variables in Python', async () => {
      const testFile = path.join(tempDir, 'config.py');
      fs.writeFileSync(
        testFile,
        `
        import os
        db_url = os.environ['DATABASE_URL']
        api_key = os.getenv('API_KEY')
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      expect(result.variables.length).toBe(2);
      expect(result.variables.map(v => v.name)).toContain('DATABASE_URL');
      expect(result.variables.map(v => v.name)).toContain('API_KEY');
    });

    it('should infer variable types correctly', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      fs.writeFileSync(
        testFile,
        `
        const dbUrl = process.env.DATABASE_URL;
        const port = process.env.PORT;
        const apiKey = process.env.API_KEY;
        const debug = process.env.DEBUG;
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      const dbVar = result.variables.find(v => v.name === 'DATABASE_URL');
      const portVar = result.variables.find(v => v.name === 'PORT');
      const apiKeyVar = result.variables.find(v => v.name === 'API_KEY');
      const debugVar = result.variables.find(v => v.name === 'DEBUG');

      expect(dbVar?.type).toBe('database_url');
      expect(portVar?.type).toBe('port');
      expect(apiKeyVar?.type).toBe('api_key');
      expect(debugVar?.type).toBe('boolean');
    });

    it('should categorize variables correctly', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      fs.writeFileSync(
        testFile,
        `
        const dbUrl = process.env.DATABASE_URL;
        const apiKey = process.env.API_KEY;
        const jwtSecret = process.env.JWT_SECRET;
        const smtpHost = process.env.SMTP_HOST;
        const redisUrl = process.env.REDIS_URL;
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      const dbVar = result.variables.find(v => v.name === 'DATABASE_URL');
      const apiVar = result.variables.find(v => v.name === 'API_KEY');
      const jwtVar = result.variables.find(v => v.name === 'JWT_SECRET');
      const smtpVar = result.variables.find(v => v.name === 'SMTP_HOST');
      const redisVar = result.variables.find(v => v.name === 'REDIS_URL');

      expect(dbVar?.category).toBe('database');
      expect(apiVar?.category).toBe('api');
      expect(jwtVar?.category).toBe('authentication');
      expect(smtpVar?.category).toBe('email');
      expect(redisVar?.category).toBe('cache');
    });

    it('should identify sensitive variables', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      fs.writeFileSync(
        testFile,
        `
        const password = process.env.DB_PASSWORD;
        const secret = process.env.JWT_SECRET;
        const apiKey = process.env.API_KEY;
        const port = process.env.PORT;
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      const passwordVar = result.variables.find(v => v.name === 'DB_PASSWORD');
      const secretVar = result.variables.find(v => v.name === 'JWT_SECRET');
      const apiKeyVar = result.variables.find(v => v.name === 'API_KEY');
      const portVar = result.variables.find(v => v.name === 'PORT');

      expect(passwordVar?.sensitive).toBe(true);
      expect(secretVar?.sensitive).toBe(true);
      expect(apiKeyVar?.sensitive).toBe(true);
      expect(portVar?.sensitive).toBe(false);
    });

    it('should track variable usages', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      fs.writeFileSync(
        testFile,
        `
        const dbUrl = process.env.DATABASE_URL;
        const connection = process.env.DATABASE_URL;
        const url = process.env.DATABASE_URL;
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      const dbVar = result.variables.find(v => v.name === 'DATABASE_URL');

      expect(dbVar?.usages.length).toBe(3);
      expect(result.totalUsages).toBe(3);
    });

    it('should generate example values', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      fs.writeFileSync(
        testFile,
        `
        const dbUrl = process.env.DATABASE_URL;
        const port = process.env.PORT;
        const email = process.env.ADMIN_EMAIL;
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      const dbVar = result.variables.find(v => v.name === 'DATABASE_URL');
      const portVar = result.variables.find(v => v.name === 'PORT');
      const emailVar = result.variables.find(v => v.name === 'ADMIN_EMAIL');

      expect(dbVar?.exampleValue).toContain('postgresql://');
      expect(portVar?.exampleValue).toBe('3000');
      expect(emailVar?.exampleValue).toContain('@');
    });

    it('should detect frameworks', async () => {
      const testFile = path.join(tempDir, 'server.ts');
      fs.writeFileSync(
        testFile,
        `
        import express from 'express';
        const app = express();
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      expect(result.frameworks).toContain('Node.js/Express');
    });

    it('should identify config files', async () => {
      const configFile = path.join(tempDir, '.env.example');
      fs.writeFileSync(configFile, 'DATABASE_URL=example');

      const result = await discoverer.discover({ projectPath: tempDir });

      expect(result.configFiles).toContain(configFile);
    });

    it('should detect required vs optional variables', async () => {
      const testFile = path.join(tempDir, 'config.ts');
      fs.writeFileSync(
        testFile,
        `
        const required = process.env.DATABASE_URL;
        const optional = process.env.DEBUG || 'false';
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      const requiredVar = result.variables.find(v => v.name === 'DATABASE_URL');
      const optionalVar = result.variables.find(v => v.name === 'DEBUG');

      expect(requiredVar?.required).toBe(true);
      expect(optionalVar?.required).toBe(false);
    });

    it('should handle .NET environment variables', async () => {
      const testFile = path.join(tempDir, 'Config.cs');
      fs.writeFileSync(
        testFile,
        `
        var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL");
        var apiKey = Configuration["API_KEY"];
        `
      );

      const result = await discoverer.discover({ projectPath: tempDir });

      expect(result.variables.length).toBe(2);
      expect(result.variables.map(v => v.name)).toContain('DATABASE_URL');
      expect(result.variables.map(v => v.name)).toContain('API_KEY');
    });

    it('should handle empty project', async () => {
      const result = await discoverer.discover({ projectPath: tempDir });

      expect(result.variables).toEqual([]);
      expect(result.totalUsages).toBe(0);
    });

    it('should exclude node_modules by default', async () => {
      const nodeModulesDir = path.join(tempDir, 'node_modules');
      fs.mkdirSync(nodeModulesDir);

      const testFile = path.join(nodeModulesDir, 'module.ts');
      fs.writeFileSync(testFile, 'const x = process.env.SHOULD_NOT_FIND;');

      const result = await discoverer.discover({ projectPath: tempDir });

      expect(result.variables.map(v => v.name)).not.toContain('SHOULD_NOT_FIND');
    });
  });
});
