/**
 * Security Auditor - Main Orchestrator
 * Coordinates scanning across multiple language scanners
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { SecurityReport, ScanOptions, Finding, Scanner } from './types';
import { TypeScriptScanner } from './scanners/typescript';
import { CSharpScanner } from './scanners/csharp';
import { PythonScanner } from './scanners/python';

export class SecurityAuditor {
  private scanners: Scanner[] = [
    new TypeScriptScanner(),
    new CSharpScanner(),
    new PythonScanner(),
  ];

  /**
   * Scan a project for security vulnerabilities
   */
  async scanProject(options: ScanOptions): Promise<SecurityReport> {
    const startTime = Date.now();
    const allFindings: Finding[] = [];
    let filesScanned = 0;

    console.log(`🔍 Scanning project: ${options.projectPath}`);

    // Get all files to scan based on language preference
    const filesToScan = await this.getFilesToScan(options);

    console.log(`📁 Found ${filesToScan.length} files to scan`);

    // Scan each file
    for (const filePath of filesToScan) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const scanner = this.getScannerForFile(filePath);

        if (scanner) {
          const findings = scanner.scan(filePath, content);
          allFindings.push(...findings);
          filesScanned++;

          if (filesScanned % 100 === 0) {
            console.log(`  Scanned ${filesScanned} files...`);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Failed to scan ${filePath}: ${error}`);
      }
    }

    // Filter by severity threshold if specified
    let filteredFindings = allFindings;
    if (options.severityThreshold) {
      filteredFindings = this.filterBySeverity(allFindings, options.severityThreshold);
    }

    // Limit findings if specified
    if (options.maxFindings && filteredFindings.length > options.maxFindings) {
      filteredFindings = filteredFindings.slice(0, options.maxFindings);
    }

    const scanDurationMs = Date.now() - startTime;

    // Build report
    const report: SecurityReport = {
      projectPath: options.projectPath,
      scanDate: new Date().toISOString(),
      totalFindings: filteredFindings.length,
      bySeverity: {
        critical: filteredFindings.filter((f) => f.severity === 'critical').length,
        high: filteredFindings.filter((f) => f.severity === 'high').length,
        medium: filteredFindings.filter((f) => f.severity === 'medium').length,
        low: filteredFindings.filter((f) => f.severity === 'low').length,
      },
      byType: this.countByType(filteredFindings),
      findings: filteredFindings,
      recommendations: this.generateRecommendations(filteredFindings),
      scanDurationMs,
      filesScanned,
    };

    console.log(`✅ Scan complete: ${report.totalFindings} findings in ${filesScanned} files (${scanDurationMs}ms)`);

    return report;
  }

  /**
   * Get list of files to scan based on options
   */
  private async getFilesToScan(options: ScanOptions): Promise<string[]> {
    const patterns = this.getFilePatterns(options.language);
    const files: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: options.projectPath,
        absolute: true,
        ignore: [
          '**/node_modules/**',
          '**/dist/**',
          '**/build/**',
          '**/bin/**',
          '**/obj/**',
          '**/.git/**',
          '**/venv/**',
          '**/__pycache__/**',
          '**/.next/**',
          '**/.nuxt/**',
          ...(options.excludePatterns || []),
        ],
      });
      files.push(...matches);
    }

    return [...new Set(files)]; // Remove duplicates
  }

  /**
   * Get file patterns based on language
   */
  private getFilePatterns(language?: string): string[] {
    const allPatterns = {
      typescript: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx', '**/*.mjs'],
      javascript: ['**/*.js', '**/*.jsx', '**/*.mjs'],
      csharp: ['**/*.cs'],
      python: ['**/*.py'],
    };

    if (!language || language === 'all') {
      return Object.values(allPatterns).flat();
    }

    return allPatterns[language as keyof typeof allPatterns] || [];
  }

  /**
   * Get appropriate scanner for a file
   */
  private getScannerForFile(filePath: string): Scanner | null {
    const ext = path.extname(filePath);

    for (const scanner of this.scanners) {
      if (scanner.fileExtensions.includes(ext)) {
        return scanner;
      }
    }

    return null;
  }

  /**
   * Filter findings by severity threshold
   */
  private filterBySeverity(findings: Finding[], threshold: string): Finding[] {
    const severityOrder = ['low', 'medium', 'high', 'critical'];
    const thresholdIndex = severityOrder.indexOf(threshold);

    return findings.filter((f) => {
      const findingSeverityIndex = severityOrder.indexOf(f.severity);
      return findingSeverityIndex >= thresholdIndex;
    });
  }

  /**
   * Count findings by type
   */
  private countByType(findings: Finding[]): Record<string, number> {
    const counts: Record<string, number> = {};

    for (const finding of findings) {
      counts[finding.type] = (counts[finding.type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Generate high-level recommendations based on findings
   */
  private generateRecommendations(findings: Finding[]): string[] {
    const recommendations: string[] = [];
    const types = new Set(findings.map((f) => f.type));

    if (types.has('sql-injection')) {
      recommendations.push('Implement parameterized queries for all database operations');
      recommendations.push('Use ORM frameworks with built-in SQL injection protection');
    }

    if (types.has('xss')) {
      recommendations.push('Implement Content Security Policy (CSP) headers');
      recommendations.push('Use HTML sanitization libraries like DOMPurify');
      recommendations.push('Enable auto-escaping in template engines');
    }

    if (types.has('hardcoded-secret')) {
      recommendations.push('Move all secrets to environment variables');
      recommendations.push('Use a secrets management system (e.g., Azure Key Vault, AWS Secrets Manager)');
      recommendations.push('Implement pre-commit hooks to prevent secret commits');
    }

    if (types.has('insecure-crypto')) {
      recommendations.push('Upgrade to strong cryptographic algorithms (SHA256+, AES)');
      recommendations.push('Review and update crypto libraries to latest versions');
    }

    if (types.has('cors-misconfiguration')) {
      recommendations.push('Configure CORS with explicit origin allowlist');
      recommendations.push('Avoid wildcard (*) CORS origins in production');
    }

    if (types.has('weak-authentication')) {
      recommendations.push('Implement strong password hashing (bcrypt with 12+ rounds)');
      recommendations.push('Use secure session configuration with httpOnly and secure flags');
      recommendations.push('Implement JWT with strong secrets (32+ characters)');
    }

    if (types.has('insecure-deserialization')) {
      recommendations.push('Avoid deserializing untrusted data');
      recommendations.push('Use safe serialization formats like JSON');
    }

    if (types.has('path-traversal')) {
      recommendations.push('Validate and sanitize all file paths');
      recommendations.push('Use allowlist-based path validation');
    }

    // Add generic recommendations
    if (findings.length > 0) {
      recommendations.push('Conduct regular security audits and penetration testing');
      recommendations.push('Implement security linting in CI/CD pipeline');
      recommendations.push('Provide security training for development team');
    }

    return recommendations;
  }
}
