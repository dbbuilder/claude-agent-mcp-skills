/**
 * Performance Analyzer
 * Analyzes code for common performance issues
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { AnalyzeOptions, AnalyzeResult, PerformanceIssue, IssueType } from '../types.js';

export class PerformanceAnalyzer {
  /**
   * Analyze project for performance issues
   */
  async analyze(options: AnalyzeOptions): Promise<AnalyzeResult> {
    const {
      projectPath,
      fileTypes = ['ts', 'js', 'tsx', 'jsx', 'py'],
      includeTests = false,
      maxFiles = 500,
    } = options;

    try {
      // Find source files
      const patterns = fileTypes.map(ext => `**/*.${ext}`);
      const ignore = includeTests
        ? ['**/node_modules/**', '**/dist/**', '**/build/**']
        : ['**/node_modules/**', '**/dist/**', '**/build/**', '**/*.test.*', '**/*.spec.*', '**/tests/**', '**/__tests__/**'];

      let files: string[] = [];
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: projectPath,
          absolute: true,
          ignore,
        });
        files.push(...matches);
      }

      // Limit files
      files = files.slice(0, maxFiles);

      const issues: PerformanceIssue[] = [];
      let filesAnalyzed = 0;

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileIssues = this.analyzeFile(content, filePath);
        issues.push(...fileIssues);
        filesAnalyzed++;
      }

      // Generate summary
      const summary = this.generateSummary(issues, files.length, filesAnalyzed);
      const recommendations = this.generateRecommendations(issues);

      return {
        success: true,
        issues,
        summary,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        issues: [],
        summary: {
          totalFiles: 0,
          filesAnalyzed: 0,
          issuesFound: 0,
          bySeverity: {},
          byType: {},
        },
        recommendations: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Analyze single file for performance issues
   */
  private analyzeFile(content: string, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];
    const lines = content.split('\n');
    const ext = path.extname(filePath);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check for various performance issues
      const lineIssues = [
        ...this.checkNPlusOne(line, lineNumber, filePath, ext),
        ...this.checkSyncIO(line, lineNumber, filePath, ext),
        ...this.checkInefficientRegex(line, lineNumber, filePath),
        ...this.checkMissingCache(line, lineNumber, filePath),
        ...this.checkBlockingCalls(line, lineNumber, filePath, ext),
        ...this.checkMemoryLeaks(line, lineNumber, filePath, ext),
        ...this.checkLargePayloads(line, lineNumber, filePath),
        ...this.checkUnnecessaryRerenders(line, lineNumber, filePath, ext),
      ];

      issues.push(...lineIssues);
    }

    return issues;
  }

  /**
   * Check for N+1 query patterns
   */
  private checkNPlusOne(line: string, lineNumber: number, filePath: string, ext: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Database queries inside loops
    if (line.match(/for\s*\(|while\s*\(|\.forEach\(|\.map\(/)) {
      // Check next few lines for database calls
      return issues; // Would need context
    }

    // Individual queries that could be batched
    const queryPatterns = [
      /\.findOne\(/,
      /\.findById\(/,
      /SELECT.*WHERE.*=\s*\?/i,
      /await\s+\w+\.get\(/,
    ];

    for (const pattern of queryPatterns) {
      if (pattern.test(line) && (line.includes('forEach') || line.includes('map('))) {
        issues.push({
          type: 'n-plus-one',
          severity: 'high',
          filePath,
          lineNumber,
          code: line.trim(),
          description: 'Potential N+1 query pattern detected',
          suggestion: 'Consider using batch queries or eager loading to reduce database round trips',
          estimatedImpact: 'Could reduce query time by 10-100x for large datasets',
        });
      }
    }

    return issues;
  }

  /**
   * Check for synchronous I/O operations
   */
  private checkSyncIO(line: string, lineNumber: number, filePath: string, ext: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    const syncPatterns = [
      { pattern: /fs\.readFileSync\(/, name: 'readFileSync' },
      { pattern: /fs\.writeFileSync\(/, name: 'writeFileSync' },
      { pattern: /fs\.readdirSync\(/, name: 'readdirSync' },
      { pattern: /fs\.statSync\(/, name: 'statSync' },
      { pattern: /fs\.existsSync\(/, name: 'existsSync' },
      { pattern: /execSync\(/, name: 'execSync' },
      { pattern: /spawnSync\(/, name: 'spawnSync' },
    ];

    for (const { pattern, name } of syncPatterns) {
      if (pattern.test(line)) {
        issues.push({
          type: 'sync-io',
          severity: 'medium',
          filePath,
          lineNumber,
          code: line.trim(),
          description: `Synchronous I/O operation: ${name}`,
          suggestion: `Use async version (${name.replace('Sync', '')} with await/promises) to avoid blocking the event loop`,
          estimatedImpact: 'Blocking operations can cause latency spikes and reduce throughput',
        });
      }
    }

    return issues;
  }

  /**
   * Check for inefficient regex patterns
   */
  private checkInefficientRegex(line: string, lineNumber: number, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Catastrophic backtracking patterns
    const dangerousPatterns = [
      /\(\.\*\)\+/,
      /\(\.\+\)\+/,
      /\(\[^\\]\]\*\)\+/,
      /\(\w\+\)\+/,
    ];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(line)) {
        issues.push({
          type: 'inefficient-regex',
          severity: 'high',
          filePath,
          lineNumber,
          code: line.trim(),
          description: 'Potentially catastrophic regex backtracking',
          suggestion: 'Use atomic groups, possessive quantifiers, or rewrite the pattern to avoid nested quantifiers',
          estimatedImpact: 'Can cause exponential time complexity and hang the process',
        });
      }
    }

    // Regex in hot paths
    if (line.includes('new RegExp(') && !line.includes('const ') && !line.includes('let ')) {
      issues.push({
        type: 'inefficient-regex',
        severity: 'low',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Dynamic regex creation in potentially hot path',
        suggestion: 'Cache compiled regex outside of loops/frequently called functions',
        estimatedImpact: 'Regex compilation is expensive; caching can improve performance',
      });
    }

    return issues;
  }

  /**
   * Check for missing caching opportunities
   */
  private checkMissingCache(line: string, lineNumber: number, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Expensive computations that could be cached
    const expensiveOps = [
      { pattern: /JSON\.parse\(/, name: 'JSON parsing' },
      { pattern: /JSON\.stringify\(/, name: 'JSON stringification' },
      { pattern: /\.sort\(/, name: 'Array sorting' },
      { pattern: /\.reduce\(/, name: 'Array reduction' },
    ];

    for (const { pattern, name } of expensiveOps) {
      if (pattern.test(line) && (line.includes('return ') || line.includes('res.json'))) {
        // Only flag if it looks like it's in a request handler
        if (filePath.includes('controller') || filePath.includes('route') || filePath.includes('handler')) {
          issues.push({
            type: 'missing-cache',
            severity: 'low',
            filePath,
            lineNumber,
            code: line.trim(),
            description: `Expensive operation (${name}) in request handler`,
            suggestion: 'Consider caching results if data doesn\'t change frequently',
            estimatedImpact: 'Caching can reduce response time and CPU usage',
          });
        }
      }
    }

    return issues;
  }

  /**
   * Check for blocking calls
   */
  private checkBlockingCalls(line: string, lineNumber: number, filePath: string, ext: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Heavy computations without yielding
    if (line.match(/while\s*\(true\)/) || line.match(/for\s*\(;;\)/)) {
      issues.push({
        type: 'blocking-call',
        severity: 'high',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Infinite loop detected',
        suggestion: 'Ensure proper exit conditions and consider using setImmediate/setTimeout for long-running operations',
        estimatedImpact: 'Can block the event loop indefinitely',
      });
    }

    // Sleep/delay implementations
    if (line.includes('while') && (line.includes('Date.now()') || line.includes('new Date()'))) {
      issues.push({
        type: 'blocking-call',
        severity: 'high',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Busy-wait loop for timing',
        suggestion: 'Use setTimeout or setInterval instead of busy-waiting',
        estimatedImpact: 'Busy-waiting wastes CPU cycles and blocks other operations',
      });
    }

    return issues;
  }

  /**
   * Check for memory leak patterns
   */
  private checkMemoryLeaks(line: string, lineNumber: number, filePath: string, ext: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Event listeners without cleanup
    if (line.includes('.addEventListener(') || line.includes('.on(')) {
      if (!line.includes('removeEventListener') && !line.includes('.off(') && !line.includes('.removeListener(')) {
        issues.push({
          type: 'memory-leak',
          severity: 'medium',
          filePath,
          lineNumber,
          code: line.trim(),
          description: 'Event listener without apparent cleanup',
          suggestion: 'Ensure event listeners are removed when no longer needed (e.g., in componentWillUnmount or cleanup functions)',
          estimatedImpact: 'Unreleased listeners can cause memory leaks over time',
        });
      }
    }

    // Global variable assignments
    if (line.match(/^\s*\w+\s*=\s*/) && !line.includes('const ') && !line.includes('let ') && !line.includes('var ')) {
      if (!line.includes('this.') && !line.includes('module.exports') && !line.includes('exports.')) {
        issues.push({
          type: 'memory-leak',
          severity: 'low',
          filePath,
          lineNumber,
          code: line.trim(),
          description: 'Possible implicit global variable',
          suggestion: 'Use const/let to explicitly declare variables',
          estimatedImpact: 'Global variables persist for application lifetime and can leak memory',
        });
      }
    }

    return issues;
  }

  /**
   * Check for large payload issues
   */
  private checkLargePayloads(line: string, lineNumber: number, filePath: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    // Returning full arrays without pagination
    if (line.includes('res.json(') && (line.includes('findAll') || line.includes('find({})') || line.includes('SELECT *'))) {
      issues.push({
        type: 'large-payload',
        severity: 'medium',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Returning potentially unbounded result set',
        suggestion: 'Add pagination (limit/offset) to prevent large payload responses',
        estimatedImpact: 'Large payloads increase memory usage, network latency, and client processing time',
      });
    }

    return issues;
  }

  /**
   * Check for unnecessary re-renders (React)
   */
  private checkUnnecessaryRerenders(line: string, lineNumber: number, filePath: string, ext: string): PerformanceIssue[] {
    const issues: PerformanceIssue[] = [];

    if (ext !== '.tsx' && ext !== '.jsx') return issues;

    // Inline object/array creation in JSX
    if (line.includes('style={{') || line.includes('className={{')) {
      issues.push({
        type: 'unnecessary-rerender',
        severity: 'low',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Inline style object in JSX',
        suggestion: 'Move style objects outside render function or use useMemo to prevent unnecessary re-renders',
        estimatedImpact: 'Creates new object reference on every render, potentially causing child re-renders',
      });
    }

    // Inline function in JSX
    if (line.match(/onClick=\{.*=>/)) {
      issues.push({
        type: 'unnecessary-rerender',
        severity: 'low',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Inline arrow function in JSX event handler',
        suggestion: 'Use useCallback or move handler outside render function',
        estimatedImpact: 'Creates new function reference on every render',
      });
    }

    return issues;
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(
    issues: PerformanceIssue[],
    totalFiles: number,
    filesAnalyzed: number
  ): AnalyzeResult['summary'] {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};

    for (const issue of issues) {
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      byType[issue.type] = (byType[issue.type] || 0) + 1;
    }

    return {
      totalFiles,
      filesAnalyzed,
      issuesFound: issues.length,
      bySeverity,
      byType,
    };
  }

  /**
   * Generate recommendations based on issues
   */
  private generateRecommendations(issues: PerformanceIssue[]): string[] {
    const recommendations: string[] = [];
    const typeCount = new Map<IssueType, number>();

    for (const issue of issues) {
      typeCount.set(issue.type, (typeCount.get(issue.type) || 0) + 1);
    }

    // Generate recommendations based on most common issues
    if ((typeCount.get('sync-io') || 0) > 3) {
      recommendations.push('Consider refactoring synchronous I/O operations to use async/await pattern for better performance');
    }

    if ((typeCount.get('n-plus-one') || 0) > 0) {
      recommendations.push('Review database queries for N+1 patterns; consider using batch queries or eager loading');
    }

    if ((typeCount.get('memory-leak') || 0) > 2) {
      recommendations.push('Audit event listeners and global variables to prevent memory leaks');
    }

    if ((typeCount.get('unnecessary-rerender') || 0) > 5) {
      recommendations.push('Use React.memo, useMemo, and useCallback to optimize component rendering');
    }

    if ((typeCount.get('missing-cache') || 0) > 2) {
      recommendations.push('Implement caching strategy for expensive operations in request handlers');
    }

    if (recommendations.length === 0) {
      recommendations.push('No major performance issues detected. Continue following best practices!');
    }

    return recommendations;
  }
}
