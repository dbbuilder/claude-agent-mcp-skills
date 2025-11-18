/**
 * Integration tests for CLI commands
 */

import { describe, it, expect } from '@jest/globals';
import { execSync } from 'child_process';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CLI_PATH = path.resolve(__dirname, '../build/index.js');

describe('CLI Commands', () => {
  const runCli = (args: string): string => {
    try {
      return execSync(`node ${CLI_PATH} ${args}`, {
        encoding: 'utf-8',
        timeout: 30000,
      });
    } catch (error: any) {
      // Return stderr for error cases
      return error.stdout || error.stderr || error.message;
    }
  };

  describe('Help and version', () => {
    it('should display help with --help flag', () => {
      const output = runCli('--help');
      expect(output).toContain('claude-agent');
      expect(output).toContain('Claude Agent SDK');
    });

    it('should display version with --version flag', () => {
      const output = runCli('--version');
      expect(output).toContain('1.0.0');
    });
  });

  describe('List command', () => {
    it('should list all available servers', () => {
      const output = runCli('list');

      // Should show all 10 servers
      expect(output).toContain('security-auditor');
      expect(output).toContain('project-scaffolder');
      expect(output).toContain('readme-generator');
      expect(output).toContain('dependency-updater');
      expect(output).toContain('api-doc-generator');
      expect(output).toContain('integration-test-generator');
      expect(output).toContain('config-template-generator');
      expect(output).toContain('docker-config-generator');
      expect(output).toContain('code-migration-assistant');
      expect(output).toContain('performance-profiler');
    });

    it('should work with ls alias', () => {
      const output = runCli('ls');
      expect(output).toContain('security-auditor');
    });
  });

  describe('Info command', () => {
    it('should show server info for security-auditor', () => {
      const output = runCli('info security-auditor');

      expect(output).toContain('Security Auditor');
      expect(output).toContain('audit');
      expect(output).toContain('projectPath');
    });

    it('should show server info for docker-config-generator', () => {
      const output = runCli('info docker-config-generator');

      expect(output).toContain('Docker Configuration Generator');
      expect(output).toContain('analyze');
      expect(output).toContain('generate');
    });

    it('should show server info for config-template-generator', () => {
      const output = runCli('info config-template-generator');

      expect(output).toContain('Configuration Template Generator');
      expect(output).toContain('discover');
      expect(output).toContain('generate');
    });

    it('should handle unknown server gracefully', () => {
      const output = runCli('info unknown-server');
      expect(output).toContain('not found');
    });
  });

  describe('Server subcommands', () => {
    it('should show security-auditor help', () => {
      const output = runCli('security-auditor --help');
      expect(output).toContain('audit');
      expect(output).toContain('Scan codebases');
    });

    it('should show docker-config-generator help', () => {
      const output = runCli('docker-config-generator --help');
      expect(output).toContain('analyze');
      expect(output).toContain('generate');
      expect(output).toContain('Docker');
    });

    it('should show dependency-updater help', () => {
      const output = runCli('dependency-updater --help');
      expect(output).toContain('update');
      expect(output).toContain('analyze');
    });
  });
});
