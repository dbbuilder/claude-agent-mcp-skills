/**
 * Security Auditor Types
 * Type definitions for the OWASP Top 10 security scanner
 */

export type Severity = 'critical' | 'high' | 'medium' | 'low';

export type VulnerabilityType =
  | 'sql-injection'
  | 'xss'
  | 'hardcoded-secret'
  | 'insecure-crypto'
  | 'cors-misconfiguration'
  | 'weak-authentication'
  | 'path-traversal'
  | 'insecure-deserialization'
  | 'xxe'
  | 'broken-access-control';

export interface Finding {
  id: string;
  type: VulnerabilityType;
  severity: Severity;
  file: string;
  line: number;
  column: number;
  code: string;
  message: string;
  recommendation: string;
  cwe?: string;
  owasp?: string;
  autoFixAvailable: boolean;
}

export interface SecurityReport {
  projectPath: string;
  scanDate: string;
  totalFindings: number;
  bySeverity: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
  byType: Record<VulnerabilityType, number>;
  findings: Finding[];
  recommendations: string[];
  scanDurationMs: number;
  filesScanned: number;
}

export interface ScanOptions {
  projectPath: string;
  language?: 'typescript' | 'javascript' | 'csharp' | 'python' | 'all';
  includePatterns?: string[];
  excludePatterns?: string[];
  maxFindings?: number;
  severityThreshold?: Severity;
  autoFix?: boolean;
}

export interface Pattern {
  regex: RegExp;
  type: VulnerabilityType;
  severity: Severity;
  message: string;
  recommendation: string;
  cwe?: string;
  owasp?: string;
}

export interface Scanner {
  name: string;
  fileExtensions: string[];
  scan(filePath: string, content: string): Finding[];
}
