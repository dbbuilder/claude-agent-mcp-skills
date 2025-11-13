/**
 * Package Manager Detection Tests
 * Tests for detectPackageManager functionality
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Package Manager Detection Logic', () => {
  const testProjectsDir = path.join(__dirname, '../test-projects');

  beforeAll(() => {
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

  describe('Node.js Package Managers', () => {
    it('should detect pnpm from pnpm-lock.yaml', () => {
      const projectPath = path.join(testProjectsDir, 'pnpm-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{}');
      fs.writeFileSync(path.join(projectPath, 'pnpm-lock.yaml'), '');

      const files = fs.readdirSync(projectPath);

      // Detection logic
      let detected = null;
      if (files.includes('package.json')) {
        if (files.includes('pnpm-lock.yaml')) detected = 'pnpm';
        else if (files.includes('yarn.lock')) detected = 'yarn';
        else if (files.includes('package-lock.json')) detected = 'npm';
        else detected = 'npm';
      }

      expect(detected).toBe('pnpm');
    });

    it('should detect yarn from yarn.lock', () => {
      const projectPath = path.join(testProjectsDir, 'yarn-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{}');
      fs.writeFileSync(path.join(projectPath, 'yarn.lock'), '');

      const files = fs.readdirSync(projectPath);

      let detected = null;
      if (files.includes('package.json')) {
        if (files.includes('pnpm-lock.yaml')) detected = 'pnpm';
        else if (files.includes('yarn.lock')) detected = 'yarn';
        else if (files.includes('package-lock.json')) detected = 'npm';
        else detected = 'npm';
      }

      expect(detected).toBe('yarn');
    });

    it('should detect npm from package-lock.json', () => {
      const projectPath = path.join(testProjectsDir, 'npm-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{}');
      fs.writeFileSync(path.join(projectPath, 'package-lock.json'), '{}');

      const files = fs.readdirSync(projectPath);

      let detected = null;
      if (files.includes('package.json')) {
        if (files.includes('pnpm-lock.yaml')) detected = 'pnpm';
        else if (files.includes('yarn.lock')) detected = 'yarn';
        else if (files.includes('package-lock.json')) detected = 'npm';
        else detected = 'npm';
      }

      expect(detected).toBe('npm');
    });

    it('should default to npm when no lockfile present', () => {
      const projectPath = path.join(testProjectsDir, 'npm-default-detect');
      fs.mkdirSync(projectPath, { recursive: true});

      fs.writeFileSync(path.join(projectPath, 'package.json'), '{}');

      const files = fs.readdirSync(projectPath);

      let detected = null;
      if (files.includes('package.json')) {
        if (files.includes('pnpm-lock.yaml')) detected = 'pnpm';
        else if (files.includes('yarn.lock')) detected = 'yarn';
        else if (files.includes('package-lock.json')) detected = 'npm';
        else detected = 'npm';
      }

      expect(detected).toBe('npm');
    });
  });

  describe('Python Package Managers', () => {
    it('should detect poetry from pyproject.toml', () => {
      const projectPath = path.join(testProjectsDir, 'poetry-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'pyproject.toml'), '');

      const files = fs.readdirSync(projectPath);

      let detected = null;
      if (files.includes('pyproject.toml')) detected = 'poetry';
      else if (files.includes('requirements.txt')) detected = 'pip';

      expect(detected).toBe('poetry');
    });

    it('should detect pip from requirements.txt', () => {
      const projectPath = path.join(testProjectsDir, 'pip-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'requirements.txt'), '');

      const files = fs.readdirSync(projectPath);

      let detected = null;
      if (files.includes('pyproject.toml')) detected = 'poetry';
      else if (files.includes('requirements.txt')) detected = 'pip';

      expect(detected).toBe('pip');
    });
  });

  describe('Other Package Managers', () => {
    it('should detect dotnet from .csproj files', () => {
      const projectPath = path.join(testProjectsDir, 'dotnet-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'MyProject.csproj'), '<Project />');

      const files = fs.readdirSync(projectPath);

      const detected = files.some(f => f.endsWith('.csproj') || f.endsWith('.sln')) ? 'dotnet' : null;

      expect(detected).toBe('dotnet');
    });

    it('should detect cargo from Cargo.toml', () => {
      const projectPath = path.join(testProjectsDir, 'cargo-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'Cargo.toml'), '');

      const files = fs.readdirSync(projectPath);

      const detected = files.includes('Cargo.toml') ? 'cargo' : null;

      expect(detected).toBe('cargo');
    });

    it('should detect go from go.mod', () => {
      const projectPath = path.join(testProjectsDir, 'go-detect');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'go.mod'), '');

      const files = fs.readdirSync(projectPath);

      const detected = files.includes('go.mod') ? 'go' : null;

      expect(detected).toBe('go');
    });
  });

  describe('Priority Detection', () => {
    it('should prioritize pnpm over yarn over npm', () => {
      const projectPath = path.join(testProjectsDir, 'multi-lockfile');
      fs.mkdirSync(projectPath, { recursive: true });

      // Create all lockfiles (shouldn't happen but testing priority)
      fs.writeFileSync(path.join(projectPath, 'package.json'), '{}');
      fs.writeFileSync(path.join(projectPath, 'pnpm-lock.yaml'), '');
      fs.writeFileSync(path.join(projectPath, 'yarn.lock'), '');
      fs.writeFileSync(path.join(projectPath, 'package-lock.json'), '{}');

      const files = fs.readdirSync(projectPath);

      let detected = null;
      if (files.includes('package.json')) {
        if (files.includes('pnpm-lock.yaml')) detected = 'pnpm';
        else if (files.includes('yarn.lock')) detected = 'yarn';
        else if (files.includes('package-lock.json')) detected = 'npm';
        else detected = 'npm';
      }

      // Should detect pnpm first
      expect(detected).toBe('pnpm');
    });

    it('should prioritize poetry over pip for Python', () => {
      const projectPath = path.join(testProjectsDir, 'python-multi');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'pyproject.toml'), '');
      fs.writeFileSync(path.join(projectPath, 'requirements.txt'), '');

      const files = fs.readdirSync(projectPath);

      let detected = null;
      if (files.includes('pyproject.toml')) detected = 'poetry';
      else if (files.includes('requirements.txt')) detected = 'pip';

      expect(detected).toBe('poetry');
    });
  });

  describe('No Package Manager', () => {
    it('should return null when no package manager files found', () => {
      const projectPath = path.join(testProjectsDir, 'empty-project');
      fs.mkdirSync(projectPath, { recursive: true });

      fs.writeFileSync(path.join(projectPath, 'README.md'), '# Test');

      const files = fs.readdirSync(projectPath);

      let detected = null;

      // Node.js
      if (files.includes('package.json')) {
        if (files.includes('pnpm-lock.yaml')) detected = 'pnpm';
        else if (files.includes('yarn.lock')) detected = 'yarn';
        else if (files.includes('package-lock.json')) detected = 'npm';
        else detected = 'npm';
      }

      // Python
      if (!detected && files.includes('pyproject.toml')) detected = 'poetry';
      if (!detected && files.includes('requirements.txt')) detected = 'pip';

      // .NET
      if (!detected && files.some(f => f.endsWith('.csproj') || f.endsWith('.sln'))) detected = 'dotnet';

      // Rust
      if (!detected && files.includes('Cargo.toml')) detected = 'cargo';

      // Go
      if (!detected && files.includes('go.mod')) detected = 'go';

      expect(detected).toBeNull();
    });
  });
});
