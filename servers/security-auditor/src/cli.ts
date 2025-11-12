#!/usr/bin/env node
/**
 * Security Auditor CLI
 * Command-line interface for running security scans
 */

import * as fs from 'fs';
import * as path from 'path';
import { SecurityAuditor } from './auditor';
import { ScanOptions } from './types';

interface CliArgs {
  projectPath: string;
  language?: 'typescript' | 'javascript' | 'csharp' | 'python' | 'all';
  output?: string;
  format?: 'json' | 'text' | 'markdown';
  severityThreshold?: 'low' | 'medium' | 'high' | 'critical';
  maxFindings?: number;
}

/**
 * Parse command-line arguments
 */
function parseArgs(): CliArgs {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    printHelp();
    process.exit(0);
  }

  const projectPath = args[0];
  const cliArgs: CliArgs = { projectPath };

  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    const nextArg = args[i + 1];

    switch (arg) {
      case '--language':
      case '-l':
        cliArgs.language = nextArg as any;
        i++;
        break;
      case '--output':
      case '-o':
        cliArgs.output = nextArg;
        i++;
        break;
      case '--format':
      case '-f':
        cliArgs.format = nextArg as any;
        i++;
        break;
      case '--severity':
      case '-s':
        cliArgs.severityThreshold = nextArg as any;
        i++;
        break;
      case '--max-findings':
      case '-m':
        cliArgs.maxFindings = parseInt(nextArg, 10);
        i++;
        break;
    }
  }

  return cliArgs;
}

/**
 * Print help message
 */
function printHelp() {
  console.log(`
Security Auditor - OWASP Top 10 Scanner

Usage:
  npx tsx src/cli.ts <project-path> [options]

Options:
  -l, --language <lang>       Language to scan (typescript|javascript|csharp|python|all)
                              Default: all
  -o, --output <file>         Output file path (stdout if not specified)
  -f, --format <format>       Output format (json|text|markdown)
                              Default: text
  -s, --severity <level>      Minimum severity level (low|medium|high|critical)
                              Default: low (all findings)
  -m, --max-findings <num>    Maximum number of findings to report
  -h, --help                  Show this help message

Examples:
  # Scan entire project
  npx tsx src/cli.ts /path/to/project

  # Scan only TypeScript files
  npx tsx src/cli.ts /path/to/project --language typescript

  # Generate JSON report
  npx tsx src/cli.ts /path/to/project --format json --output report.json

  # Show only critical and high severity findings
  npx tsx src/cli.ts /path/to/project --severity high

  # Limit to top 50 findings
  npx tsx src/cli.ts /path/to/project --max-findings 50
`);
}

/**
 * Format report as text
 */
function formatText(report: any): string {
  const lines: string[] = [];

  lines.push('=====================================');
  lines.push('    SECURITY AUDIT REPORT');
  lines.push('=====================================');
  lines.push('');
  lines.push(`Project: ${report.projectPath}`);
  lines.push(`Scan Date: ${new Date(report.scanDate).toLocaleString()}`);
  lines.push(`Files Scanned: ${report.filesScanned}`);
  lines.push(`Scan Duration: ${report.scanDurationMs}ms`);
  lines.push('');
  lines.push('SUMMARY');
  lines.push('-------');
  lines.push(`Total Findings: ${report.totalFindings}`);
  lines.push(`  Critical: ${report.bySeverity.critical}`);
  lines.push(`  High: ${report.bySeverity.high}`);
  lines.push(`  Medium: ${report.bySeverity.medium}`);
  lines.push(`  Low: ${report.bySeverity.low}`);
  lines.push('');

  if (report.findings.length > 0) {
    lines.push('FINDINGS');
    lines.push('--------');
    lines.push('');

    for (const finding of report.findings) {
      const severityIcons: Record<string, string> = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
      };
      const severityIcon = severityIcons[finding.severity];

      lines.push(`${severityIcon} [${finding.severity.toUpperCase()}] ${finding.type}`);
      lines.push(`   ${finding.message}`);
      lines.push(`   File: ${finding.file}:${finding.line}:${finding.column}`);
      lines.push(`   Code: ${finding.code}`);
      lines.push(`   Fix: ${finding.recommendation}`);
      if (finding.owasp) {
        lines.push(`   OWASP: ${finding.owasp}`);
      }
      if (finding.cwe) {
        lines.push(`   CWE: ${finding.cwe}`);
      }
      lines.push('');
    }
  }

  if (report.recommendations.length > 0) {
    lines.push('RECOMMENDATIONS');
    lines.push('---------------');
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`• ${rec}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Format report as markdown
 */
function formatMarkdown(report: any): string {
  const lines: string[] = [];

  lines.push('# Security Audit Report');
  lines.push('');
  lines.push(`**Project:** ${report.projectPath}`);
  lines.push(`**Scan Date:** ${new Date(report.scanDate).toLocaleString()}`);
  lines.push(`**Files Scanned:** ${report.filesScanned}`);
  lines.push(`**Scan Duration:** ${report.scanDurationMs}ms`);
  lines.push('');
  lines.push('## Summary');
  lines.push('');
  lines.push(`Total Findings: **${report.totalFindings}**`);
  lines.push('');
  lines.push('| Severity | Count |');
  lines.push('|----------|-------|');
  lines.push(`| Critical | ${report.bySeverity.critical} |`);
  lines.push(`| High     | ${report.bySeverity.high} |`);
  lines.push(`| Medium   | ${report.bySeverity.medium} |`);
  lines.push(`| Low      | ${report.bySeverity.low} |`);
  lines.push('');

  if (report.findings.length > 0) {
    lines.push('## Findings');
    lines.push('');

    for (const finding of report.findings) {
      const severityIcons: Record<string, string> = {
        critical: '🔴',
        high: '🟠',
        medium: '🟡',
        low: '🔵',
      };
      const severityIcon = severityIcons[finding.severity];

      lines.push(`### ${severityIcon} ${finding.type} (${finding.severity})`);
      lines.push('');
      lines.push(`**Message:** ${finding.message}`);
      lines.push('');
      lines.push(`**Location:** \`${finding.file}:${finding.line}:${finding.column}\``);
      lines.push('');
      lines.push('**Code:**');
      lines.push('```');
      lines.push(finding.code);
      lines.push('```');
      lines.push('');
      lines.push(`**Recommendation:** ${finding.recommendation}`);
      lines.push('');
      if (finding.owasp) {
        lines.push(`**OWASP:** ${finding.owasp}`);
      }
      if (finding.cwe) {
        lines.push(`**CWE:** ${finding.cwe}`);
      }
      lines.push('');
    }
  }

  if (report.recommendations.length > 0) {
    lines.push('## Recommendations');
    lines.push('');
    for (const rec of report.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}

/**
 * Main CLI function
 */
async function main() {
  try {
    const cliArgs = parseArgs();

    // Validate project path
    if (!fs.existsSync(cliArgs.projectPath)) {
      console.error(`Error: Project path does not exist: ${cliArgs.projectPath}`);
      process.exit(1);
    }

    // Build scan options
    const options: ScanOptions = {
      projectPath: path.resolve(cliArgs.projectPath),
      language: cliArgs.language,
      severityThreshold: cliArgs.severityThreshold,
      maxFindings: cliArgs.maxFindings,
    };

    // Run scan
    const auditor = new SecurityAuditor();
    const report = await auditor.scanProject(options);

    // Format output
    const format = cliArgs.format || 'text';
    let output: string;

    switch (format) {
      case 'json':
        output = JSON.stringify(report, null, 2);
        break;
      case 'markdown':
        output = formatMarkdown(report);
        break;
      case 'text':
      default:
        output = formatText(report);
        break;
    }

    // Write output
    if (cliArgs.output) {
      fs.writeFileSync(cliArgs.output, output);
      console.log(`\n✅ Report saved to: ${cliArgs.output}`);
    } else {
      console.log(output);
    }

    // Exit with error code if critical/high findings
    if (report.bySeverity.critical > 0 || report.bySeverity.high > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error(`Error: ${error}`);
    process.exit(1);
  }
}

// Run CLI
main();
