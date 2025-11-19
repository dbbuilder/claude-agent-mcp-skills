#!/usr/bin/env npx tsx

/**
 * Performance Benchmark for MCP Servers
 *
 * Tests execution time and memory usage of various servers
 * on real codebases of different sizes.
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface BenchmarkResult {
  server: string;
  operation: string;
  projectPath: string;
  filesAnalyzed: number;
  executionTimeMs: number;
  memoryUsedMB: number;
  issuesFound?: number;
  success: boolean;
  error?: string;
}

interface ServerConfig {
  name: string;
  path: string;
  tools: {
    name: string;
    params: Record<string, any>;
  }[];
}

const SERVERS: ServerConfig[] = [
  {
    name: 'api-doc-generator',
    path: '../servers/api-doc-generator',
    tools: [
      {
        name: 'generate_api_docs',
        params: { format: 'both' }
      }
    ]
  },
  {
    name: 'security-auditor',
    path: '../servers/security-auditor',
    tools: [
      {
        name: 'audit_security',
        params: { severity: 'low' }
      }
    ]
  },
  {
    name: 'integration-test-generator',
    path: '../servers/integration-test-generator',
    tools: [
      {
        name: 'generate_tests',
        params: { framework: 'jest' }
      }
    ]
  },
  {
    name: 'config-template-generator',
    path: '../servers/config-template-generator',
    tools: [
      {
        name: 'generate_config_template',
        params: { format: 'env' }
      }
    ]
  },
  {
    name: 'docker-config-generator',
    path: '../servers/docker-config-generator',
    tools: [
      {
        name: 'generate_dockerfile',
        params: { optimize: true }
      }
    ]
  },
  {
    name: 'performance-profiler',
    path: '../servers/performance-profiler',
    tools: [
      {
        name: 'analyze_performance',
        params: { maxFiles: 500 }
      }
    ]
  },
  {
    name: 'code-migration-assistant',
    path: '../servers/code-migration-assistant',
    tools: [
      {
        name: 'analyze_migration',
        params: { maxFiles: 500 }
      }
    ]
  }
];

class Benchmark {
  private results: BenchmarkResult[] = [];
  private projectPath: string;

  constructor(projectPath: string) {
    this.projectPath = projectPath;
  }

  /**
   * Count files in project
   */
  private countFiles(): number {
    try {
      const result = execSync(
        `find "${this.projectPath}" -type f \\( -name "*.ts" -o -name "*.js" -o -name "*.tsx" -o -name "*.jsx" \\) ! -path "*/node_modules/*" ! -path "*/dist/*" ! -path "*/build/*" | wc -l`,
        { encoding: 'utf-8' }
      );
      return parseInt(result.trim(), 10);
    } catch {
      return 0;
    }
  }

  /**
   * Run benchmark for a specific server
   */
  private async benchmarkServer(server: ServerConfig): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const tool of server.tools) {
      const startTime = process.hrtime.bigint();
      const startMemory = process.memoryUsage().heapUsed;

      let success = false;
      let issuesFound: number | undefined;
      let error: string | undefined;

      try {
        // Build and import the server's analyzer
        const serverPath = path.resolve(__dirname, server.path);

        // Different import based on server type
        if (server.name === 'performance-profiler') {
          const { PerformanceAnalyzer } = await import(
            path.join(serverPath, 'build/analyzers/performance-analyzer.js')
          );
          const analyzer = new PerformanceAnalyzer();
          const result = await analyzer.analyze({
            projectPath: this.projectPath,
            ...tool.params
          });
          success = result.success;
          issuesFound = result.issues?.length || 0;
        } else if (server.name === 'code-migration-assistant') {
          const { MigrationAnalyzer } = await import(
            path.join(serverPath, 'build/analyzers/migration-analyzer.js')
          );
          const analyzer = new MigrationAnalyzer();
          const result = await analyzer.analyze({
            projectPath: this.projectPath,
            ...tool.params
          });
          success = result.success;
          issuesFound = result.issues?.length || 0;
        } else if (server.name === 'security-auditor') {
          const { SecurityAuditor } = await import(
            path.join(serverPath, 'build/auditors/security-auditor.js')
          );
          const auditor = new SecurityAuditor();
          const result = await auditor.audit({
            projectPath: this.projectPath,
            ...tool.params
          });
          success = result.success;
          issuesFound = result.issues?.length || 0;
        } else if (server.name === 'api-doc-generator') {
          const { APIDocGenerator } = await import(
            path.join(serverPath, 'build/generators/api-doc-generator.js')
          );
          const generator = new APIDocGenerator();
          const result = await generator.generate({
            projectPath: this.projectPath,
            ...tool.params
          });
          success = result.success;
          issuesFound = result.endpoints?.length || 0;
        } else if (server.name === 'integration-test-generator') {
          const { APIAnalyzer } = await import(
            path.join(serverPath, 'build/analyzers/api-analyzer.js')
          );
          const analyzer = new APIAnalyzer();
          const result = await analyzer.analyze({
            projectPath: this.projectPath,
            ...tool.params
          });
          success = true;
          issuesFound = result.endpoints?.length || 0;
        } else if (server.name === 'config-template-generator') {
          const { VariableDiscoverer } = await import(
            path.join(serverPath, 'build/analyzers/variable-discoverer.js')
          );
          const discoverer = new VariableDiscoverer();
          const result = await discoverer.discover({
            projectPath: this.projectPath,
            ...tool.params
          });
          success = result.success;
          issuesFound = result.variables?.length || 0;
        } else if (server.name === 'docker-config-generator') {
          const { ProjectAnalyzer } = await import(
            path.join(serverPath, 'build/analyzers/project-analyzer.js')
          );
          const analyzer = new ProjectAnalyzer();
          const result = await analyzer.analyze(this.projectPath);
          success = true;
          issuesFound = result.services?.length || 1;
        } else {
          // Skip unknown servers
          continue;
        }
      } catch (e) {
        error = e instanceof Error ? e.message : String(e);
        success = false;
      }

      const endTime = process.hrtime.bigint();
      const endMemory = process.memoryUsage().heapUsed;

      results.push({
        server: server.name,
        operation: tool.name,
        projectPath: this.projectPath,
        filesAnalyzed: this.countFiles(),
        executionTimeMs: Number(endTime - startTime) / 1_000_000,
        memoryUsedMB: (endMemory - startMemory) / 1_048_576,
        issuesFound,
        success,
        error
      });
    }

    return results;
  }

  /**
   * Run all benchmarks
   */
  async run(): Promise<void> {
    console.log(`\n📊 Benchmarking MCP Servers on: ${this.projectPath}`);
    console.log(`   Files to analyze: ${this.countFiles()}\n`);

    for (const server of SERVERS) {
      process.stdout.write(`   ${server.name}... `);

      const results = await this.benchmarkServer(server);
      this.results.push(...results);

      const result = results[0];
      if (result) {
        if (result.success) {
          console.log(`✅ ${result.executionTimeMs.toFixed(0)}ms | ${result.memoryUsedMB.toFixed(1)}MB | ${result.issuesFound ?? 0} items`);
        } else {
          console.log(`❌ ${result.error?.substring(0, 50) || 'Failed'}`);
        }
      }
    }
  }

  /**
   * Get results
   */
  getResults(): BenchmarkResult[] {
    return this.results;
  }
}

/**
 * Generate benchmark report
 */
function generateReport(results: BenchmarkResult[]): string {
  let report = '# MCP Server Benchmark Report\n\n';
  report += `Generated: ${new Date().toISOString()}\n\n`;

  // Summary table
  report += '## Summary\n\n';
  report += '| Server | Operation | Time (ms) | Memory (MB) | Items | Status |\n';
  report += '|--------|-----------|-----------|-------------|-------|--------|\n';

  for (const result of results) {
    const status = result.success ? '✅' : '❌';
    report += `| ${result.server} | ${result.operation} | ${result.executionTimeMs.toFixed(0)} | ${result.memoryUsedMB.toFixed(1)} | ${result.issuesFound ?? '-'} | ${status} |\n`;
  }

  // Statistics
  const successful = results.filter(r => r.success);
  if (successful.length > 0) {
    const avgTime = successful.reduce((sum, r) => sum + r.executionTimeMs, 0) / successful.length;
    const avgMemory = successful.reduce((sum, r) => sum + r.memoryUsedMB, 0) / successful.length;
    const maxTime = Math.max(...successful.map(r => r.executionTimeMs));
    const maxMemory = Math.max(...successful.map(r => r.memoryUsedMB));

    report += '\n## Statistics\n\n';
    report += `- **Average execution time**: ${avgTime.toFixed(0)}ms\n`;
    report += `- **Max execution time**: ${maxTime.toFixed(0)}ms\n`;
    report += `- **Average memory usage**: ${avgMemory.toFixed(1)}MB\n`;
    report += `- **Max memory usage**: ${maxMemory.toFixed(1)}MB\n`;
    report += `- **Success rate**: ${(successful.length / results.length * 100).toFixed(0)}%\n`;
  }

  // Errors
  const failed = results.filter(r => !r.success);
  if (failed.length > 0) {
    report += '\n## Errors\n\n';
    for (const result of failed) {
      report += `### ${result.server}\n`;
      report += `- Operation: ${result.operation}\n`;
      report += `- Error: ${result.error}\n\n`;
    }
  }

  return report;
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Default: benchmark on the SDK itself
    args.push(path.resolve(__dirname, '..'));
  }

  const allResults: BenchmarkResult[] = [];

  for (const projectPath of args) {
    if (!fs.existsSync(projectPath)) {
      console.error(`❌ Project not found: ${projectPath}`);
      continue;
    }

    const benchmark = new Benchmark(projectPath);
    await benchmark.run();
    allResults.push(...benchmark.getResults());
  }

  // Generate and save report
  const report = generateReport(allResults);
  const reportPath = path.join(__dirname, 'BENCHMARK-RESULTS.md');
  fs.writeFileSync(reportPath, report);

  console.log(`\n📄 Report saved to: ${reportPath}`);

  // Also output JSON results
  const jsonPath = path.join(__dirname, 'benchmark-results.json');
  fs.writeFileSync(jsonPath, JSON.stringify(allResults, null, 2));
  console.log(`📊 JSON results saved to: ${jsonPath}`);
}

main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
