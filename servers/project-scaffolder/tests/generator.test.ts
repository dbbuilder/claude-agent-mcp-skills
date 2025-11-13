/**
 * Generator Tests
 * Tests for ProjectGenerator core functionality
 */

import { ProjectGenerator } from '../src/generator.js';
import { ScaffoldOptions } from '../src/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('ProjectGenerator', () => {
  let generator: ProjectGenerator;
  const testOutputDir = path.join(__dirname, '../test-output');

  beforeEach(() => {
    generator = new ProjectGenerator();
  });

  afterEach(() => {
    // Clean up test output directory
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('scaffold', () => {
    it('should create a new project from template', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {
          description: 'Test project',
          author: 'Test Author',
        },
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.filesCreated.length).toBeGreaterThan(0);
      expect(result.projectPath).toBe(path.join(testOutputDir, 'test-project'));
      expect(fs.existsSync(result.projectPath)).toBe(true);
    });

    it('should fail if directory already exists', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'existing-project',
        outputPath: testOutputDir,
        options: {},
      };

      // Create directory first
      const projectPath = path.join(testOutputDir, 'existing-project');
      fs.mkdirSync(projectPath, { recursive: true });

      const result = await generator.scaffold(options);

      expect(result.success).toBe(false);
      expect(result.error).toContain('already exists');
    });

    it('should handle invalid template', async () => {
      const options: ScaffoldOptions = {
        template: 'invalid-template' as any,
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should initialize git repository by default', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'git-test',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.filesCreated).toContain('.git/');
      expect(fs.existsSync(path.join(result.projectPath, '.git'))).toBe(true);
    });

    it('should skip git initialization when gitInit is false', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'no-git-test',
        outputPath: testOutputDir,
        options: {
          gitInit: false,
        },
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.filesCreated).not.toContain('.git/');
      expect(fs.existsSync(path.join(result.projectPath, '.git'))).toBe(false);
    });

    it('should create all required common files', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'common-files-test',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'README.md'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, '.gitignore'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, '.env.template'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'LICENSE'))).toBe(true);
    });

    it('should include Docker files when requested', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'docker-test',
        outputPath: testOutputDir,
        options: {
          includeDocker: true,
        },
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'Dockerfile'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'docker-compose.yml'))).toBe(true);
    });

    it('should exclude Docker files when not requested', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'no-docker-test',
        outputPath: testOutputDir,
        options: {
          includeDocker: false,
        },
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'Dockerfile'))).toBe(false);
      expect(fs.existsSync(path.join(projectPath, 'docker-compose.yml'))).toBe(false);
    });

    it('should include CI/CD files when requested', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'cicd-test',
        outputPath: testOutputDir,
        options: {
          includeCICD: true,
        },
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, '.github/workflows/ci.yml'))).toBe(true);
    });

    it('should return next steps', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'next-steps-test',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.nextSteps.length).toBeGreaterThan(0);
      expect(result.nextSteps[0]).toContain('cd');
      expect(result.nextSteps.some(step => step.includes('npm install'))).toBe(true);
    });
  });

  describe('variable substitution', () => {
    it('should substitute project name', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'my-custom-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.name).toBe('my-custom-project');
    });

    it('should substitute project description', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {
          description: 'Custom description for testing',
        },
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.description).toBe('Custom description for testing');
    });

    it('should substitute author name', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {
          author: 'John Doe',
        },
      };

      const result = await generator.scaffold(options);
      const license = fs.readFileSync(path.join(result.projectPath, 'LICENSE'), 'utf-8');

      expect(license).toContain('John Doe');
    });

    it('should use current year in LICENSE', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const license = fs.readFileSync(path.join(result.projectPath, 'LICENSE'), 'utf-8');
      const currentYear = new Date().getFullYear();

      expect(license).toContain(String(currentYear));
    });

    it('should use default values when options not provided', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.description).toContain('Generated with Claude Agent SDK');
    });
  });

  describe('file structure validation', () => {
    it('should create nested directories', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'nested-test',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(fs.existsSync(path.join(result.projectPath, 'src/config'))).toBe(true);
    });

    it('should create files with correct permissions', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'permissions-test',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);

      const packageJsonPath = path.join(result.projectPath, 'package.json');
      const stats = fs.statSync(packageJsonPath);

      // File should be readable
      expect(stats.mode & fs.constants.S_IRUSR).toBeTruthy();
    });
  });
});
