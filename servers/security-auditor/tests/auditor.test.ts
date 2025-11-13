/**
 * Security Auditor Tests
 */

import { SecurityAuditor } from '../src/auditor.js';
import { ScanOptions } from '../src/types.js';
import * as path from 'path';

describe('SecurityAuditor', () => {
  let auditor: SecurityAuditor;
  const fixturesPath = path.join(process.cwd(), 'tests', 'fixtures');

  beforeEach(() => {
    auditor = new SecurityAuditor();
  });

  describe('TypeScript Scanner', () => {
    it('should detect SQL injection vulnerabilities', async () => {
      const options: ScanOptions = {
        projectPath: path.join(fixturesPath, 'typescript'),
        language: 'typescript',
      };

      const report = await auditor.scanProject(options);

      const sqlInjectionFindings = report.findings.filter(
        (f) => f.type === 'sql-injection'
      );

      expect(sqlInjectionFindings.length).toBeGreaterThanOrEqual(2);
      expect(sqlInjectionFindings[0].severity).toBe('critical');
      expect(sqlInjectionFindings[0].file).toContain('sql-injection.ts');
    });

    it('should detect XSS vulnerabilities', async () => {
      const options: ScanOptions = {
        projectPath: path.join(fixturesPath, 'typescript'),
        language: 'typescript',
      };

      const report = await auditor.scanProject(options);

      const xssFindings = report.findings.filter((f) => f.type === 'xss');

      expect(xssFindings.length).toBeGreaterThanOrEqual(2);
      expect(xssFindings[0].severity).toBe('high');
      expect(xssFindings[0].file).toContain('xss.tsx');
    });

    it('should detect hardcoded secrets', async () => {
      const options: ScanOptions = {
        projectPath: path.join(fixturesPath, 'typescript'),
        language: 'typescript',
      };

      const report = await auditor.scanProject(options);

      const secretFindings = report.findings.filter(
        (f) => f.type === 'hardcoded-secret'
      );

      expect(secretFindings.length).toBeGreaterThanOrEqual(6);
      expect(secretFindings.some((f) => f.severity === 'critical')).toBe(true);
    });
  });

  describe('C# Scanner', () => {
    it('should detect insecure crypto usage', async () => {
      const options: ScanOptions = {
        projectPath: path.join(fixturesPath, 'csharp'),
        language: 'csharp',
      };

      const report = await auditor.scanProject(options);

      const cryptoFindings = report.findings.filter(
        (f) => f.type === 'insecure-crypto'
      );

      expect(cryptoFindings.length).toBeGreaterThanOrEqual(2);
      expect(cryptoFindings[0].severity).toBe('high');
      expect(cryptoFindings[0].file).toContain('.cs');
    });
  });

  describe('Python Scanner', () => {
    it('should detect SQL injection in Python', async () => {
      const options: ScanOptions = {
        projectPath: path.join(fixturesPath, 'python'),
        language: 'python',
      };

      const report = await auditor.scanProject(options);

      const sqlInjectionFindings = report.findings.filter(
        (f) => f.type === 'sql-injection'
      );

      expect(sqlInjectionFindings.length).toBeGreaterThanOrEqual(2);
      expect(sqlInjectionFindings[0].severity).toBe('critical');
    });
  });

  describe('Security Report', () => {
    it('should generate comprehensive report with severity breakdown', async () => {
      const options: ScanOptions = {
        projectPath: fixturesPath,
        language: 'all',
      };

      const report = await auditor.scanProject(options);

      expect(report.totalFindings).toBeGreaterThan(0);
      expect(report.bySeverity).toHaveProperty('critical');
      expect(report.bySeverity).toHaveProperty('high');
      expect(report.bySeverity).toHaveProperty('medium');
      expect(report.bySeverity).toHaveProperty('low');
      expect(report.filesScanned).toBeGreaterThan(0);
      expect(report.scanDurationMs).toBeGreaterThan(0);
    });

    it('should filter by severity threshold', async () => {
      const options: ScanOptions = {
        projectPath: fixturesPath,
        language: 'all',
        severityThreshold: 'high',
      };

      const report = await auditor.scanProject(options);

      const lowFindings = report.findings.filter((f) => f.severity === 'low');
      const mediumFindings = report.findings.filter(
        (f) => f.severity === 'medium'
      );

      expect(lowFindings.length).toBe(0);
      expect(mediumFindings.length).toBe(0);
    });

    it('should limit number of findings', async () => {
      const options: ScanOptions = {
        projectPath: fixturesPath,
        language: 'all',
        maxFindings: 5,
      };

      const report = await auditor.scanProject(options);

      expect(report.findings.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Recommendations', () => {
    it('should provide actionable recommendations', async () => {
      const options: ScanOptions = {
        projectPath: fixturesPath,
        language: 'all',
      };

      const report = await auditor.scanProject(options);

      expect(report.recommendations.length).toBeGreaterThan(0);
      expect(report.recommendations[0]).toBeTruthy();
    });
  });
});
