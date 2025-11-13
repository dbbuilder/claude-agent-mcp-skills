/**
 * Template Tests
 * Tests for all 7 project templates
 */

import { ProjectGenerator } from '../src/generator.js';
import { ProjectTemplate, ScaffoldOptions } from '../src/types.js';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Template Generation', () => {
  let generator: ProjectGenerator;
  const testOutputDir = path.join(__dirname, '../test-output');

  beforeAll(() => {
    // Clean up test output directory before all tests
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  beforeEach(() => {
    generator = new ProjectGenerator();
  });

  afterAll(() => {
    // Clean up test output directory after all tests
    if (fs.existsSync(testOutputDir)) {
      fs.rmSync(testOutputDir, { recursive: true, force: true });
    }
  });

  describe('TypeScript Express Template', () => {
    it('should generate TypeScript Express project', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-express',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.template).toBe('typescript-express');

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'tsconfig.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/index.ts'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/config/database.ts'))).toBe(true);
    });

    it('should have Express dependencies', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'test-express-deps',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.dependencies.express).toBeDefined();
      expect(packageJson.dependencies.cors).toBeDefined();
      expect(packageJson.dependencies.helmet).toBeDefined();
      expect(packageJson.devDependencies.typescript).toBeDefined();
    });
  });

  describe('Next.js Template', () => {
    it('should generate Next.js project', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-nextjs',
        projectName: 'test-nextjs',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.template).toBe('typescript-nextjs');

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'next.config.js'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/app/layout.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/app/page.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'tailwind.config.ts'))).toBe(true);
    });

    it('should have Next.js dependencies', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-nextjs',
        projectName: 'test-nextjs-deps',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.dependencies.next).toBeDefined();
      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
      expect(packageJson.devDependencies.tailwindcss).toBeDefined();
    });
  });

  describe('.NET Web API Template', () => {
    it('should generate .NET Web API project', async () => {
      const options: ScaffoldOptions = {
        template: 'dotnet-webapi',
        projectName: 'TestDotNetApi',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.template).toBe('dotnet-webapi');

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'TestDotNetApi.csproj'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'Program.cs'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'appsettings.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'Data/ApplicationDbContext.cs'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'Controllers/WeatherForecastController.cs'))).toBe(true);
    });

    it('should have .NET 8 target framework', async () => {
      const options: ScaffoldOptions = {
        template: 'dotnet-webapi',
        projectName: 'TestDotNet',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const csproj = fs.readFileSync(
        path.join(result.projectPath, 'TestDotNet.csproj'),
        'utf-8'
      );

      expect(csproj).toContain('net8.0');
      expect(csproj).toContain('Microsoft.AspNetCore.OpenApi');
      expect(csproj).toContain('Swashbuckle.AspNetCore');
    });
  });

  describe('Python FastAPI Template', () => {
    it('should generate Python FastAPI project', async () => {
      const options: ScaffoldOptions = {
        template: 'python-fastapi',
        projectName: 'test-fastapi',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.template).toBe('python-fastapi');

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'pyproject.toml'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'requirements.txt'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'main.py'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'app/core/config.py'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'app/api/v1/health.py'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'tests/test_main.py'))).toBe(true);
    });

    it('should have FastAPI dependencies', async () => {
      const options: ScaffoldOptions = {
        template: 'python-fastapi',
        projectName: 'test-fastapi-deps',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const pyproject = fs.readFileSync(
        path.join(result.projectPath, 'pyproject.toml'),
        'utf-8'
      );

      expect(pyproject).toContain('fastapi');
      expect(pyproject).toContain('uvicorn');
      expect(pyproject).toContain('sqlalchemy');
      expect(pyproject).toContain('pydantic');
    });
  });

  describe('Vue 3 Template', () => {
    it('should generate Vue 3 project', async () => {
      const options: ScaffoldOptions = {
        template: 'vue3-frontend',
        projectName: 'test-vue',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.template).toBe('vue3-frontend');

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'vite.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/main.ts'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/App.vue'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/views/HomeView.vue'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/router/index.ts'))).toBe(true);
    });

    it('should have Vue 3 dependencies', async () => {
      const options: ScaffoldOptions = {
        template: 'vue3-frontend',
        projectName: 'test-vue-deps',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.dependencies.vue).toBeDefined();
      expect(packageJson.dependencies['vue-router']).toBeDefined();
      expect(packageJson.dependencies.pinia).toBeDefined();
      expect(packageJson.devDependencies.vite).toBeDefined();
    });
  });

  describe('React Template', () => {
    it('should generate React project', async () => {
      const options: ScaffoldOptions = {
        template: 'react-frontend',
        projectName: 'test-react',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.template).toBe('react-frontend');

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'vite.config.ts'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'index.html'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/main.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/App.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/pages/Home.tsx'))).toBe(true);
    });

    it('should have React dependencies', async () => {
      const options: ScaffoldOptions = {
        template: 'react-frontend',
        projectName: 'test-react-deps',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.dependencies.react).toBeDefined();
      expect(packageJson.dependencies['react-dom']).toBeDefined();
      expect(packageJson.dependencies['react-router-dom']).toBeDefined();
      expect(packageJson.devDependencies.vite).toBeDefined();
    });
  });

  describe('React Native Template', () => {
    it('should generate React Native project', async () => {
      const options: ScaffoldOptions = {
        template: 'react-native',
        projectName: 'test-rn',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);

      expect(result.success).toBe(true);
      expect(result.template).toBe('react-native');

      const projectPath = result.projectPath;
      expect(fs.existsSync(path.join(projectPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'app.json'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'App.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'babel.config.js'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/screens/HomeScreen.tsx'))).toBe(true);
      expect(fs.existsSync(path.join(projectPath, 'src/components/Button.tsx'))).toBe(true);
    });

    it('should have React Native + Expo dependencies', async () => {
      const options: ScaffoldOptions = {
        template: 'react-native',
        projectName: 'test-rn-deps',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'package.json'), 'utf-8')
      );

      expect(packageJson.dependencies.expo).toBeDefined();
      expect(packageJson.dependencies['react-native']).toBeDefined();
      expect(packageJson.dependencies['@react-navigation/native']).toBeDefined();
      expect(packageJson.devDependencies['jest-expo']).toBeDefined();
    });

    it('should have correct Expo configuration', async () => {
      const options: ScaffoldOptions = {
        template: 'react-native',
        projectName: 'test-rn-config',
        outputPath: testOutputDir,
        options: {},
      };

      const result = await generator.scaffold(options);
      const appJson = JSON.parse(
        fs.readFileSync(path.join(result.projectPath, 'app.json'), 'utf-8')
      );

      expect(appJson.expo.name).toBe('test-rn-config');
      expect(appJson.expo.slug).toBe('test-rn-config');
      expect(appJson.expo.ios.bundleIdentifier).toBe('com.test-rn-config.app');
      expect(appJson.expo.android.package).toBe('com.test-rn-config.app');
    });
  });

  describe('Template Validation', () => {
    const templates: ProjectTemplate[] = [
      'typescript-express',
      'typescript-nextjs',
      'dotnet-webapi',
      'python-fastapi',
      'vue3-frontend',
      'react-frontend',
      'react-native',
    ];

    templates.forEach((template) => {
      it(`${template} should have valid package.json or equivalent`, async () => {
        const options: ScaffoldOptions = {
          template,
          projectName: `test-${template}`,
          outputPath: testOutputDir,
          options: {},
        };

        const result = await generator.scaffold(options);
        expect(result.success).toBe(true);

        const projectPath = result.projectPath;

        // Check for package.json (Node.js projects) or pyproject.toml (Python) or .csproj (.NET)
        const hasPackageJson = fs.existsSync(path.join(projectPath, 'package.json'));
        const hasPyproject = fs.existsSync(path.join(projectPath, 'pyproject.toml'));
        const hasCsproj = fs.readdirSync(projectPath).some(file => file.endsWith('.csproj'));

        expect(hasPackageJson || hasPyproject || hasCsproj).toBe(true);
      });

      it(`${template} should have README.md`, async () => {
        const options: ScaffoldOptions = {
          template,
          projectName: `test-${template}-readme`,
          outputPath: testOutputDir,
          options: {},
        };

        const result = await generator.scaffold(options);
        expect(result.success).toBe(true);

        const readmePath = path.join(result.projectPath, 'README.md');
        expect(fs.existsSync(readmePath)).toBe(true);

        const readme = fs.readFileSync(readmePath, 'utf-8');
        expect(readme).toContain(`test-${template}-readme`);
      });

      it(`${template} should have .gitignore`, async () => {
        const options: ScaffoldOptions = {
          template,
          projectName: `test-${template}-gitignore`,
          outputPath: testOutputDir,
          options: {},
        };

        const result = await generator.scaffold(options);
        expect(result.success).toBe(true);

        expect(fs.existsSync(path.join(result.projectPath, '.gitignore'))).toBe(true);
      });

      it(`${template} should have LICENSE`, async () => {
        const options: ScaffoldOptions = {
          template,
          projectName: `test-${template}-license`,
          outputPath: testOutputDir,
          options: {},
        };

        const result = await generator.scaffold(options);
        expect(result.success).toBe(true);

        const licensePath = path.join(result.projectPath, 'LICENSE');
        expect(fs.existsSync(licensePath)).toBe(true);

        const license = fs.readFileSync(licensePath, 'utf-8');
        expect(license).toContain('MIT License');
      });
    });
  });

  describe('File Count Validation', () => {
    it('TypeScript Express should create at least 8 files', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-express',
        projectName: 'count-test-express',
        outputPath: testOutputDir,
        options: { gitInit: false },
      };

      const result = await generator.scaffold(options);
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(8);
    });

    it('Next.js should create at least 13 files', async () => {
      const options: ScaffoldOptions = {
        template: 'typescript-nextjs',
        projectName: 'count-test-nextjs',
        outputPath: testOutputDir,
        options: { gitInit: false },
      };

      const result = await generator.scaffold(options);
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(13);
    });

    it('.NET Web API should create at least 11 files', async () => {
      const options: ScaffoldOptions = {
        template: 'dotnet-webapi',
        projectName: 'CountTestDotNet',
        outputPath: testOutputDir,
        options: { gitInit: false },
      };

      const result = await generator.scaffold(options);
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(11);
    });

    it('Python FastAPI should create at least 14 files', async () => {
      const options: ScaffoldOptions = {
        template: 'python-fastapi',
        projectName: 'count-test-fastapi',
        outputPath: testOutputDir,
        options: { gitInit: false },
      };

      const result = await generator.scaffold(options);
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(14);
    });

    it('Vue 3 should create at least 17 files', async () => {
      const options: ScaffoldOptions = {
        template: 'vue3-frontend',
        projectName: 'count-test-vue',
        outputPath: testOutputDir,
        options: { gitInit: false },
      };

      const result = await generator.scaffold(options);
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(17);
    });

    it('React should create at least 14 files', async () => {
      const options: ScaffoldOptions = {
        template: 'react-frontend',
        projectName: 'count-test-react',
        outputPath: testOutputDir,
        options: { gitInit: false },
      };

      const result = await generator.scaffold(options);
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(14);
    });

    it('React Native should create at least 17 files', async () => {
      const options: ScaffoldOptions = {
        template: 'react-native',
        projectName: 'count-test-rn',
        outputPath: testOutputDir,
        options: { gitInit: false },
      };

      const result = await generator.scaffold(options);
      expect(result.filesCreated.length).toBeGreaterThanOrEqual(17);
    });
  });
});
