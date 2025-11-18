/**
 * Tests for Dockerfile generator
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { DockerfileGenerator } from '../src/generators/dockerfile-generator.js';
import { DockerfileOptions } from '../src/types.js';

describe('DockerfileGenerator', () => {
  let generator: DockerfileGenerator;

  beforeEach(() => {
    generator = new DockerfileGenerator();
  });

  describe('Node.js Dockerfile', () => {
    it('should generate multi-stage Node.js Dockerfile', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
        multiStage: true,
        port: 3000,
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM node:20-alpine AS builder');
      expect(result).toContain('FROM node:20-alpine');
      expect(result).toContain('WORKDIR /app');
      expect(result).toContain('npm ci --only=production');
      expect(result).toContain('EXPOSE 3000');
    });

    it('should generate TypeScript Node.js Dockerfile', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs-typescript',
        multiStage: true,
        buildCommand: 'npm run build',
      };

      const result = generator.generate(options);

      expect(result).toContain('npm run build');
      expect(result).toContain('COPY --from=builder /app/dist ./dist');
    });

    it('should include health check', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
        includeHealthcheck: true,
        port: 3000,
      };

      const result = generator.generate(options);

      expect(result).toContain('HEALTHCHECK');
      expect(result).toContain('localhost:3000/health');
    });

    it('should create non-root user', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
      };

      const result = generator.generate(options);

      expect(result).toContain('addgroup -g 1001 -S nodejs');
      expect(result).toContain('adduser -S nodejs -u 1001');
      expect(result).toContain('USER nodejs');
    });

    it('should set environment variables', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
        port: 4000,
      };

      const result = generator.generate(options);

      expect(result).toContain('ENV NODE_ENV=production');
      expect(result).toContain('ENV PORT=4000');
    });

    it('should generate single-stage when requested', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
        multiStage: false,
      };

      const result = generator.generate(options);

      expect(result).not.toContain('AS builder');
      expect(result).toContain('FROM node:20-alpine');
    });
  });

  describe('Python Dockerfile', () => {
    it('should generate FastAPI Dockerfile', () => {
      const options: DockerfileOptions = {
        projectType: 'python-fastapi',
        multiStage: true,
        port: 8000,
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM python:3.12-slim AS builder');
      expect(result).toContain('pip install --no-cache-dir --user -r requirements.txt');
      expect(result).toContain('EXPOSE 8000');
      expect(result).toContain('ENV PYTHONUNBUFFERED=1');
    });

    it('should create non-root user for Python', () => {
      const options: DockerfileOptions = {
        projectType: 'python-fastapi',
      };

      const result = generator.generate(options);

      expect(result).toContain('useradd -m -u 1001 appuser');
      expect(result).toContain('USER appuser');
    });

    it('should include Python health check', () => {
      const options: DockerfileOptions = {
        projectType: 'python-fastapi',
        includeHealthcheck: true,
        port: 8000,
      };

      const result = generator.generate(options);

      expect(result).toContain('HEALTHCHECK');
      expect(result).toContain('urllib.request.urlopen');
    });

    it('should handle Django projects', () => {
      const options: DockerfileOptions = {
        projectType: 'python-django',
        startCommand: 'python manage.py runserver 0.0.0.0:8000',
      };

      const result = generator.generate(options);

      // CMD format is ["python", "manage.py", "runserver", ...]
      expect(result).toContain('"python"');
      expect(result).toContain('"manage.py"');
    });
  });

  describe('.NET Dockerfile', () => {
    it('should generate ASP.NET Dockerfile', () => {
      const options: DockerfileOptions = {
        projectType: 'dotnet-aspnet',
        port: 8080,
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build');
      expect(result).toContain('FROM mcr.microsoft.com/dotnet/aspnet:8.0');
      expect(result).toContain('dotnet restore');
      expect(result).toContain('dotnet publish -c Release -o out');
      expect(result).toContain('EXPOSE 8080');
    });

    it('should set ASPNETCORE_URLS', () => {
      const options: DockerfileOptions = {
        projectType: 'dotnet-aspnet',
        port: 5000,
      };

      const result = generator.generate(options);

      expect(result).toContain('ENV ASPNETCORE_URLS=http://+:5000');
    });

    it('should include health check for .NET', () => {
      const options: DockerfileOptions = {
        projectType: 'dotnet-aspnet',
        includeHealthcheck: true,
        port: 8080,
      };

      const result = generator.generate(options);

      expect(result).toContain('HEALTHCHECK');
      expect(result).toContain('curl -f http://localhost:8080/health');
    });
  });

  describe('React/Vue Dockerfile', () => {
    it('should generate React Dockerfile with Nginx', () => {
      const options: DockerfileOptions = {
        projectType: 'react',
        buildCommand: 'npm run build',
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM node:20-alpine AS builder');
      expect(result).toContain('FROM nginx:alpine');
      expect(result).toContain('COPY --from=builder /app/build /usr/share/nginx/html');
      expect(result).toContain('COPY nginx.conf');
    });

    it('should generate Vue Dockerfile with Nginx', () => {
      const options: DockerfileOptions = {
        projectType: 'vue',
        buildCommand: 'npm run build',
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM nginx:alpine');
      expect(result).toContain('COPY --from=builder /app/dist /usr/share/nginx/html');
    });
  });

  describe('Next.js Dockerfile', () => {
    it('should generate Next.js Dockerfile', () => {
      const options: DockerfileOptions = {
        projectType: 'nextjs',
        port: 3000,
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM node:20-alpine AS deps');
      expect(result).toContain('FROM node:20-alpine AS builder');
      expect(result).toContain('FROM node:20-alpine AS runner');
      expect(result).toContain('ENV NEXT_TELEMETRY_DISABLED 1');
      expect(result).toContain('addgroup --system --gid 1001 nodejs');
      expect(result).toContain('adduser --system --uid 1001 nextjs');
    });

    it('should copy Next.js artifacts correctly', () => {
      const options: DockerfileOptions = {
        projectType: 'nextjs',
      };

      const result = generator.generate(options);

      // Check for Next.js artifacts copy - may include chown flags
      expect(result).toContain('.next/standalone');
      expect(result).toContain('.next/static');
    });

    it('should include Next.js health check', () => {
      const options: DockerfileOptions = {
        projectType: 'nextjs',
        includeHealthcheck: true,
        port: 3000,
      };

      const result = generator.generate(options);

      expect(result).toContain('HEALTHCHECK');
    });
  });

  describe('Static site Dockerfile', () => {
    it('should generate static Dockerfile with Nginx', () => {
      const options: DockerfileOptions = {
        projectType: 'static',
        port: 80,
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM nginx:alpine');
      expect(result).toContain('COPY . /usr/share/nginx/html');
      expect(result).toContain('EXPOSE 80');
    });
  });

  describe('.dockerignore generation', () => {
    it('should generate .dockerignore file', () => {
      const result = generator.generateDockerignore('nodejs');

      expect(result).toContain('node_modules');
      expect(result).toContain('dist');
      expect(result).toContain('.env');
      expect(result).toContain('.git');
      expect(result).toContain('coverage');
      expect(result).toContain('*.log');
    });

    it('should include Python-specific ignores', () => {
      const result = generator.generateDockerignore('python-fastapi');

      expect(result).toContain('venv');
      expect(result).toContain('__pycache__');
      expect(result).toContain('*.pyc');
    });

    it('should include .NET-specific ignores', () => {
      const result = generator.generateDockerignore('dotnet-aspnet');

      expect(result).toContain('bin');
      expect(result).toContain('obj');
    });
  });

  describe('Custom options', () => {
    it('should use custom Node version', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
        nodeVersion: '18',
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM node:18-alpine');
    });

    it('should use custom Python version', () => {
      const options: DockerfileOptions = {
        projectType: 'python-fastapi',
        pythonVersion: '3.11',
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM python:3.11-slim');
    });

    it('should use custom .NET version', () => {
      const options: DockerfileOptions = {
        projectType: 'dotnet-aspnet',
        dotnetVersion: '7.0',
      };

      const result = generator.generate(options);

      expect(result).toContain('FROM mcr.microsoft.com/dotnet/sdk:7.0');
      expect(result).toContain('FROM mcr.microsoft.com/dotnet/aspnet:7.0');
    });

    it('should use custom workdir', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
        workdir: '/usr/src/app',
      };

      const result = generator.generate(options);

      expect(result).toContain('WORKDIR /usr/src/app');
    });

    it('should use custom start command', () => {
      const options: DockerfileOptions = {
        projectType: 'nodejs',
        startCommand: 'node server.js',
      };

      const result = generator.generate(options);

      expect(result).toContain('CMD ["node", "server.js"]');
    });
  });

  describe('Error handling', () => {
    it('should throw error for unsupported project type', () => {
      const options: DockerfileOptions = {
        projectType: 'ruby-rails' as any,
      };

      expect(() => generator.generate(options)).toThrow('Unsupported project type');
    });
  });
});
