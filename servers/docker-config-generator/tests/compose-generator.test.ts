/**
 * Tests for Docker Compose generator
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { ComposeGenerator } from '../src/generators/compose-generator.js';
import { DockerComposeOptions, ServiceConfig } from '../src/types.js';

describe('ComposeGenerator', () => {
  let generator: ComposeGenerator;

  beforeEach(() => {
    generator = new ComposeGenerator();
  });

  describe('Basic compose generation', () => {
    it('should generate basic docker-compose.yml', () => {
      const appService: ServiceConfig = {
        name: 'app',
        type: 'application',
        build: {
          context: '.',
          dockerfile: 'Dockerfile',
        },
        ports: ['3000:3000'],
        environment: {
          NODE_ENV: 'production',
        },
      };

      const options: DockerComposeOptions = {
        projectName: 'my-app',
        services: [appService],
        networks: ['app-network'],
      };

      const result = generator.generate(options);

      expect(result).toContain('version: "3.8"');
      expect(result).toContain('services:');
      expect(result).toContain('app:');
      expect(result).toContain('build:');
      expect(result).toContain('context: .');
      expect(result).toContain('dockerfile: Dockerfile');
      expect(result).toContain('networks:');
      expect(result).toContain('app-network:');
    });

    it('should include restart policy', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('restart: unless-stopped');
    });

    it('should include container name', () => {
      const service: ServiceConfig = {
        name: 'my-app',
        type: 'application',
        image: 'node:20-alpine',
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('container_name: my-app');
    });
  });

  describe('Service configurations', () => {
    it('should use image when provided', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'my-app:latest',
        ports: ['8080:8080'],
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('image: my-app:latest');
      expect(result).not.toContain('build:');
    });

    it('should map ports correctly', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
        ports: ['3000:3000', '3001:3001'],
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('ports:');
      expect(result).toContain('"3000:3000"');
      expect(result).toContain('"3001:3001"');
    });

    it('should include environment variables', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
        environment: {
          NODE_ENV: 'production',
          PORT: '3000',
          DATABASE_URL: 'postgres://localhost/mydb',
        },
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('environment:');
      expect(result).toContain('NODE_ENV: production');
      expect(result).toContain('PORT: 3000');
      expect(result).toContain('DATABASE_URL: postgres://localhost/mydb');
    });

    it('should mount volumes', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
        volumes: ['./src:/app/src', 'node_modules:/app/node_modules'],
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('volumes:');
      expect(result).toContain('./src:/app/src');
      expect(result).toContain('node_modules:/app/node_modules');
    });

    it('should add dependencies', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
        dependsOn: ['postgres', 'redis'],
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('depends_on:');
      expect(result).toContain('- postgres');
      expect(result).toContain('- redis');
    });

    it('should include health checks', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
        healthcheck: {
          test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
          interval: '30s',
          timeout: '3s',
          retries: 3,
          startPeriod: '5s',
        },
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
      };

      const result = generator.generate(options);

      expect(result).toContain('healthcheck:');
      expect(result).toContain('interval: 30s');
      expect(result).toContain('timeout: 3s');
      expect(result).toContain('retries: 3');
      expect(result).toContain('start_period: 5s');
    });
  });

  describe('Database services', () => {
    it('should generate PostgreSQL service', () => {
      const service = generator.generateDatabaseService('postgresql', 'my-app');

      expect(service.name).toBe('postgres');
      expect(service.type).toBe('database');
      expect(service.image).toBe('postgres:16-alpine');
      expect(service.ports).toContain('5432:5432');
      expect(service.environment?.POSTGRES_DB).toBe('my-app_db');
      expect(service.volumes).toContain('postgres-data:/var/lib/postgresql/data');
      expect(service.healthcheck).toBeDefined();
    });

    it('should generate MySQL service', () => {
      const service = generator.generateDatabaseService('mysql', 'my-app');

      expect(service.name).toBe('mysql');
      expect(service.image).toBe('mysql:8.0');
      expect(service.ports).toContain('3306:3306');
      expect(service.environment?.MYSQL_DATABASE).toBe('my-app_db');
      expect(service.volumes).toContain('mysql-data:/var/lib/mysql');
    });

    it('should generate MongoDB service', () => {
      const service = generator.generateDatabaseService('mongodb', 'my-app');

      expect(service.name).toBe('mongo');
      expect(service.image).toBe('mongo:7');
      expect(service.ports).toContain('27017:27017');
      expect(service.environment?.MONGO_INITDB_DATABASE).toBe('my-app_db');
      expect(service.volumes).toContain('mongo-data:/data/db');
    });

    it('should generate SQL Server service', () => {
      const service = generator.generateDatabaseService('sqlserver', 'my-app');

      expect(service.name).toBe('sqlserver');
      expect(service.image).toBe('mcr.microsoft.com/mssql/server:2022-latest');
      expect(service.ports).toContain('1433:1433');
      expect(service.environment?.ACCEPT_EULA).toBe('Y');
      expect(service.volumes).toContain('sqlserver-data:/var/opt/mssql');
    });

    it('should generate Redis service', () => {
      const service = generator.generateDatabaseService('redis', 'my-app');

      expect(service.name).toBe('redis');
      expect(service.type).toBe('cache');
      expect(service.image).toBe('redis:7-alpine');
      expect(service.ports).toContain('6379:6379');
      expect(service.volumes).toContain('redis-data:/data');
    });

    it('should throw error for unsupported database', () => {
      expect(() => generator.generateDatabaseService('oracle' as any, 'test')).toThrow(
        'Unsupported database type'
      );
    });
  });

  describe('Multi-service compose', () => {
    it('should generate compose with app and database', () => {
      const appService: ServiceConfig = {
        name: 'app',
        type: 'application',
        build: {
          context: '.',
          dockerfile: 'Dockerfile',
        },
        ports: ['3000:3000'],
        environment: {
          DATABASE_URL: 'postgres://postgres:postgres@postgres:5432/myapp_db',
        },
        dependsOn: ['postgres'],
      };

      const dbService = generator.generateDatabaseService('postgresql', 'myapp');

      const options: DockerComposeOptions = {
        projectName: 'myapp',
        services: [appService, dbService],
        networks: ['app-network'],
      };

      const result = generator.generate(options);

      expect(result).toContain('app:');
      expect(result).toContain('postgres:');
      expect(result).toContain('depends_on:');
      expect(result).toContain('- postgres');
    });

    it('should generate compose with multiple databases', () => {
      const appService: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'my-app:latest',
        dependsOn: ['postgres', 'redis'],
      };

      const postgresService = generator.generateDatabaseService('postgresql', 'myapp');
      const redisService = generator.generateDatabaseService('redis', 'myapp');

      const options: DockerComposeOptions = {
        projectName: 'myapp',
        services: [appService, postgresService, redisService],
      };

      const result = generator.generate(options);

      expect(result).toContain('postgres:');
      expect(result).toContain('redis:');
      expect(result).toContain('- postgres');
      expect(result).toContain('- redis');
    });
  });

  describe('Networks and volumes', () => {
    it('should define named volumes', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
        volumes: ['app-data:/data'],
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
        volumes: [{ name: 'app-data' }],
      };

      const result = generator.generate(options);

      expect(result).toContain('volumes:');
      expect(result).toContain('app-data:');
    });

    it('should specify volume driver', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
        volumes: [{ name: 'app-data', driver: 'local' }],
      };

      const result = generator.generate(options);

      expect(result).toContain('app-data:');
      expect(result).toContain('driver: local');
    });

    it('should define custom networks', () => {
      const service: ServiceConfig = {
        name: 'app',
        type: 'application',
        image: 'node:20-alpine',
      };

      const options: DockerComposeOptions = {
        projectName: 'test',
        services: [service],
        networks: ['frontend', 'backend'],
      };

      const result = generator.generate(options);

      expect(result).toContain('networks:');
      expect(result).toContain('frontend:');
      expect(result).toContain('backend:');
      expect(result).toContain('driver: bridge');
    });
  });

  describe('Complete stack generation', () => {
    it('should generate full-stack application compose', () => {
      const appService: ServiceConfig = {
        name: 'api',
        type: 'application',
        build: {
          context: '.',
          dockerfile: 'Dockerfile',
        },
        ports: ['3000:3000'],
        environment: {
          NODE_ENV: 'production',
          DATABASE_URL: 'postgres://postgres:postgres@postgres:5432/app_db',
          REDIS_URL: 'redis://redis:6379',
        },
        dependsOn: ['postgres', 'redis'],
        healthcheck: {
          test: ['CMD', 'curl', '-f', 'http://localhost:3000/health'],
          interval: '30s',
          timeout: '3s',
          retries: 3,
        },
      };

      const postgresService = generator.generateDatabaseService('postgresql', 'app');
      const redisService = generator.generateDatabaseService('redis', 'app');

      const options: DockerComposeOptions = {
        projectName: 'app',
        services: [appService, postgresService, redisService],
        networks: ['app-network'],
        volumes: [
          { name: 'postgres-data' },
          { name: 'redis-data' },
        ],
      };

      const result = generator.generate(options);

      expect(result).toContain('version: "3.8"');
      expect(result).toContain('api:');
      expect(result).toContain('postgres:');
      expect(result).toContain('redis:');
      expect(result).toContain('networks:');
      expect(result).toContain('volumes:');
      expect(result).toContain('postgres-data:');
      expect(result).toContain('redis-data:');
    });
  });
});
