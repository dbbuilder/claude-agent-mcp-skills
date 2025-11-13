/**
 * Generator Tests
 * Tests for ReadmeGenerator functionality
 */

import { ReadmeGenerator } from '../src/generator.js';
import { GenerateOptions } from '../src/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ReadmeGenerator', () => {
  let generator: ReadmeGenerator;
  const testProjectsDir = path.join(__dirname, '../test-projects');

  beforeAll(() => {
    generator = new ReadmeGenerator();

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

  describe('Basic README Generation', () => {
    it('should generate README for Node.js project', async () => {
      const projectPath = path.join(testProjectsDir, 'basic-node-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'basic-test-project',
          version: '1.0.0',
          dependencies: {
            express: '^4.18.0',
          },
          scripts: {
            dev: 'tsx src/index.ts',
            build: 'tsc',
            test: 'jest',
          },
        })
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.content).toContain('# basic-node-project'); // Uses directory name
      expect(result.content).toContain('Express');
      expect(result.content).toContain('## Getting Started');
      expect(result.content).toContain('npm install');
      expect(fs.existsSync(result.filePath)).toBe(true);
    });

    it('should generate README for Python project', async () => {
      const projectPath = path.join(testProjectsDir, 'python-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'requirements.txt'),
        'fastapi==0.109.0\nuvicorn==0.27.0'
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.content).toContain('FastAPI');
      expect(result.content).toContain('Python');
      expect(result.content).toContain('pip install');
    });

    it('should generate README for .NET project', async () => {
      const projectPath = path.join(testProjectsDir, 'dotnet-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'TestApp.csproj'),
        `<Project Sdk="Microsoft.NET.Sdk.Web">
          <PropertyGroup><TargetFramework>net8.0</TargetFramework></PropertyGroup>
          <ItemGroup>
            <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
          </ItemGroup>
        </Project>`
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.content).toContain('C#');
      expect(result.content).toContain('ASP.NET Core');
      expect(result.content).toContain('dotnet restore');
    });
  });

  describe('Custom Options', () => {
    it('should use custom title', async () => {
      const projectPath = path.join(testProjectsDir, 'custom-title-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');

      const options: GenerateOptions = {
        projectPath,
        options: {
          title: 'My Awesome Project',
        },
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('# My Awesome Project');
      expect(result.content).not.toContain('# test');
    });

    it('should use custom description', async () => {
      const projectPath = path.join(testProjectsDir, 'custom-desc-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');

      const options: GenerateOptions = {
        projectPath,
        options: {
          description: 'This is a custom description for testing purposes.',
        },
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('This is a custom description for testing purposes.');
    });

    it('should allow disabling badges', async () => {
      const projectPath = path.join(testProjectsDir, 'no-badges-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({ name: 'test', license: 'MIT' })
      );

      const options: GenerateOptions = {
        projectPath,
        options: {
          includeBadges: false,
        },
      };

      const result = await generator.generate(options);

      expect(result.content).not.toContain('![License]');
    });

    it('should allow disabling structure section', async () => {
      const projectPath = path.join(testProjectsDir, 'no-structure-project');
      fs.mkdirSync(projectPath, { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'src'));

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');

      const options: GenerateOptions = {
        projectPath,
        options: {
          includeStructure: false,
        },
      };

      const result = await generator.generate(options);

      expect(result.content).not.toContain('## Project Structure');
    });

    it('should use custom output path', async () => {
      const projectPath = path.join(testProjectsDir, 'custom-output-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');

      const customOutputPath = path.join(projectPath, 'CUSTOM-README.md');

      const options: GenerateOptions = {
        projectPath,
        options: {
          outputPath: customOutputPath,
        },
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.filePath).toBe(customOutputPath);
      expect(fs.existsSync(customOutputPath)).toBe(true);
    });
  });

  describe('Overwrite Protection', () => {
    it('should not overwrite existing README by default', async () => {
      const projectPath = path.join(testProjectsDir, 'existing-readme-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');
      fs.writeFileSync(path.join(projectPath, 'README.md'), '# Existing README');

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('File exists');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('already exists');

      // Original README should remain
      const existingContent = fs.readFileSync(path.join(projectPath, 'README.md'), 'utf-8');
      expect(existingContent).toBe('# Existing README');
    });

    it('should overwrite when overwrite option is true', async () => {
      const projectPath = path.join(testProjectsDir, 'overwrite-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"new-test"}');
      fs.writeFileSync(path.join(projectPath, 'README.md'), '# Old Content');

      const options: GenerateOptions = {
        projectPath,
        options: {
          overwrite: true,
        },
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(true);
      expect(result.warnings.length).toBe(0);

      const newContent = fs.readFileSync(path.join(projectPath, 'README.md'), 'utf-8');
      expect(newContent).toContain('# overwrite-project');
      expect(newContent).not.toContain('Old Content');
    });
  });

  describe('Content Sections', () => {
    it('should include badges when license is present', async () => {
      const projectPath = path.join(testProjectsDir, 'badge-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({ name: 'test', license: 'MIT' })
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('![License](https://img.shields.io/badge/license-MIT-blue.svg)');
    });

    it('should include features section', async () => {
      const projectPath = path.join(testProjectsDir, 'features-project');
      fs.mkdirSync(projectPath, { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'tests'));

      fs.writeFileSync(path.join(projectPath, 'tests', 'test.spec.ts'), '// test');
      fs.writeFileSync(path.join(projectPath, 'Dockerfile'), 'FROM node:20');
      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'test',
          dependencies: {
            express: '^4.18.0',
            pg: '^8.11.0',
          },
        })
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('## Features');
      expect(result.content).toContain('Built with Express');
      expect(result.content).toContain('PostgreSQL database integration');
      expect(result.content).toContain('Comprehensive test coverage');
      expect(result.content).toContain('Docker support');
    });

    it('should include tech stack section', async () => {
      const projectPath = path.join(testProjectsDir, 'tech-stack-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'test',
          dependencies: {
            next: '^14.0.0',
            react: '^18.2.0',
            mongodb: '^6.3.0',
          },
          devDependencies: {
            typescript: '^5.3.0',
            eslint: '^8.56.0',
          },
        })
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('## Tech Stack');
      expect(result.content).toContain('**Languages:** JavaScript, TypeScript');
      expect(result.content).toContain('**Frameworks:** Next.js, React');
      expect(result.content).toContain('**Databases:** MongoDB');
      expect(result.content).toContain('**Tools:**');
    });

    it('should include environment variables section', async () => {
      const projectPath = path.join(testProjectsDir, 'env-vars-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');
      fs.writeFileSync(
        path.join(projectPath, '.env.template'),
        `DB_HOST=localhost
DB_PORT=5432
API_KEY=your-key-here`
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('## Environment Variables');
      expect(result.content).toContain('`DB_HOST`');
      expect(result.content).toContain('`DB_PORT`');
      expect(result.content).toContain('`API_KEY`');
    });

    it('should include testing section when tests exist', async () => {
      const projectPath = path.join(testProjectsDir, 'testing-section-project');
      fs.mkdirSync(projectPath, { recursive: true });
      fs.mkdirSync(path.join(projectPath, 'tests'));

      fs.writeFileSync(path.join(projectPath, 'tests', 'app.test.ts'), '// test');
      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({
          name: 'test',
          scripts: {
            test: 'jest',
          },
        })
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('## Testing');
      expect(result.content).toContain('npm test');
    });

    it('should include deployment section when Docker exists', async () => {
      const projectPath = path.join(testProjectsDir, 'deployment-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');
      fs.writeFileSync(path.join(projectPath, 'docker-compose.yml'), 'version: "3.8"');

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('## Deployment');
      expect(result.content).toContain('### Docker');
      expect(result.content).toContain('docker-compose up');
    });

    it('should include CI/CD info when workflows exist', async () => {
      const projectPath = path.join(testProjectsDir, 'cicd-project');
      fs.mkdirSync(path.join(projectPath, '.github', 'workflows'), { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');
      fs.writeFileSync(path.join(projectPath, '.github', 'workflows', 'ci.yml'), 'name: CI');

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('## Deployment');
      expect(result.content).toContain('### CI/CD');
      expect(result.content).toContain('.github/workflows/');
    });

    it('should include license section', async () => {
      const projectPath = path.join(testProjectsDir, 'license-section-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(
        path.join(projectPath, 'package.json'),
        JSON.stringify({ name: 'test', license: 'Apache-2.0' })
      );

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.content).toContain('## License');
      expect(result.content).toContain('Apache-2.0');
    });
  });

  describe('Error Handling', () => {
    it('should handle non-existent project path', async () => {
      const options: GenerateOptions = {
        projectPath: '/non/existent/path',
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should handle invalid package.json gracefully', async () => {
      const projectPath = path.join(testProjectsDir, 'invalid-json-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), 'invalid json{');

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      // Should still generate README even with invalid package.json
      expect(result.success).toBe(true);
    });
  });

  describe('Section List', () => {
    it('should return list of included sections', async () => {
      const projectPath = path.join(testProjectsDir, 'sections-list-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');

      const options: GenerateOptions = {
        projectPath,
        options: {},
      };

      const result = await generator.generate(options);

      expect(result.sections).toContain('Title');
      expect(result.sections).toContain('Badges');
      expect(result.sections).toContain('Description');
      expect(result.sections).toContain('Features');
      expect(result.sections).toContain('Tech Stack');
      expect(result.sections).toContain('Getting Started');
    });

    it('should exclude badges from sections when disabled', async () => {
      const projectPath = path.join(testProjectsDir, 'no-badges-sections-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{"name":"test"}');

      const options: GenerateOptions = {
        projectPath,
        options: {
          includeBadges: false,
        },
      };

      const result = await generator.generate(options);

      expect(result.sections).not.toContain('Badges');
    });
  });
});
