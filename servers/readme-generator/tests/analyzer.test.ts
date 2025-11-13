/**
 * Analyzer Tests
 * Tests for ProjectAnalyzer functionality
 */

import { ProjectAnalyzer } from '../src/analyzer.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ProjectAnalyzer', () => {
  let analyzer: ProjectAnalyzer;
  const testProjectsDir = path.join(__dirname, '../test-projects');

  beforeAll(() => {
    analyzer = new ProjectAnalyzer();

    // Create test projects directory
    if (!fs.existsSync(testProjectsDir)) {
      fs.mkdirSync(testProjectsDir, { recursive: true });
    }
  });

  afterAll(() => {
    // Clean up test projects
    if (fs.existsSync(testProjectsDir)) {
      fs.rmSync(testProjectsDir, { recursive: true, force: true });
    }
  });

  describe('Node.js Project Detection', () => {
    it('should detect Node.js/TypeScript project', async () => {
      const projectPath = path.join(testProjectsDir, 'node-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'test-project',
          dependencies: {
            express: '^4.18.0',
            pg: '^8.11.0',
          },
          devDependencies: {
            typescript: '^5.3.0',
            jest: '^29.7.0',
            eslint: '^8.56.0',
          },
        })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.projectName).toBe('node-project');
      expect(analysis.techStack.languages).toContain('JavaScript');
      expect(analysis.techStack.languages).toContain('TypeScript');
      expect(analysis.techStack.frameworks).toContain('Express');
      expect(analysis.techStack.databases).toContain('PostgreSQL');
      expect(analysis.techStack.tools).toContain('Testing');
      expect(analysis.techStack.tools).toContain('ESLint');
      expect(analysis.techStack.packageManager).toBe('npm');
    });

    it('should detect React project', async () => {
      const projectPath = path.join(testProjectsDir, 'react-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'react-app',
          dependencies: {
            react: '^18.2.0',
            'react-dom': '^18.2.0',
          },
        })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.frameworks).toContain('React');
    });

    it('should detect Next.js project', async () => {
      const projectPath = path.join(testProjectsDir, 'nextjs-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'nextjs-app',
          dependencies: {
            next: '^14.0.0',
            react: '^18.2.0',
          },
        })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.frameworks).toContain('Next.js');
      expect(analysis.techStack.frameworks).toContain('React');
    });

    it('should detect Vue project', async () => {
      const projectPath = path.join(testProjectsDir, 'vue-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'vue-app',
          dependencies: {
            vue: '^3.4.0',
          },
        })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.frameworks).toContain('Vue');
    });

    it('should detect MongoDB database', async () => {
      const projectPath = path.join(testProjectsDir, 'mongo-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'mongo-app',
          dependencies: {
            mongoose: '^8.0.0',
          },
        })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.databases).toContain('MongoDB');
    });
  });

  describe('Python Project Detection', () => {
    it('should detect Python project with requirements.txt', async () => {
      const projectPath = path.join(testProjectsDir, 'python-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'requirements.txt'),
        'fastapi==0.109.0\npsycopg2==2.9.0\npytest==7.4.0'
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.languages).toContain('Python');
      expect(analysis.techStack.frameworks).toContain('FastAPI');
      expect(analysis.techStack.databases).toContain('PostgreSQL');
      expect(analysis.techStack.tools).toContain('Pytest');
      expect(analysis.techStack.packageManager).toBe('pip');
    });

    it('should detect Python project with pyproject.toml', async () => {
      const projectPath = path.join(testProjectsDir, 'poetry-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'pyproject.toml'),
        '[tool.poetry]\nname = "my-project"'
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.languages).toContain('Python');
      expect(analysis.techStack.packageManager).toBe('poetry');
    });

    it('should detect Django project', async () => {
      const projectPath = path.join(testProjectsDir, 'django-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'requirements.txt'),
        'django==5.0.0\npymongo==4.6.0'
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.frameworks).toContain('Django');
      expect(analysis.techStack.databases).toContain('MongoDB');
    });
  });

  describe('.NET Project Detection', () => {
    it('should detect .NET project', async () => {
      const projectPath = path.join(testProjectsDir, 'dotnet-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'TestProject.csproj'),
        `<Project Sdk="Microsoft.NET.Sdk.Web">
          <PropertyGroup>
            <TargetFramework>net8.0</TargetFramework>
          </PropertyGroup>
          <ItemGroup>
            <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
            <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
            <PackageReference Include="xunit" Version="2.6.0" />
          </ItemGroup>
        </Project>`
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.techStack.languages).toContain('C#');
      expect(analysis.techStack.frameworks).toContain('ASP.NET Core');
      expect(analysis.techStack.frameworks).toContain('Entity Framework Core');
      expect(analysis.techStack.tools).toContain('Testing');
      expect(analysis.techStack.packageManager).toBe('dotnet');
    });
  });

  describe('Project Structure Analysis', () => {
    it('should analyze project structure', async () => {
      const projectPath = path.join(testProjectsDir, 'structure-project');
      fs.mkdirSync(projectPath, { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'src'));
      fs.mkdirSync(path.join(projectPath, 'tests'));
      fs.mkdirSync(path.join(projectPath, 'docs'));

      fs.writeFileSync(path.join(projectPath, 'index.ts'), '// main file');
      fs.writeFileSync(path.join(projectPath, 'package.json'), '{}');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.structure.directories).toContain('src');
      expect(analysis.structure.directories).toContain('tests');
      expect(analysis.structure.directories).toContain('docs');
      expect(analysis.structure.mainEntryPoint).toBe('index.ts');
      expect(analysis.structure.totalFiles).toBeGreaterThan(0);
    });

    it('should ignore common directories', async () => {
      const projectPath = path.join(testProjectsDir, 'ignore-dirs-project');
      fs.mkdirSync(projectPath, { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'node_modules'));
      fs.mkdirSync(path.join(projectPath, 'dist'));
      fs.mkdirSync(path.join(projectPath, '.git'));
      fs.mkdirSync(path.join(projectPath, 'src'));

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.structure.directories).not.toContain('node_modules');
      expect(analysis.structure.directories).not.toContain('dist');
      expect(analysis.structure.directories).not.toContain('.git');
      expect(analysis.structure.directories).toContain('src');
    });

    it('should detect main entry points', async () => {
      const projectPath = path.join(testProjectsDir, 'entry-point-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'server.ts'), '// server');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.structure.mainEntryPoint).toBe('server.ts');
    });
  });

  describe('Scripts Extraction', () => {
    it('should extract scripts from package.json', async () => {
      const projectPath = path.join(testProjectsDir, 'scripts-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'test',
          scripts: {
            dev: 'tsx src/index.ts',
            build: 'tsc',
            test: 'jest',
            lint: 'eslint .',
          },
        })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.scripts.dev).toBe('tsx src/index.ts');
      expect(analysis.scripts.build).toBe('tsc');
      expect(analysis.scripts.test).toBe('jest');
      expect(analysis.scripts.lint).toBe('eslint .');
    });

    it('should return empty object when package.json has no scripts', async () => {
      const projectPath = path.join(testProjectsDir, 'no-scripts-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({ name: 'test' })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.scripts).toEqual({});
    });
  });

  describe('Environment Variables Detection', () => {
    it('should detect env vars from .env.template', async () => {
      const projectPath = path.join(testProjectsDir, 'env-template-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, '.env.template'),
        `# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mydb

# API Keys
API_KEY=your-key-here`
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.envVars.length).toBe(4);
      expect(analysis.envVars.find(v => v.name === 'DB_HOST')).toBeDefined();
      expect(analysis.envVars.find(v => v.name === 'DB_PORT')).toBeDefined();
      expect(analysis.envVars.find(v => v.name === 'API_KEY')).toBeDefined();
    });

    it('should prefer .env.template over .env.example', async () => {
      const projectPath = path.join(testProjectsDir, 'env-preference-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, '.env.template'),
        'VAR1=value1'
      );

      fs.writeFileSync(
        path.join(projectPath, '.env.example'),
        'VAR2=value2'
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.envVars.find(v => v.name === 'VAR1')).toBeDefined();
      expect(analysis.envVars.find(v => v.name === 'VAR2')).toBeUndefined();
    });

    it('should handle empty env files', async () => {
      const projectPath = path.join(testProjectsDir, 'empty-env-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, '.env.template'), '');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.envVars).toEqual([]);
    });
  });

  describe('Test Detection', () => {
    it('should detect test files', async () => {
      const projectPath = path.join(testProjectsDir, 'test-detection-project');
      fs.mkdirSync(projectPath, { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'tests'));

      fs.writeFileSync(path.join(projectPath, 'tests', 'example.test.ts'), '// test');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasTests).toBe(true);
    });

    it('should detect spec files', async () => {
      const projectPath = path.join(testProjectsDir, 'spec-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'app.spec.ts'), '// spec');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasTests).toBe(true);
    });

    it('should return false when no tests found', async () => {
      const projectPath = path.join(testProjectsDir, 'no-test-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'index.ts'), '// code');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasTests).toBe(false);
    });
  });

  describe('Docker Detection', () => {
    it('should detect Dockerfile', async () => {
      const projectPath = path.join(testProjectsDir, 'dockerfile-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'Dockerfile'), 'FROM node:20');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasDocker).toBe(true);
    });

    it('should detect docker-compose.yml', async () => {
      const projectPath = path.join(testProjectsDir, 'compose-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), 'version: "3.8"');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasDocker).toBe(true);
    });

    it('should return false when no Docker files', async () => {
      const projectPath = path.join(testProjectsDir, 'no-docker-project');
      fs.mkdirSync(projectPath, { recursive: true });

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasDocker).toBe(false);
    });
  });

  describe('CI/CD Detection', () => {
    it('should detect GitHub Actions', async () => {
      const projectPath = path.join(testProjectsDir, 'github-actions-project');
      fs.mkdirSync(path.join(projectPath, '.github', 'workflows'), { recursive: true });

      fs.writeFileSync(path.join(projectPath, '.github', 'workflows', 'ci.yml'), 'name: CI');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasCICD).toBe(true);
    });

    it('should detect GitLab CI', async () => {
      const projectPath = path.join(testProjectsDir, 'gitlab-ci-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, '.gitlab-ci.yml'), 'stages:\n  - build');

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasCICD).toBe(true);
    });

    it('should return false when no CI/CD', async () => {
      const projectPath = path.join(testProjectsDir, 'no-cicd-project');
      fs.mkdirSync(projectPath, { recursive: true });

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.hasCICD).toBe(false);
    });
  });

  describe('License Detection', () => {
    it('should detect MIT license from LICENSE file', async () => {
      const projectPath = path.join(testProjectsDir, 'mit-license-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'LICENSE'),
        'MIT License\n\nCopyright (c) 2025...'
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.license).toBe('MIT');
    });

    it('should detect Apache license', async () => {
      const projectPath = path.join(testProjectsDir, 'apache-license-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'LICENSE'),
        'Apache License\n\nVersion 2.0...'
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.license).toBe('Apache-2.0');
    });

    it('should detect license from package.json', async () => {
      const projectPath = path.join(testProjectsDir, 'package-license-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({ name: 'test', license: 'ISC' })
      );

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.license).toBe('ISC');
    });

    it('should return undefined when no license found', async () => {
      const projectPath = path.join(testProjectsDir, 'no-license-project');
      fs.mkdirSync(projectPath, { recursive: true });

      const analysis = await analyzer.analyze(projectPath);

      expect(analysis.license).toBeUndefined();
    });
  });
});
