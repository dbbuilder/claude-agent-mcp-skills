/**
 * Project Analyzer
 * Analyzes project structure and extracts metadata
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ProjectAnalysis, TechStack, ProjectStructure, EnvVariable, ConfigFile } from './types.js';

export class ProjectAnalyzer {
  /**
   * Analyze a project directory
   */
  async analyze(projectPath: string): Promise<ProjectAnalysis> {
    const projectName = path.basename(projectPath);

    const [techStack, structure, scripts, envVars, configuration] = await Promise.all([
      this.detectTechStack(projectPath),
      this.analyzeStructure(projectPath),
      this.extractScripts(projectPath),
      this.findEnvVariables(projectPath),
      this.findConfigFiles(projectPath),
    ]);

    const hasTests = await this.hasTests(projectPath);
    const hasDocker = await this.hasDocker(projectPath);
    const hasCICD = await this.hasCICD(projectPath);
    const license = await this.detectLicense(projectPath);

    return {
      projectPath,
      projectName,
      techStack,
      structure,
      scripts,
      envVars,
      configuration,
      hasTests,
      hasDocker,
      hasCICD,
      license,
    };
  }

  /**
   * Detect tech stack from package.json, requirements.txt, etc.
   */
  private async detectTechStack(projectPath: string): Promise<TechStack> {
    const languages: string[] = [];
    const frameworks: string[] = [];
    const databases: string[] = [];
    const tools: string[] = [];
    let packageManager: TechStack['packageManager'] = null;

    // Check for Node.js project
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      languages.push('JavaScript', 'TypeScript');
      packageManager = 'npm';

      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

        // Detect frameworks
        if (deps.express) frameworks.push('Express');
        if (deps.next) frameworks.push('Next.js');
        if (deps.react) frameworks.push('React');
        if (deps.vue) frameworks.push('Vue');
        if (deps.fastify) frameworks.push('Fastify');
        if (deps['@nestjs/core']) frameworks.push('NestJS');

        // Detect databases
        if (deps.pg || deps.postgres) databases.push('PostgreSQL');
        if (deps.mysql2 || deps.mysql) databases.push('MySQL');
        if (deps.mongodb || deps.mongoose) databases.push('MongoDB');
        if (deps.mssql) databases.push('SQL Server');
        if (deps.sqlite3 || deps['better-sqlite3']) databases.push('SQLite');

        // Detect tools
        if (deps.jest || deps.vitest) tools.push('Testing');
        if (deps.eslint) tools.push('ESLint');
        if (deps.prettier) tools.push('Prettier');
        if (deps.typescript) tools.push('TypeScript');
      } catch (error) {
        // Invalid package.json, skip
      }
    }

    // Check for Python project
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    const pyprojectPath = path.join(projectPath, 'pyproject.toml');
    if (fs.existsSync(requirementsPath) || fs.existsSync(pyprojectPath)) {
      languages.push('Python');
      packageManager = fs.existsSync(pyprojectPath) ? 'poetry' : 'pip';

      if (fs.existsSync(requirementsPath)) {
        const requirements = fs.readFileSync(requirementsPath, 'utf-8');
        if (requirements.includes('fastapi')) frameworks.push('FastAPI');
        if (requirements.includes('django')) frameworks.push('Django');
        if (requirements.includes('flask')) frameworks.push('Flask');
        if (requirements.includes('psycopg2')) databases.push('PostgreSQL');
        if (requirements.includes('pymongo')) databases.push('MongoDB');
        if (requirements.includes('pytest')) tools.push('Pytest');
      }
    }

    // Check for .NET project
    const csprojFiles = await glob('**/*.csproj', { cwd: projectPath, ignore: ['**/node_modules/**', '**/bin/**', '**/obj/**'] });
    const slnFiles = await glob('**/*.sln', { cwd: projectPath });
    if (csprojFiles.length > 0 || slnFiles.length > 0) {
      languages.push('C#');
      packageManager = 'dotnet';

      // Check for ASP.NET Core
      if (csprojFiles.length > 0) {
        const csproj = fs.readFileSync(path.join(projectPath, csprojFiles[0]), 'utf-8');
        if (csproj.includes('Microsoft.AspNetCore')) frameworks.push('ASP.NET Core');
        if (csproj.includes('Microsoft.EntityFrameworkCore')) frameworks.push('Entity Framework Core');
        if (csproj.includes('xunit') || csproj.includes('NUnit')) tools.push('Testing');
      }
    }

    // Check for Go project
    if (fs.existsSync(path.join(projectPath, 'go.mod'))) {
      languages.push('Go');
      packageManager = 'go';
    }

    // Check for Rust project
    if (fs.existsSync(path.join(projectPath, 'Cargo.toml'))) {
      languages.push('Rust');
      packageManager = 'cargo';
    }

    return {
      languages,
      frameworks,
      databases,
      tools,
      packageManager,
    };
  }

  /**
   * Analyze project structure
   */
  private async analyzeStructure(projectPath: string): Promise<ProjectStructure> {
    const directories: string[] = [];
    const fileTypes: Record<string, number> = {};
    let totalFiles = 0;
    let mainEntryPoint: string | undefined;

    const entries = fs.readdirSync(projectPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
        continue;
      }

      if (entry.isDirectory()) {
        directories.push(entry.name);
      } else {
        totalFiles++;
        const ext = path.extname(entry.name);
        fileTypes[ext] = (fileTypes[ext] || 0) + 1;

        // Detect main entry point
        if (['index.ts', 'index.js', 'main.ts', 'main.js', 'app.ts', 'app.js', 'server.ts', 'server.js'].includes(entry.name)) {
          if (!mainEntryPoint) {
            mainEntryPoint = entry.name;
          }
        }
      }
    }

    return {
      directories,
      fileTypes,
      totalFiles,
      mainEntryPoint,
    };
  }

  /**
   * Extract scripts from package.json
   */
  private async extractScripts(projectPath: string): Promise<Record<string, string>> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      return {};
    }

    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
      return packageJson.scripts || {};
    } catch (error) {
      return {};
    }
  }

  /**
   * Find environment variables from .env.template or code
   */
  private async findEnvVariables(projectPath: string): Promise<EnvVariable[]> {
    const envVars: EnvVariable[] = [];
    const envTemplatePath = path.join(projectPath, '.env.template');
    const envExamplePath = path.join(projectPath, '.env.example');

    const templatePath = fs.existsSync(envTemplatePath)
      ? envTemplatePath
      : fs.existsSync(envExamplePath)
      ? envExamplePath
      : null;

    if (templatePath) {
      const content = fs.readFileSync(templatePath, 'utf-8');
      const lines = content.split('\n');

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;

        const match = trimmed.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (match) {
          const [, name, value] = match;
          envVars.push({
            name,
            required: true,
            defaultValue: value || undefined,
            example: value || undefined,
          });
        }
      }
    }

    return envVars;
  }

  /**
   * Find configuration files
   */
  private async findConfigFiles(projectPath: string): Promise<ConfigFile[]> {
    const configFiles: ConfigFile[] = [];

    const configPatterns = [
      { file: 'tsconfig.json', type: 'TypeScript', purpose: 'TypeScript compiler configuration' },
      { file: 'jest.config.js', type: 'Testing', purpose: 'Jest test configuration' },
      { file: 'vitest.config.ts', type: 'Testing', purpose: 'Vitest test configuration' },
      { file: '.eslintrc*', type: 'Linting', purpose: 'ESLint configuration' },
      { file: '.prettierrc*', type: 'Formatting', purpose: 'Prettier configuration' },
      { file: 'docker-compose.yml', type: 'Docker', purpose: 'Docker Compose configuration' },
      { file: 'Dockerfile', type: 'Docker', purpose: 'Docker container configuration' },
    ];

    for (const pattern of configPatterns) {
      const files = await glob(pattern.file, { cwd: projectPath });
      for (const file of files) {
        configFiles.push({
          path: file,
          type: pattern.type,
          purpose: pattern.purpose,
        });
      }
    }

    return configFiles;
  }

  /**
   * Check if project has tests
   */
  private async hasTests(projectPath: string): Promise<boolean> {
    const testPatterns = ['**/*.test.ts', '**/*.test.js', '**/*.spec.ts', '**/*.spec.js', '**/tests/**', '**/test/**'];
    for (const pattern of testPatterns) {
      const files = await glob(pattern, { cwd: projectPath, ignore: ['**/node_modules/**'] });
      if (files.length > 0) return true;
    }
    return false;
  }

  /**
   * Check if project has Docker
   */
  private async hasDocker(projectPath: string): Promise<boolean> {
    return fs.existsSync(path.join(projectPath, 'Dockerfile')) || fs.existsSync(path.join(projectPath, 'docker-compose.yml'));
  }

  /**
   * Check if project has CI/CD
   */
  private async hasCICD(projectPath: string): Promise<boolean> {
    const cicdPaths = ['.github/workflows', '.gitlab-ci.yml', '.circleci', 'Jenkinsfile'];
    for (const ciPath of cicdPaths) {
      if (fs.existsSync(path.join(projectPath, ciPath))) return true;
    }
    return false;
  }

  /**
   * Detect license
   */
  private async detectLicense(projectPath: string): Promise<string | undefined> {
    const licensePath = path.join(projectPath, 'LICENSE');
    if (fs.existsSync(licensePath)) {
      const content = fs.readFileSync(licensePath, 'utf-8');
      if (content.includes('MIT License')) return 'MIT';
      if (content.includes('Apache License')) return 'Apache-2.0';
      if (content.includes('GNU General Public License')) return 'GPL-3.0';
      if (content.includes('BSD')) return 'BSD-3-Clause';
    }

    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        return packageJson.license;
      } catch (error) {
        // Ignore
      }
    }

    return undefined;
  }
}
