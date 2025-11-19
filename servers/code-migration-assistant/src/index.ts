#!/usr/bin/env node

/**
 * Code Migration Assistant MCP Server
 * Helps with code migrations between frameworks and versions
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { MigrationAnalyzer } from './analyzers/migration-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';

const analyzer = new MigrationAnalyzer();

const TOOLS: Tool[] = [
  {
    name: 'analyze_migration',
    description:
      'Analyze a project for migration issues between framework versions. ' +
      'Detects breaking changes, deprecated APIs, and provides migration suggestions.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory to analyze',
        },
        fromVersion: {
          type: 'string',
          description: 'Current version (auto-detected if not specified)',
        },
        toVersion: {
          type: 'string',
          description: 'Target version to migrate to',
        },
        framework: {
          type: 'string',
          enum: ['react', 'nextjs', 'vue', 'angular', 'typescript', 'express'],
          description: 'Framework to analyze (auto-detected if not specified)',
        },
        fileTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'File extensions to analyze (default: ts, js, tsx, jsx)',
        },
        maxFiles: {
          type: 'number',
          description: 'Maximum number of files to analyze (default: 500)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_migration_report',
    description:
      'Generate a detailed migration report with all issues and recommendations. ' +
      'Outputs in markdown, JSON, or HTML format.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
        toVersion: {
          type: 'string',
          description: 'Target version to migrate to',
        },
        format: {
          type: 'string',
          enum: ['markdown', 'json', 'html'],
          description: 'Output format for the report',
        },
        outputPath: {
          type: 'string',
          description: 'Where to write the report (optional)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'apply_migration_fixes',
    description:
      'Apply auto-fixable migration changes to the codebase. ' +
      'Creates backups before making changes.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
        dryRun: {
          type: 'boolean',
          description: 'Preview changes without applying them (default: true)',
        },
        backup: {
          type: 'boolean',
          description: 'Create backup before applying fixes (default: true)',
        },
      },
      required: ['projectPath'],
    },
  },
];

const server = new Server(
  {
    name: 'code-migration-assistant',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools: TOOLS };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'analyze_migration': {
        const { projectPath, fromVersion, toVersion, framework, fileTypes, maxFiles } = args as {
          projectPath: string;
          fromVersion?: string;
          toVersion?: string;
          framework?: string;
          fileTypes?: string[];
          maxFiles?: number;
        };

        const result = await analyzer.analyze({
          projectPath,
          fromVersion,
          toVersion,
          framework,
          fileTypes,
          maxFiles,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      case 'generate_migration_report': {
        const { projectPath, toVersion, format = 'markdown', outputPath } = args as {
          projectPath: string;
          toVersion?: string;
          format?: 'markdown' | 'json' | 'html';
          outputPath?: string;
        };

        // First analyze
        const analysisResult = await analyzer.analyze({ projectPath, toVersion });

        if (!analysisResult.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: analysisResult.error,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }

        // Generate report
        const report = generateReport(analysisResult, format);

        // Write to file if output path provided
        if (outputPath) {
          const dir = path.dirname(outputPath);
          if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
          }
          fs.writeFileSync(outputPath, report, 'utf-8');
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                outputPath,
                issuesFound: analysisResult.issues.length,
                content: outputPath ? undefined : report,
              }, null, 2),
            },
          ],
        };
      }

      case 'apply_migration_fixes': {
        const { projectPath, dryRun = true, backup = true } = args as {
          projectPath: string;
          dryRun?: boolean;
          backup?: boolean;
        };

        // Analyze to find fixable issues
        const analysisResult = await analyzer.analyze({ projectPath });

        if (!analysisResult.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  error: analysisResult.error,
                }, null, 2),
              },
            ],
            isError: true,
          };
        }

        const fixableIssues = analysisResult.issues.filter(i => i.autoFixable && i.fixedCode);

        if (fixableIssues.length === 0) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  message: 'No auto-fixable issues found',
                  fixesApplied: 0,
                }, null, 2),
              },
            ],
          };
        }

        if (dryRun) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: true,
                  dryRun: true,
                  fixesAvailable: fixableIssues.length,
                  preview: fixableIssues.map(issue => ({
                    file: issue.filePath,
                    line: issue.lineNumber,
                    before: issue.code,
                    after: issue.fixedCode,
                  })),
                }, null, 2),
              },
            ],
          };
        }

        // Apply fixes
        const filesModified: string[] = [];
        const fixesByFile = new Map<string, typeof fixableIssues>();

        for (const issue of fixableIssues) {
          const existing = fixesByFile.get(issue.filePath) || [];
          existing.push(issue);
          fixesByFile.set(issue.filePath, existing);
        }

        // Create backup if requested
        let backupPath: string | undefined;
        if (backup) {
          backupPath = path.join(projectPath, `.migration-backup-${Date.now()}`);
          fs.mkdirSync(backupPath, { recursive: true });
        }

        for (const [filePath, issues] of fixesByFile) {
          // Backup original
          if (backup && backupPath) {
            const relativePath = path.relative(projectPath, filePath);
            const backupFilePath = path.join(backupPath, relativePath);
            fs.mkdirSync(path.dirname(backupFilePath), { recursive: true });
            fs.copyFileSync(filePath, backupFilePath);
          }

          // Read file
          let content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.split('\n');

          // Apply fixes (in reverse order to preserve line numbers)
          const sortedIssues = issues.sort((a, b) => b.lineNumber - a.lineNumber);
          for (const issue of sortedIssues) {
            if (issue.fixedCode) {
              lines[issue.lineNumber - 1] = issue.fixedCode;
            }
          }

          // Write back
          fs.writeFileSync(filePath, lines.join('\n'), 'utf-8');
          filesModified.push(filePath);
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                fixesApplied: fixableIssues.length,
                filesModified,
                backupPath,
              }, null, 2),
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ error: `Unknown tool: ${name}` }),
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              error: error instanceof Error ? error.message : String(error),
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }
});

function generateReport(
  result: { issues: any[]; summary: any; recommendations: string[]; migrationPath?: any },
  format: 'markdown' | 'json' | 'html'
): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  if (format === 'markdown') {
    let md = '# Migration Analysis Report\n\n';

    if (result.migrationPath) {
      md += `**Migration**: ${result.migrationPath.framework} ${result.migrationPath.from} → ${result.migrationPath.to}\n\n`;
    }

    md += '## Summary\n\n';
    md += `- **Files Analyzed**: ${result.summary.filesAnalyzed}\n`;
    md += `- **Issues Found**: ${result.summary.issuesFound}\n`;
    md += `- **Auto-fixable**: ${result.summary.autoFixableCount}\n\n`;

    if (Object.keys(result.summary.bySeverity).length > 0) {
      md += '### By Severity\n\n';
      for (const [severity, count] of Object.entries(result.summary.bySeverity)) {
        const icon = severity === 'breaking' ? '🔴' : severity === 'error' ? '🟠' : severity === 'warning' ? '🟡' : 'ℹ️';
        md += `- ${icon} ${severity}: ${count}\n`;
      }
      md += '\n';
    }

    if (result.recommendations.length > 0) {
      md += '## Recommendations\n\n';
      for (const rec of result.recommendations) {
        md += `- ${rec}\n`;
      }
      md += '\n';
    }

    if (result.issues.length > 0) {
      md += '## Issues\n\n';

      const grouped = result.issues.reduce((acc: any, issue: any) => {
        acc[issue.severity] = acc[issue.severity] || [];
        acc[issue.severity].push(issue);
        return acc;
      }, {});

      for (const severity of ['breaking', 'error', 'warning', 'info']) {
        const issues = grouped[severity];
        if (issues && issues.length > 0) {
          md += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)}\n\n`;

          for (const issue of issues) {
            md += `#### ${issue.type}\n\n`;
            md += `**File**: \`${issue.filePath}:${issue.lineNumber}\`\n\n`;
            md += `**Description**: ${issue.description}\n\n`;
            md += `**Code**:\n\`\`\`\n${issue.code}\n\`\`\`\n\n`;
            md += `**Suggestion**: ${issue.suggestion}\n\n`;
            if (issue.autoFixable) {
              md += `✅ **Auto-fixable**\n\n`;
            }
            md += '---\n\n';
          }
        }
      }
    }

    return md;
  }

  // HTML format
  let html = `<!DOCTYPE html>
<html>
<head>
  <title>Migration Analysis Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; background: #f5f5f5; }
    .container { max-width: 1200px; margin: 0 auto; }
    h1 { color: #333; }
    .summary { background: white; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); margin-bottom: 1.5rem; }
    .issue { background: white; padding: 1rem; margin: 1rem 0; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); border-left: 4px solid #ddd; }
    .breaking { border-left-color: #dc3545; }
    .error { border-left-color: #fd7e14; }
    .warning { border-left-color: #ffc107; }
    .info { border-left-color: #17a2b8; }
    code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 2px; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
    .badge { display: inline-block; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.875rem; font-weight: 500; }
    .badge-breaking { background: #dc3545; color: white; }
    .badge-fixable { background: #28a745; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Migration Analysis Report</h1>
    <div class="summary">
      <p><strong>Files Analyzed:</strong> ${result.summary.filesAnalyzed}</p>
      <p><strong>Issues Found:</strong> ${result.summary.issuesFound}</p>
      <p><strong>Auto-fixable:</strong> ${result.summary.autoFixableCount}</p>
    </div>
    <h2>Issues</h2>`;

  for (const issue of result.issues) {
    html += `
    <div class="issue ${issue.severity}">
      <h3>${issue.type} <span class="badge badge-${issue.severity}">${issue.severity}</span>
      ${issue.autoFixable ? '<span class="badge badge-fixable">auto-fixable</span>' : ''}</h3>
      <p><strong>File:</strong> <code>${issue.filePath}:${issue.lineNumber}</code></p>
      <p>${issue.description}</p>
      <pre>${escapeHtml(issue.code)}</pre>
      <p><strong>Suggestion:</strong> ${issue.suggestion}</p>
    </div>`;
  }

  html += '\n  </div>\n</body>\n</html>';
  return html;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Code Migration Assistant MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
