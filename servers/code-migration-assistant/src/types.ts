/**
 * Types for Code Migration Assistant
 */

export interface MigrationIssue {
  type: MigrationIssueType;
  severity: 'info' | 'warning' | 'error' | 'breaking';
  filePath: string;
  lineNumber: number;
  code: string;
  description: string;
  suggestion: string;
  autoFixable: boolean;
  fixedCode?: string;
}

export type MigrationIssueType =
  | 'deprecated-api'
  | 'breaking-change'
  | 'removed-feature'
  | 'syntax-change'
  | 'import-change'
  | 'type-change'
  | 'config-change'
  | 'dependency-update'
  | 'behavior-change';

export interface MigrationPath {
  from: string;
  to: string;
  framework: string;
  breakingChanges: BreakingChange[];
  deprecations: Deprecation[];
  newFeatures: string[];
}

export interface BreakingChange {
  name: string;
  description: string;
  migration: string;
  pattern?: RegExp;
  replacement?: string;
}

export interface Deprecation {
  name: string;
  description: string;
  alternative: string;
  removalVersion?: string;
  pattern?: RegExp;
}

export interface AnalyzeMigrationOptions {
  projectPath: string;
  fromVersion?: string;
  toVersion?: string;
  framework?: string;
  fileTypes?: string[];
  maxFiles?: number;
}

export interface AnalyzeMigrationResult {
  success: boolean;
  issues: MigrationIssue[];
  summary: {
    totalFiles: number;
    filesAnalyzed: number;
    issuesFound: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
    autoFixableCount: number;
  };
  migrationPath?: MigrationPath;
  recommendations: string[];
  error?: string;
}

export interface ApplyFixesOptions {
  projectPath: string;
  issues: MigrationIssue[];
  dryRun?: boolean;
  backup?: boolean;
}

export interface ApplyFixesResult {
  success: boolean;
  fixesApplied: number;
  filesModified: string[];
  backupPath?: string;
  error?: string;
}

export interface DetectedFramework {
  name: string;
  version: string;
  configFiles: string[];
}

export interface GenerateMigrationPlanOptions {
  projectPath: string;
  targetFramework: string;
  targetVersion: string;
}

export interface MigrationPlanResult {
  success: boolean;
  plan?: {
    steps: MigrationStep[];
    estimatedEffort: string;
    risks: string[];
    prerequisites: string[];
  };
  error?: string;
}

export interface MigrationStep {
  order: number;
  title: string;
  description: string;
  commands?: string[];
  manualSteps?: string[];
  affectedFiles?: string[];
}
