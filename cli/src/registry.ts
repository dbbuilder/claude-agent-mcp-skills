/**
 * Server Registry
 * Central registry of all available MCP servers
 */

import { ServerRegistry } from './types.js';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SDK_ROOT = path.resolve(__dirname, '../..');

export const servers: ServerRegistry = {
  'security-auditor': {
    name: 'Security Auditor',
    description: 'Scan codebases for security vulnerabilities and generate audit reports',
    path: path.join(SDK_ROOT, 'servers/security-auditor/build/index.js'),
    commands: [
      {
        name: 'audit',
        description: 'Run security audit on a project',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'outputPath', description: 'Output path for report', required: false },
          { name: 'format', description: 'Report format (json|markdown|html)', required: false, default: 'markdown' },
        ],
      },
    ],
  },

  'project-scaffolder': {
    name: 'Project Scaffolder',
    description: 'Generate project templates for various frameworks and languages',
    path: path.join(SDK_ROOT, 'servers/project-scaffolder/build/index.js'),
    commands: [
      {
        name: 'scaffold',
        description: 'Create a new project from template',
        args: [
          { name: 'projectType', description: 'Type of project (nextjs|express|fastapi|etc)', required: true },
          { name: 'projectName', description: 'Name of the project', required: true },
          { name: 'outputPath', description: 'Output directory', required: false, default: '.' },
        ],
      },
    ],
  },

  'readme-generator': {
    name: 'README Generator',
    description: 'Generate comprehensive README documentation from code analysis',
    path: path.join(SDK_ROOT, 'servers/readme-generator/build/index.js'),
    commands: [
      {
        name: 'generate',
        description: 'Generate README for a project',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'outputPath', description: 'Output path for README', required: false },
        ],
      },
    ],
  },

  'dependency-updater': {
    name: 'Dependency Updater',
    description: 'Analyze and update project dependencies safely',
    path: path.join(SDK_ROOT, 'servers/dependency-updater/build/index.js'),
    commands: [
      {
        name: 'update',
        description: 'Update project dependencies',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'strategy', description: 'Update strategy (conservative|balanced|aggressive)', required: false, default: 'balanced' },
        ],
      },
      {
        name: 'analyze',
        description: 'Analyze dependencies without updating',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
        ],
      },
    ],
  },

  'api-doc-generator': {
    name: 'API Documentation Generator',
    description: 'Generate OpenAPI specs and API documentation from code',
    path: path.join(SDK_ROOT, 'servers/api-doc-generator/build/index.js'),
    commands: [
      {
        name: 'generate',
        description: 'Generate API documentation',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'framework', description: 'Framework (express|fastapi|aspnet)', required: false },
          { name: 'format', description: 'Output format (openapi|markdown|both)', required: false, default: 'both' },
          { name: 'outputPath', description: 'Output directory', required: false },
        ],
      },
    ],
  },

  'integration-test-generator': {
    name: 'Integration Test Generator',
    description: 'Generate integration tests from API endpoints',
    path: path.join(SDK_ROOT, 'servers/integration-test-generator/build/index.js'),
    commands: [
      {
        name: 'generate',
        description: 'Generate integration tests',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'framework', description: 'Framework (express|fastapi|aspnet)', required: false },
          { name: 'testFramework', description: 'Test framework (jest|pytest|xunit)', required: false },
          { name: 'outputPath', description: 'Output directory', required: false },
        ],
      },
    ],
  },

  'config-template-generator': {
    name: 'Configuration Template Generator',
    description: 'Discover environment variables and generate config templates',
    path: path.join(SDK_ROOT, 'servers/config-template-generator/build/index.js'),
    commands: [
      {
        name: 'discover',
        description: 'Discover environment variables',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
        ],
      },
      {
        name: 'generate',
        description: 'Generate configuration templates',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'format', description: 'Template format (env|zod|joi)', required: false, default: 'env' },
          { name: 'outputPath', description: 'Output directory', required: false },
        ],
      },
    ],
  },

  'docker-config-generator': {
    name: 'Docker Configuration Generator',
    description: 'Generate Dockerfiles and docker-compose configurations',
    path: path.join(SDK_ROOT, 'servers/docker-config-generator/build/index.js'),
    commands: [
      {
        name: 'analyze',
        description: 'Analyze project for Docker configuration',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
        ],
      },
      {
        name: 'generate',
        description: 'Generate Docker configuration',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'includeCompose', description: 'Generate docker-compose.yml', required: false, default: 'true' },
          { name: 'outputPath', description: 'Output directory', required: false },
        ],
      },
    ],
  },

  'code-migration-assistant': {
    name: 'Code Migration Assistant',
    description: 'Assist with framework migrations and code transformations',
    path: path.join(SDK_ROOT, 'servers/code-migration-assistant/build/index.js'),
    commands: [
      {
        name: 'analyze',
        description: 'Analyze codebase for migration',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'targetFramework', description: 'Target framework/version', required: true },
        ],
      },
      {
        name: 'migrate',
        description: 'Perform code migration',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'targetFramework', description: 'Target framework/version', required: true },
          { name: 'strategy', description: 'Migration strategy', required: false, default: 'conservative' },
        ],
      },
    ],
  },

  'performance-profiler': {
    name: 'Performance Profiler',
    description: 'Analyze code performance and suggest optimizations',
    path: path.join(SDK_ROOT, 'servers/performance-profiler/build/index.js'),
    commands: [
      {
        name: 'profile',
        description: 'Profile application performance',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
          { name: 'entryPoint', description: 'Application entry point', required: false },
        ],
      },
      {
        name: 'analyze',
        description: 'Analyze code for performance issues',
        args: [
          { name: 'projectPath', description: 'Path to project directory', required: true },
        ],
      },
    ],
  },
};
