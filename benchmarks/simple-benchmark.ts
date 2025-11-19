#!/usr/bin/env npx tsx

/**
 * Simple Performance Benchmark for New MCP Servers
 *
 * Tests Performance Profiler and Code Migration Assistant
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BenchmarkResult {
  server: string;
  operation: string;
  filesAnalyzed: number;
  executionTimeMs: number;
  issuesFound: number;
  success: boolean;
  error?: string;
}

async function benchmark() {
  const projectPath = path.resolve(__dirname, '..');
  const results: BenchmarkResult[] = [];

  console.log('\n📊 Simple Benchmark for New MCP Servers');
  console.log(`   Project: ${projectPath}\n`);

  // Test Performance Profiler
  console.log('   Performance Profiler...');
  try {
    const { PerformanceAnalyzer } = await import(
      '../servers/performance-profiler/build/analyzers/performance-analyzer.js'
    );
    const analyzer = new PerformanceAnalyzer();

    const startTime = Date.now();
    const result = await analyzer.analyze({
      projectPath,
      maxFiles: 500
    });
    const endTime = Date.now();

    results.push({
      server: 'performance-profiler',
      operation: 'analyze_performance',
      filesAnalyzed: result.summary?.filesAnalyzed || 0,
      executionTimeMs: endTime - startTime,
      issuesFound: result.issues?.length || 0,
      success: result.success
    });

    console.log(`   ✅ ${endTime - startTime}ms | ${result.summary?.filesAnalyzed || 0} files | ${result.issues?.length || 0} issues`);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    results.push({
      server: 'performance-profiler',
      operation: 'analyze_performance',
      filesAnalyzed: 0,
      executionTimeMs: 0,
      issuesFound: 0,
      success: false,
      error
    });
    console.log(`   ❌ ${error.substring(0, 60)}`);
  }

  // Test Code Migration Assistant
  console.log('   Code Migration Assistant...');
  try {
    const { MigrationAnalyzer } = await import(
      '../servers/code-migration-assistant/build/analyzers/migration-analyzer.js'
    );
    const analyzer = new MigrationAnalyzer();

    const startTime = Date.now();
    const result = await analyzer.analyze({
      projectPath,
      maxFiles: 500
    });
    const endTime = Date.now();

    results.push({
      server: 'code-migration-assistant',
      operation: 'analyze_migration',
      filesAnalyzed: result.summary?.filesAnalyzed || 0,
      executionTimeMs: endTime - startTime,
      issuesFound: result.issues?.length || 0,
      success: result.success
    });

    console.log(`   ✅ ${endTime - startTime}ms | ${result.summary?.filesAnalyzed || 0} files | ${result.issues?.length || 0} issues`);
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    results.push({
      server: 'code-migration-assistant',
      operation: 'analyze_migration',
      filesAnalyzed: 0,
      executionTimeMs: 0,
      issuesFound: 0,
      success: false,
      error
    });
    console.log(`   ❌ ${error.substring(0, 60)}`);
  }

  // Generate report
  let report = '# MCP Server Benchmark Results\n\n';
  report += `Generated: ${new Date().toISOString()}\n`;
  report += `Project: ${projectPath}\n\n`;

  report += '## Results\n\n';
  report += '| Server | Operation | Files | Time (ms) | Issues | Status |\n';
  report += '|--------|-----------|-------|-----------|--------|--------|\n';

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    report += `| ${result.server} | ${result.operation} | ${result.filesAnalyzed} | ${result.executionTimeMs} | ${result.issuesFound} | ${status} |\n`;
  }

  // Statistics
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    const totalTime = successful.reduce((sum, r) => sum + r.executionTimeMs, 0);
    const totalFiles = successful[0]?.filesAnalyzed || 0;
    const filesPerSecond = (totalFiles / (totalTime / 1000)).toFixed(1);

    report += '\n## Performance Metrics\n\n';
    report += `- **Total execution time**: ${totalTime}ms\n`;
    report += `- **Files analyzed**: ${totalFiles}\n`;
    report += `- **Processing speed**: ${filesPerSecond} files/second\n`;
    report += `- **Average per server**: ${(totalTime / successful.length).toFixed(0)}ms\n`;
  }

  // Errors
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    report += '\n## Errors\n\n';
    for (const result of failed) {
      report += `### ${result.server}\n`;
      report += `Error: ${result.error}\n\n`;
    }
  }

  // Save report
  const reportPath = path.join(__dirname, 'BENCHMARK-RESULTS.md');
  fs.writeFileSync(reportPath, report);
  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Save JSON
  const jsonPath = path.join(__dirname, 'benchmark-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(results, null, 2));
  console.log(`📊 JSON saved to: ${jsonPath}`);
}

benchmark().catch(console.error);
