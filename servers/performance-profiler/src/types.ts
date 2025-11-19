/**
 * Types for Performance Profiler
 */

export interface PerformanceIssue {
  type: IssueType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  filePath: string;
  lineNumber: number;
  code: string;
  description: string;
  suggestion: string;
  estimatedImpact: string;
}

export type IssueType =
  | 'n-plus-one'
  | 'unbounded-loop'
  | 'memory-leak'
  | 'sync-io'
  | 'missing-index'
  | 'large-payload'
  | 'missing-cache'
  | 'blocking-call'
  | 'inefficient-regex'
  | 'unnecessary-rerender';

export interface AnalyzeOptions {
  projectPath: string;
  fileTypes?: string[];
  includeTests?: boolean;
  maxFiles?: number;
}

export interface ProfileOptions {
  projectPath: string;
  entryPoint?: string;
  duration?: number;
  sampleRate?: number;
}

export interface AnalyzeResult {
  success: boolean;
  issues: PerformanceIssue[];
  summary: {
    totalFiles: number;
    filesAnalyzed: number;
    issuesFound: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  };
  recommendations: string[];
  error?: string;
}

export interface ProfileResult {
  success: boolean;
  metrics?: {
    cpuUsage: number;
    memoryUsage: number;
    eventLoopLag: number;
    gcPauses: number[];
  };
  hotspots?: Hotspot[];
  error?: string;
}

export interface Hotspot {
  function: string;
  file: string;
  line: number;
  selfTime: number;
  totalTime: number;
  calls: number;
}

export interface GenerateReportOptions {
  issues: PerformanceIssue[];
  format: 'markdown' | 'json' | 'html';
  outputPath?: string;
}

export interface GenerateReportResult {
  success: boolean;
  content?: string;
  outputPath?: string;
  error?: string;
}
