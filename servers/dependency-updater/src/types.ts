/**
 * Dependency Updater Types
 */

export type PackageManager = 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'dotnet' | 'cargo' | 'go';
export type UpdateType = 'patch' | 'minor' | 'major' | 'all';

export interface OutdatedDependency {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  updateType: 'patch' | 'minor' | 'major';
  breaking: boolean;
  changelog?: string;
  homepage?: string;
}

export interface CheckOutdatedOptions {
  projectPath: string;
  packageManager?: PackageManager;
  updateType?: UpdateType;
}

export interface CheckOutdatedResult {
  packageManager: PackageManager;
  count: number;
  dependencies: OutdatedDependency[];
  summary: {
    patch: number;
    minor: number;
    major: number;
  };
  warnings: string[];
}

export interface UpdateDependenciesOptions {
  projectPath: string;
  dependencies: string[];
  runTests?: boolean;
  autoRollback?: boolean;
  batchSize?: number;
}

export interface UpdateResult {
  success: boolean;
  updated: string[];
  failed: string[];
  skipped: string[];
  testsPassed: boolean;
  changelogs: Record<string, string[]>;
  warnings: string[];
  error?: string;
}

export interface BreakingChange {
  package: string;
  fromVersion: string;
  toVersion: string;
  changes: string[];
  migrationGuide?: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AnalyzeBreakingChangesOptions {
  packageName: string;
  fromVersion: string;
  toVersion: string;
  packageManager?: PackageManager;
}

export interface AnalyzeBreakingChangesResult {
  hasBreakingChanges: boolean;
  changes: BreakingChange[];
  recommendations: string[];
}
