/**
 * Variable Substitution Tests
 * Tests for template variable replacement functionality
 */

import { ProjectGenerator } from '../src/generator.js';
import { ScaffoldOptions } from '../src/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Variable Substitution', () => {
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

  describe('Project Name Substitution', () => {
    it('should substitute projectName in package.json', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'my-awesome-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.name).toBe('my-awesome-project');
    });

    it('should substitute projectName in README.md', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-readme-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const readme = fs.readFileSync(path.join(result.projectPath, 'README.md'), 'utf-8');

      expect(readme).toContain('# test-readme-project');
    });

    it('should substitute projectName in .env.template', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-env-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const envTemplate = fs.readFileSync(path.join(result.projectPath, '.env.template'), 'utf-8');

      expect(envTemplate).toContain('DB_NAME=test-env-project');
    });

    it('should substitute projectName in source files', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-source-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const indexTs = fs.readFileSync(path.join(result.projectPath, 'src/index.ts'), 'utf-8');

      expect(indexTs).toContain('test-source-project');
    });

    it('should handle special characters in project name', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project-123',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      expect(result.success).toBe(true);

      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );
      expect(packageJson.name).toBe('test-project-123');
    });

    it('should sanitize project name for .NET projects', async () => {
      const options: ScaffoldOptions = {
        template: 'dotnet-webapi',
        projectName: 'test-dotnet-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      expect(result.success).toBe(true);

      // .NET project name should have hyphens removed
      const csprojFiles = fs.readdirSync(result.projectPath).filter(f => f.endsWith('.csproj'));
      expect(csprojFiles.length).toBe(1);
      expect(csprojFiles[0]).toBe('testdotnetproject.csproj');
    });
  });

  describe('Description Substitution', () => {
    it('should substitute custom description', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {
          description: 'My custom application description',
        },
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.description).toBe('My custom application description');
    });

    it('should use default description when not provided', async () => {
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

    it('should substitute description in README.md', async () => {
      const options: ScaffoldOptions = {
        template: 'vue3-frontend',
        projectName: 'test-vue',
        outputPath: testOutputDir,
        options: {
          description: 'Vue 3 application for testing',
        },
      };

      const result = await generator.scaffold(options);
      const readme = fs.readFileSync(path.join(result.projectPath, 'README.md'), 'utf-8');

      expect(readme).toContain('Vue 3 application for testing');
    });
  });

  describe('Author Substitution', () => {
    it('should substitute author name in LICENSE', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {
          author: 'John Smith',
        },
      };

      const result = await generator.scaffold(options);
      const license = fs.readFileSync(path.join(result.projectPath, 'LICENSE'), 'utf-8');

      expect(license).toContain('John Smith');
    });

    it('should use default author when not provided', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const license = fs.readFileSync(path.join(result.projectPath, 'LICENSE'), 'utf-8');

      expect(license).toContain('Your Name');
    });
  });

  describe('Year Substitution', () => {
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

      expect(license).toContain(`Copyright (c) ${currentYear}`);
    });
  });

  describe('License Substitution', () => {
    it('should use MIT license by default', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const readme = fs.readFileSync(path.join(result.projectPath, 'README.md'), 'utf-8');

      expect(readme).toContain('## License');
      expect(readme).toContain('MIT');
    });

    it('should use custom license when provided', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-project',
        outputPath: testOutputDir,
        options: {
          license: 'Apache-2.0',
        },
      };

      const result = await generator.scaffold(options);
      const readme = fs.readFileSync(path.join(result.projectPath, 'README.md'), 'utf-8');

      expect(readme).toContain('Apache-2.0');
    });
  });

  describe('Database Substitution', () => {
    it('should substitute database name in .env.template', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'my-db-app',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const envTemplate = fs.readFileSync(path.join(result.projectPath, '.env.template'), 'utf-8');

      expect(envTemplate).toContain('DB_NAME=my-db-app');
    });

    it('should substitute database in config files', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-db',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const dbConfig = fs.readFileSync(
        path.join(result.projectPath, 'src/config/database.ts'),
        'utf-8'
      );

      expect(dbConfig).toContain('test-db');
    });
  });

  describe('Multiple Variable Substitution', () => {
    it('should substitute all variables correctly', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'multi-var-test',
        outputPath: testOutputDir,
        options: {
          description: 'Multi-variable test application',
          author: 'Test Developer',
          license: 'Apache-2.0',
        },
      };

      const result = await generator.scaffold(options);

      // Check package.json
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );
      expect(packageJson.name).toBe('multi-var-test');
      expect(packageJson.description).toBe('Multi-variable test application');

      // Check LICENSE
      const license = fs.readFileSync(path.join(result.projectPath, 'LICENSE'), 'utf-8');
      expect(license).toContain('Test Developer');

      // Check README
      const readme = fs.readFileSync(path.join(result.projectPath, 'README.md'), 'utf-8');
      expect(readme).toContain('multi-var-test');
      expect(readme).toContain('Multi-variable test application');
      expect(readme).toContain('Apache-2.0');
    });
  });

  describe('Variable Escaping', () => {
    it('should not leave unreplaced variables', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'escape-test',
        outputPath: testOutputDir,
        options: {
          description: 'Test project',
          author: 'Test Author',
        },
      };

      const result = await generator.scaffold(options);

      // Read all generated files and check for unreplaced variables
      const checkForUnreplacedVars = (filePath: string) => {
        if (!fs.statSync(filePath).isFile()) return;
        const content = fs.readFileSync(filePath, 'utf-8');
        const unreplacedVars = content.match(/{{[a-zA-Z]+}}/g);
        expect(unreplacedVars).toBeNull();
      };

      const walkDir = (dir: string) => {
        const files = fs.readdirSync(dir);
        files.forEach(file => {
          const filePath = path.join(dir, file);
          const stat = fs.statSync(filePath);
          if (stat.isDirectory() && !filePath.includes('.git')) {
            walkDir(filePath);
          } else if (stat.isFile()) {
            // Only check text files
            if (filePath.match(/\.(ts|js|json|md|txt|yml|yaml|toml)$/)) {
              checkForUnreplacedVars(filePath);
            }
          }
        });
      };

      walkDir(result.projectPath);
    });
  });

  describe('Template-Specific Variables', () => {
    it('should handle React Native bundle identifier', async () => {
      const options: ScaffoldOptions = {
        template: 'react-native',
        projectName: 'my-mobile-app',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const appJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'app.json'), 'utf-8')
      );

      expect(appJson.expo.ios.bundleIdentifier).toContain('my-mobile-app');
      expect(appJson.expo.android.package).toContain('my-mobile-app');
    });

    it('should handle Python package naming', async () => {
      const options: ScaffoldOptions = {
        template: 'python-fastapi',
        projectName: 'my-python-api',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const pyproject = fs.readFileSync(path.join(result.projectPath, 'pyproject.toml'), 'utf-8');

      expect(pyproject).toContain('name = "my-python-api"');
    });

    it('should handle Next.js metadata', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-nextjs',
        projectName: 'my-nextjs-app',
        outputPath: testOutputDir,
        options: {
          description: 'Next.js test application',
        },
      };

      const result = await generator.scaffold(options);
      const layout = fs.readFileSync(path.join(result.projectPath, 'src/app/layout.tsx'), 'utf-8');

      expect(layout).toContain("title: 'my-nextjs-app'");
      expect(layout).toContain("description: 'Next.js test application'");
    });

    it('should handle .NET namespace', async () => {
      const options: ScaffoldOptions = {
        template: 'dotnet-webapi',
        projectName: 'MyDotNetApp',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const dbContext = fs.readFileSync(
        path.join(result.projectPath, 'Data/ApplicationDbContext.cs'),
        'utf-8'
      );

      expect(dbContext).toContain('namespace MyDotNetApp.Data');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty project name gracefully', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: '',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      // Should either fail gracefully or use a default name
      expect(result.success).toBeDefined();
    });

    it('should handle very long project name', async () => {
      const longName = 'a'.repeat(100);
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: longName,
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      expect(result.success).toBe(true);
    });

    it('should handle unicode in description', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'unicode-test',
        outputPath: testOutputDir,
        options: {
          description: 'Application with émojis 🚀 and ünïcödé',
        },
      };

      const result = await generator.scaffold(options);
      expect(result.success).toBe(true);

      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );
      expect(packageJson.description).toContain('🚀');
    });
  });
});
