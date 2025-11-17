/**
 * Project Analyzer
 * Analyzes project structure to determine type, framework, and requirements
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalysis, ProjectType, DatabaseType } from '../types.js';

export class ProjectAnalyzer {
  /**
   * Analyze a project to determine its type and requirements
   */
  async analyze(projectPath: string): Promise<ProjectAnalysis> {
    const analysis: ProjectAnalysis = {
      projectType: 'nodejs',
      dependencies: [],
      devDependencies: [],
      hasDatabase: false,
      databases: [],
      needsCache: false,
      hasTests: false,
    };

    // Check for package.json (Node.js projects)
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      this.analyzeNodeProject(packageJsonPath, analysis);
    }

    // Check for requirements.txt or pyproject.toml (Python projects)
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const pyprojectPath = path.join(projectPath, 'pyproject.toml');
    if (fs.existsSync(requirementsPath) || fs.existsSync(pyprojectPath)) {
      this.analyzePythonProject(projectPath, analysis);
    }

    // Check for .csproj files (.NET projects)
    const csprojFiles = fs.readdirSync(projectPath).filter(f => f.endsWith('.csproj'));
    if (csprojFiles.length > 0) {
      this.analyzeDotNetProject(path.join(projectPath, csprojFiles[0]), analysis);
    }

    // Detect databases from dependencies
    this.detectDatabases(analysis);

    // Detect common ports
    this.detectPort(projectPath, analysis);

    return analysis;
  }

  /**
   * Analyze Node.js project from package.json
   */
  private analyzeNodeProject(packageJsonPath: string, analysis: ProjectAnalysis): void {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));

    analysis.dependencies = Object.keys(packageJson.dependencies || {});
    analysis.devDependencies = Object.keys(packageJson.devDependencies || {});

    // Detect package manager
    const projectDir = path.dirname(packageJsonPath);
    if (fs.existsSync(path.join(projectDir, 'pnpm-lock.yaml'))) {
      analysis.packageManager = 'pnpm';
    } else if (fs.existsSync(path.join(projectDir, 'yarn.lock'))) {
      analysis.packageManager = 'yarn';
    } else {
      analysis.packageManager = 'npm';
    }

    // Detect TypeScript
    const hasTypeScript =
      analysis.dependencies.includes('typescript') ||
      analysis.devDependencies.includes('typescript') ||
      fs.existsSync(path.join(projectDir, 'tsconfig.json'));

    // Detect framework
    if (analysis.dependencies.includes('next')) {
      analysis.projectType = 'nextjs';
      analysis.framework = 'Next.js';
      analysis.buildCommand = `${analysis.packageManager} run build`;
      analysis.startCommand = `${analysis.packageManager} start`;
      analysis.port = 3000;
    } else if (analysis.dependencies.includes('react')) {
      analysis.projectType = 'react';
      analysis.framework = 'React';
      analysis.buildCommand = `${analysis.packageManager} run build`;
      analysis.startCommand = 'npx serve -s build';
      analysis.port = 3000;
    } else if (analysis.dependencies.includes('vue')) {
      analysis.projectType = 'vue';
      analysis.framework = 'Vue';
      analysis.buildCommand = `${analysis.packageManager} run build`;
      analysis.startCommand = 'npx serve -s dist';
      analysis.port = 3000;
    } else if (analysis.dependencies.includes('express') || analysis.dependencies.includes('fastify')) {
      analysis.projectType = hasTypeScript ? 'nodejs-typescript' : 'nodejs';
      analysis.framework = analysis.dependencies.includes('express') ? 'Express' : 'Fastify';
      analysis.startCommand = hasTypeScript ? 'node dist/index.js' : 'node src/index.js';
      analysis.port = 3000;
    } else {
      analysis.projectType = hasTypeScript ? 'nodejs-typescript' : 'nodejs';
    }

    // Detect build command from scripts
    if (packageJson.scripts) {
      if (packageJson.scripts.build) {
        analysis.buildCommand = `${analysis.packageManager} run build`;
      }
      if (packageJson.scripts.start) {
        analysis.startCommand = `${analysis.packageManager} start`;
      }
      if (packageJson.scripts.test) {
        analysis.hasTests = true;
        analysis.testCommand = `${analysis.packageManager} test`;
      }
    }

    // Detect runtime
    analysis.runtime = 'node:20-alpine';
  }

  /**
   * Analyze Python project
   */
  private analyzePythonProject(projectPath: string, analysis: ProjectAnalysis): void {
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const pyprojectPath = path.join(projectPath, 'pyproject.toml');

    let dependencies: string[] = [];

    if (fs.existsSync(requirementsPath)) {
      const requirements = fs.readFileSync(requirementsPath, 'utf-8');
      dependencies = requirements
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.startsWith('#'))
        .map(line => line.split('==')[0].split('>=')[0].split('<=')[0].trim());

      analysis.packageManager = 'pip';
    }

    if (fs.existsSync(pyprojectPath)) {
      analysis.packageManager = 'poetry';
    }

    analysis.dependencies = dependencies;

    // Detect framework
    if (dependencies.includes('fastapi')) {
      analysis.projectType = 'python-fastapi';
      analysis.framework = 'FastAPI';
      analysis.startCommand = 'uvicorn main:app --host 0.0.0.0 --port 8000';
      analysis.port = 8000;
    } else if (dependencies.includes('django')) {
      analysis.projectType = 'python-django';
      analysis.framework = 'Django';
      analysis.startCommand = 'python manage.py runserver 0.0.0.0:8000';
      analysis.port = 8000;
    }

    // Detect tests
    if (dependencies.includes('pytest')) {
      analysis.hasTests = true;
      analysis.testCommand = 'pytest';
    }

    analysis.runtime = 'python:3.12-slim';
  }

  /**
   * Analyze .NET project
   */
  private analyzeDotNetProject(csprojPath: string, analysis: ProjectAnalysis): void {
    const csproj = fs.readFileSync(csprojPath, 'utf-8');

    analysis.projectType = 'dotnet-aspnet';
    analysis.framework = 'ASP.NET Core';
    analysis.packageManager = 'dotnet';
    analysis.runtime = 'mcr.microsoft.com/dotnet/aspnet:8.0';

    // Parse project name
    const projectName = path.basename(csprojPath, '.csproj');

    analysis.buildCommand = 'dotnet build --configuration Release';
    analysis.startCommand = `dotnet ${projectName}.dll`;
    analysis.port = 8080;

    // Check for test project
    if (csproj.includes('Microsoft.NET.Test.Sdk')) {
      analysis.hasTests = true;
      analysis.testCommand = 'dotnet test';
    }
  }

  /**
   * Detect databases from dependencies
   */
  private detectDatabases(analysis: ProjectAnalysis): void {
    const allDeps = [...analysis.dependencies, ...analysis.devDependencies].join(' ').toLowerCase();

    const databases: DatabaseType[] = [];

    if (allDeps.includes('pg') || allDeps.includes('postgres') || allDeps.includes('psycopg')) {
      databases.push('postgresql');
    }
    if (allDeps.includes('mysql')) {
      databases.push('mysql');
    }
    if (allDeps.includes('mongodb') || allDeps.includes('mongoose')) {
      databases.push('mongodb');
    }
    if (allDeps.includes('mssql') || allDeps.includes('sqlserver')) {
      databases.push('sqlserver');
    }
    if (allDeps.includes('redis') || allDeps.includes('ioredis')) {
      databases.push('redis');
      analysis.needsCache = true;
    }

    analysis.databases = databases;
    analysis.hasDatabase = databases.length > 0;
  }

  /**
   * Detect port from common config files
   */
  private detectPort(projectPath: string, analysis: ProjectAnalysis): void {
    // Check for .env files
    const envPaths = ['.env', '.env.example', '.env.template'];

    for (const envFile of envPaths) {
      const envPath = path.join(projectPath, envFile);
      if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf-8');
        const portMatch = envContent.match(/PORT=(\d+)/);
        if (portMatch) {
          analysis.port = parseInt(portMatch[1]);
          return;
        }
      }
    }

    // Check common source files
    const sourcePatterns = ['src/index.ts', 'src/index.js', 'src/main.ts', 'src/main.js', 'main.py', 'app.py'];

    for (const pattern of sourcePatterns) {
      const filePath = path.join(projectPath, pattern);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const portMatch = content.match(/port[:\s=]+(\d+)/i);
        if (portMatch) {
          analysis.port = parseInt(portMatch[1]);
          return;
        }
      }
    }
  }
}
