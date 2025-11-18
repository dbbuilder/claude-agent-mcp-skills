/**
 * Tests for CLI server registry
 */

import { describe, it, expect } from '@jest/globals';
import { servers } from '../src/registry.js';

describe('Server Registry', () => {
  describe('Registry structure', () => {
    it('should have all 10 servers registered', () => {
      const serverIds = Object.keys(servers);
      expect(serverIds).toHaveLength(10);
    });

    it('should include all expected server IDs', () => {
      const expectedIds = [
        'security-auditor',
        'project-scaffolder',
        'readme-generator',
        'dependency-updater',
        'api-doc-generator',
        'integration-test-generator',
        'config-template-generator',
        'docker-config-generator',
        'code-migration-assistant',
        'performance-profiler',
      ];

      const serverIds = Object.keys(servers);
      for (const id of expectedIds) {
        expect(serverIds).toContain(id);
      }
    });

    it('should have valid server info for each server', () => {
      for (const [id, server] of Object.entries(servers)) {
        expect(server.name).toBeDefined();
        expect(server.name.length).toBeGreaterThan(0);
        expect(server.description).toBeDefined();
        expect(server.description.length).toBeGreaterThan(0);
        expect(server.path).toBeDefined();
        expect(server.path).toContain('servers/');
        expect(server.commands).toBeDefined();
        expect(Array.isArray(server.commands)).toBe(true);
        expect(server.commands.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Server commands', () => {
    it('should have valid command structure', () => {
      for (const [id, server] of Object.entries(servers)) {
        for (const command of server.commands) {
          expect(command.name).toBeDefined();
          expect(command.name.length).toBeGreaterThan(0);
          expect(command.description).toBeDefined();
          expect(command.description.length).toBeGreaterThan(0);
          expect(command.args).toBeDefined();
          expect(Array.isArray(command.args)).toBe(true);
        }
      }
    });

    it('should have valid argument structure', () => {
      for (const [id, server] of Object.entries(servers)) {
        for (const command of server.commands) {
          for (const arg of command.args) {
            expect(arg.name).toBeDefined();
            expect(arg.name.length).toBeGreaterThan(0);
            expect(arg.description).toBeDefined();
            expect(arg.description.length).toBeGreaterThan(0);
            expect(typeof arg.required).toBe('boolean');
          }
        }
      }
    });

    it('should have at least one required argument per command that needs input', () => {
      // Most commands need at least a projectPath
      const commandsWithRequiredArgs = [
        'security-auditor',
        'readme-generator',
        'dependency-updater',
        'api-doc-generator',
        'integration-test-generator',
        'config-template-generator',
        'docker-config-generator',
        'code-migration-assistant',
        'performance-profiler',
      ];

      for (const serverId of commandsWithRequiredArgs) {
        const server = servers[serverId];
        for (const command of server.commands) {
          const hasRequired = command.args.some(arg => arg.required);
          expect(hasRequired).toBe(true);
        }
      }
    });
  });

  describe('Security Auditor', () => {
    it('should have audit command with correct args', () => {
      const server = servers['security-auditor'];
      expect(server.commands).toHaveLength(1);

      const auditCmd = server.commands[0];
      expect(auditCmd.name).toBe('audit');
      expect(auditCmd.args.length).toBeGreaterThanOrEqual(3);

      const projectPathArg = auditCmd.args.find(a => a.name === 'projectPath');
      expect(projectPathArg?.required).toBe(true);

      const formatArg = auditCmd.args.find(a => a.name === 'format');
      expect(formatArg?.default).toBe('markdown');
    });
  });

  describe('Docker Config Generator', () => {
    it('should have analyze and generate commands', () => {
      const server = servers['docker-config-generator'];
      expect(server.commands).toHaveLength(2);

      const analyzeCmd = server.commands.find(c => c.name === 'analyze');
      expect(analyzeCmd).toBeDefined();

      const generateCmd = server.commands.find(c => c.name === 'generate');
      expect(generateCmd).toBeDefined();
      expect(generateCmd?.args.find(a => a.name === 'includeCompose')?.default).toBe('true');
    });
  });

  describe('Dependency Updater', () => {
    it('should have update and analyze commands', () => {
      const server = servers['dependency-updater'];
      expect(server.commands).toHaveLength(2);

      const updateCmd = server.commands.find(c => c.name === 'update');
      expect(updateCmd).toBeDefined();
      expect(updateCmd?.args.find(a => a.name === 'strategy')?.default).toBe('balanced');

      const analyzeCmd = server.commands.find(c => c.name === 'analyze');
      expect(analyzeCmd).toBeDefined();
    });
  });

  describe('Config Template Generator', () => {
    it('should have discover and generate commands', () => {
      const server = servers['config-template-generator'];
      expect(server.commands).toHaveLength(2);

      const discoverCmd = server.commands.find(c => c.name === 'discover');
      expect(discoverCmd).toBeDefined();

      const generateCmd = server.commands.find(c => c.name === 'generate');
      expect(generateCmd).toBeDefined();
      expect(generateCmd?.args.find(a => a.name === 'format')?.default).toBe('env');
    });
  });
});
