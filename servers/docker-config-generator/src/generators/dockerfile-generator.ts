/**
 * Dockerfile Generator
 * Generates optimized Dockerfiles for different project types
 */

import { ProjectType, DockerfileOptions } from '../types.js';

export class DockerfileGenerator {
  /**
   * Generate Dockerfile for project type
   */
  generate(options: DockerfileOptions): string {
    const {
      projectType,
      multiStage = true,
      includeHealthcheck = true,
      port = 3000,
      user = 'node',
    } = options;

    switch (projectType) {
      case 'nodejs':
      case 'nodejs-typescript':
        return this.generateNodeDockerfile(options);

      case 'python-fastapi':
      case 'python-django':
        return this.generatePythonDockerfile(options);

      case 'dotnet-aspnet':
        return this.generateDotNetDockerfile(options);

      case 'react':
      case 'vue':
        return this.generateReactVueDockerfile(options);

      case 'nextjs':
        return this.generateNextJsDockerfile(options);

      case 'static':
        return this.generateStaticDockerfile(options);

      default:
        throw new Error(`Unsupported project type: ${projectType}`);
    }
  }

  /**
   * Generate Dockerfile for Node.js projects
   */
  private generateNodeDockerfile(options: DockerfileOptions): string {
    const {
      nodeVersion = '20',
      workdir = '/app',
      port = 3000,
      buildCommand,
      startCommand = 'node dist/index.js',
      multiStage = true,
      includeHealthcheck = true,
      projectType,
    } = options;

    const lines: string[] = [];

    if (multiStage) {
      // Build stage
      lines.push('# Build stage');
      lines.push(`FROM node:${nodeVersion}-alpine AS builder`);
      lines.push('');
      lines.push(`WORKDIR ${workdir}`);
      lines.push('');
      lines.push('# Copy package files');
      lines.push('COPY package*.json ./');
      lines.push('');
      lines.push('# Install dependencies');
      lines.push('RUN npm ci --only=production');
      lines.push('');
      lines.push('# Copy source code');
      lines.push('COPY . .');
      lines.push('');

      if (buildCommand || projectType === 'nodejs-typescript') {
        lines.push('# Build application');
        lines.push(`RUN ${buildCommand || 'npm run build'}`);
        lines.push('');
      }

      // Production stage
      lines.push('# Production stage');
      lines.push(`FROM node:${nodeVersion}-alpine`);
      lines.push('');
      lines.push(`WORKDIR ${workdir}`);
      lines.push('');
      lines.push('# Copy dependencies from builder');
      lines.push('COPY --from=builder /app/node_modules ./node_modules');
      lines.push('COPY --from=builder /app/package*.json ./');
      lines.push('');

      if (projectType === 'nodejs-typescript') {
        lines.push('# Copy built application');
        lines.push('COPY --from=builder /app/dist ./dist');
      } else {
        lines.push('# Copy source code');
        lines.push('COPY --from=builder /app/src ./src');
      }
    } else {
      // Single stage
      lines.push(`FROM node:${nodeVersion}-alpine`);
      lines.push('');
      lines.push(`WORKDIR ${workdir}`);
      lines.push('');
      lines.push('# Copy package files');
      lines.push('COPY package*.json ./');
      lines.push('');
      lines.push('# Install dependencies');
      lines.push('RUN npm ci --only=production');
      lines.push('');
      lines.push('# Copy application code');
      lines.push('COPY . .');
      lines.push('');

      if (buildCommand) {
        lines.push('# Build application');
        lines.push(`RUN ${buildCommand}`);
        lines.push('');
      }
    }

    // Security: Create non-root user
    lines.push('# Create non-root user');
    lines.push('RUN addgroup -g 1001 -S nodejs && \\');
    lines.push('    adduser -S nodejs -u 1001');
    lines.push('');
    lines.push('# Change ownership');
    lines.push('RUN chown -R nodejs:nodejs /app');
    lines.push('');
    lines.push('# Switch to non-root user');
    lines.push('USER nodejs');
    lines.push('');

    // Expose port
    lines.push(`EXPOSE ${port}`);
    lines.push('');

    // Environment variables
    lines.push('ENV NODE_ENV=production');
    lines.push(`ENV PORT=${port}`);
    lines.push('');

    // Health check
    if (includeHealthcheck) {
      lines.push('# Health check');
      lines.push(`HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\`);
      lines.push(`  CMD node -e "require('http').get('http://localhost:${port}/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"`);
      lines.push('');
    }

    // Start command
    lines.push(`CMD ["${startCommand.split(' ')[0]}", "${startCommand.split(' ').slice(1).join('", "')}"]`);

    return lines.join('\n');
  }

  /**
   * Generate Dockerfile for Python projects
   */
  private generatePythonDockerfile(options: DockerfileOptions): string {
    const {
      pythonVersion = '3.12',
      workdir = '/app',
      port = 8000,
      startCommand = 'uvicorn main:app --host 0.0.0.0 --port 8000',
      multiStage = true,
      includeHealthcheck = true,
      projectType,
    } = options;

    const lines: string[] = [];

    if (multiStage) {
      // Build stage
      lines.push('# Build stage');
      lines.push(`FROM python:${pythonVersion}-slim AS builder`);
      lines.push('');
      lines.push(`WORKDIR ${workdir}`);
      lines.push('');
      lines.push('# Install build dependencies');
      lines.push('RUN apt-get update && apt-get install -y --no-install-recommends \\');
      lines.push('    gcc \\');
      lines.push('    && rm -rf /var/lib/apt/lists/*');
      lines.push('');
      lines.push('# Copy requirements');
      lines.push('COPY requirements.txt .');
      lines.push('');
      lines.push('# Install Python dependencies');
      lines.push('RUN pip install --no-cache-dir --user -r requirements.txt');
      lines.push('');

      // Production stage
      lines.push('# Production stage');
      lines.push(`FROM python:${pythonVersion}-slim`);
      lines.push('');
      lines.push(`WORKDIR ${workdir}`);
      lines.push('');
      lines.push('# Copy Python dependencies from builder');
      lines.push('COPY --from=builder /root/.local /root/.local');
      lines.push('');
      lines.push('# Make sure scripts in .local are usable');
      lines.push('ENV PATH=/root/.local/bin:$PATH');
    } else {
      // Single stage
      lines.push(`FROM python:${pythonVersion}-slim`);
      lines.push('');
      lines.push(`WORKDIR ${workdir}`);
      lines.push('');
      lines.push('# Copy requirements');
      lines.push('COPY requirements.txt .');
      lines.push('');
      lines.push('# Install dependencies');
      lines.push('RUN pip install --no-cache-dir -r requirements.txt');
    }

    // Copy application code
    lines.push('');
    lines.push('# Copy application code');
    lines.push('COPY . .');
    lines.push('');

    // Security: Create non-root user
    lines.push('# Create non-root user');
    lines.push('RUN useradd -m -u 1001 appuser && \\');
    lines.push('    chown -R appuser:appuser /app');
    lines.push('');
    lines.push('USER appuser');
    lines.push('');

    // Expose port
    lines.push(`EXPOSE ${port}`);
    lines.push('');

    // Environment variables
    lines.push('ENV PYTHONUNBUFFERED=1');
    lines.push(`ENV PORT=${port}`);
    lines.push('');

    // Health check
    if (includeHealthcheck) {
      lines.push('# Health check');
      lines.push(`HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\`);
      lines.push(`  CMD python -c "import urllib.request; urllib.request.urlopen('http://localhost:${port}/health')"`);
      lines.push('');
    }

    // Start command
    const cmdParts = startCommand.split(' ');
    lines.push(`CMD ["${cmdParts.join('", "')}"]`);

    return lines.join('\n');
  }

  /**
   * Generate Dockerfile for .NET projects
   */
  private generateDotNetDockerfile(options: DockerfileOptions): string {
    const {
      dotnetVersion = '8.0',
      workdir = '/app',
      port = 8080,
      multiStage = true,
      includeHealthcheck = true,
    } = options;

    const lines: string[] = [];

    // Build stage
    lines.push('# Build stage');
    lines.push(`FROM mcr.microsoft.com/dotnet/sdk:${dotnetVersion} AS build`);
    lines.push(`WORKDIR ${workdir}`);
    lines.push('');
    lines.push('# Copy csproj and restore dependencies');
    lines.push('COPY *.csproj ./');
    lines.push('RUN dotnet restore');
    lines.push('');
    lines.push('# Copy everything else and build');
    lines.push('COPY . ./');
    lines.push('RUN dotnet publish -c Release -o out');
    lines.push('');

    // Runtime stage
    lines.push('# Runtime stage');
    lines.push(`FROM mcr.microsoft.com/dotnet/aspnet:${dotnetVersion}`);
    lines.push(`WORKDIR ${workdir}`);
    lines.push('');
    lines.push('# Copy built application');
    lines.push('COPY --from=build /app/out .');
    lines.push('');

    // Security: Create non-root user
    lines.push('# Create non-root user');
    lines.push('RUN adduser --disabled-password --gecos "" appuser && \\');
    lines.push('    chown -R appuser:appuser /app');
    lines.push('');
    lines.push('USER appuser');
    lines.push('');

    // Expose port
    lines.push(`EXPOSE ${port}`);
    lines.push('');

    // Environment variables
    lines.push(`ENV ASPNETCORE_URLS=http://+:${port}`);
    lines.push('');

    // Health check
    if (includeHealthcheck) {
      lines.push('# Health check');
      lines.push(`HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\`);
      lines.push(`  CMD curl -f http://localhost:${port}/health || exit 1`);
      lines.push('');
    }

    // Start command (will be inferred from DLL name)
    lines.push('ENTRYPOINT ["dotnet", "*.dll"]');

    return lines.join('\n');
  }

  /**
   * Generate Dockerfile for React/Vue projects
   */
  private generateReactVueDockerfile(options: DockerfileOptions): string {
    const {
      nodeVersion = '20',
      workdir = '/app',
      port = 80,
      buildCommand = 'npm run build',
      multiStage = true,
    } = options;

    const lines: string[] = [];

    // Build stage
    lines.push('# Build stage');
    lines.push(`FROM node:${nodeVersion}-alpine AS builder`);
    lines.push('');
    lines.push(`WORKDIR ${workdir}`);
    lines.push('');
    lines.push('# Copy package files');
    lines.push('COPY package*.json ./');
    lines.push('');
    lines.push('# Install dependencies');
    lines.push('RUN npm ci');
    lines.push('');
    lines.push('# Copy source code');
    lines.push('COPY . .');
    lines.push('');
    lines.push('# Build application');
    lines.push(`RUN ${buildCommand}`);
    lines.push('');

    // Production stage with Nginx
    lines.push('# Production stage');
    lines.push('FROM nginx:alpine');
    lines.push('');
    lines.push('# Copy built files');
    const buildDir = options.projectType === 'vue' ? 'dist' : 'build';
    lines.push(`COPY --from=builder /app/${buildDir} /usr/share/nginx/html`);
    lines.push('');
    lines.push('# Copy nginx configuration');
    lines.push('COPY nginx.conf /etc/nginx/conf.d/default.conf');
    lines.push('');
    lines.push(`EXPOSE ${port}`);
    lines.push('');
    lines.push('CMD ["nginx", "-g", "daemon off;"]');

    return lines.join('\n');
  }

  /**
   * Generate Dockerfile for Next.js projects
   */
  private generateNextJsDockerfile(options: DockerfileOptions): string {
    const {
      nodeVersion = '20',
      workdir = '/app',
      port = 3000,
      multiStage = true,
      includeHealthcheck = true,
    } = options;

    const lines: string[] = [];

    // Dependencies stage
    lines.push('# Dependencies stage');
    lines.push(`FROM node:${nodeVersion}-alpine AS deps`);
    lines.push('');
    lines.push(`WORKDIR ${workdir}`);
    lines.push('');
    lines.push('COPY package*.json ./');
    lines.push('RUN npm ci');
    lines.push('');

    // Builder stage
    lines.push('# Builder stage');
    lines.push(`FROM node:${nodeVersion}-alpine AS builder`);
    lines.push('');
    lines.push(`WORKDIR ${workdir}`);
    lines.push('');
    lines.push('COPY --from=deps /app/node_modules ./node_modules');
    lines.push('COPY . .');
    lines.push('');
    lines.push('ENV NEXT_TELEMETRY_DISABLED 1');
    lines.push('');
    lines.push('RUN npm run build');
    lines.push('');

    // Runner stage
    lines.push('# Runner stage');
    lines.push(`FROM node:${nodeVersion}-alpine AS runner`);
    lines.push('');
    lines.push(`WORKDIR ${workdir}`);
    lines.push('');
    lines.push('ENV NODE_ENV production');
    lines.push('ENV NEXT_TELEMETRY_DISABLED 1');
    lines.push('');
    lines.push('# Create user');
    lines.push('RUN addgroup --system --gid 1001 nodejs');
    lines.push('RUN adduser --system --uid 1001 nextjs');
    lines.push('');
    lines.push('COPY --from=builder /app/public ./public');
    lines.push('');
    lines.push('# Set permissions');
    lines.push('RUN mkdir .next');
    lines.push('RUN chown nextjs:nodejs .next');
    lines.push('');
    lines.push('COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./');
    lines.push('COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static');
    lines.push('');
    lines.push('USER nextjs');
    lines.push('');
    lines.push(`EXPOSE ${port}`);
    lines.push('');
    lines.push(`ENV PORT ${port}`);
    lines.push('');

    if (includeHealthcheck) {
      lines.push('HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\');
      lines.push(`  CMD node -e "require('http').get('http://localhost:${port}/', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"`);
      lines.push('');
    }

    lines.push('CMD ["node", "server.js"]');

    return lines.join('\n');
  }

  /**
   * Generate Dockerfile for static sites
   */
  private generateStaticDockerfile(options: DockerfileOptions): string {
    const { port = 80 } = options;

    const lines: string[] = [];

    lines.push('FROM nginx:alpine');
    lines.push('');
    lines.push('# Copy static files');
    lines.push('COPY . /usr/share/nginx/html');
    lines.push('');
    lines.push(`EXPOSE ${port}`);
    lines.push('');
    lines.push('CMD ["nginx", "-g", "daemon off;"]');

    return lines.join('\n');
  }

  /**
   * Generate .dockerignore file
   */
  generateDockerignore(projectType: ProjectType): string {
    const lines: string[] = [
      '# Dependencies',
      'node_modules',
      'venv',
      '__pycache__',
      '*.pyc',
      'bin',
      'obj',
      '',
      '# Build outputs',
      'dist',
      'build',
      '.next',
      'out',
      '',
      '# Environment',
      '.env',
      '.env.local',
      '.env.*.local',
      '',
      '# IDE',
      '.vscode',
      '.idea',
      '*.swp',
      '*.swo',
      '',
      '# Git',
      '.git',
      '.gitignore',
      '',
      '# Testing',
      'coverage',
      '.nyc_output',
      '',
      '# Logs',
      'logs',
      '*.log',
      'npm-debug.log*',
      '',
      '# Docker',
      'Dockerfile',
      'docker-compose.yml',
      '.dockerignore',
      '',
      '# Documentation',
      'README.md',
      'docs',
      '',
      '# CI/CD',
      '.github',
      '.gitlab-ci.yml',
    ];

    return lines.join('\n');
  }
}
