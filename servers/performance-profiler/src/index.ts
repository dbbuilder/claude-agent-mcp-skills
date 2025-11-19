#!/usr/bin/env node

/**
 * Performance Profiler MCP Server
 * Analyzes code for performance issues and suggests optimizations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { PerformanceAnalyzer } from './analyzers/performance-analyzer.js';
import * as fs from 'fs';
import * as path from 'path';

const analyzer = new PerformanceAnalyzer();

const TOOLS: Tool[] = [
  {
    name: 'analyze_performance',
    description:
      'Analyze code for common performance issues like N+1 queries, sync I/O, ' +
      'memory leaks, inefficient regex, and more. Returns actionable recommendations.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory to analyze',
        },
        fileTypes: {
          type: 'array',
          items: { type: 'string' },
          description: 'File extensions to analyze (default: ts, js, tsx, jsx, py)',
        },
        includeTests: {
          type: 'boolean',
          description: 'Include test files in analysis (default: false)',
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
    name: 'generate_performance_report',
    description:
      'Generate a detailed performance report from analysis results. ' +
      'Outputs in markdown, JSON, or HTML format.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
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
];

const server = new Server(
  {
    name: 'performance-profiler',
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
      case 'analyze_performance': {
        const { projectPath, fileTypes, includeTests, maxFiles } = args as {
          projectPath: string;
          fileTypes?: string[];
          includeTests?: boolean;
          maxFiles?: number;
        };

        const result = await analyzer.analyze({
          projectPath,
          fileTypes,
          includeTests,
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

      case 'generate_performance_report': {
        const { projectPath, format = 'markdown', outputPath } = args as {
          projectPath: string;
          format?: 'markdown' | 'json' | 'html';
          outputPath?: string;
        };

        // First analyze
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
  result: { issues: any[]; summary: any; recommendations: string[] },
  format: 'markdown' | 'json' | 'html'
): string {
  if (format === 'json') {
    return JSON.stringify(result, null, 2);
  }

  if (format === 'markdown') {
    let md = '# Performance Analysis Report\n\n';

    md += '## Summary\n\n';
    md += `- **Files Analyzed**: ${result.summary.filesAnalyzed}\n`;
    md += `- **Issues Found**: ${result.summary.issuesFound}\n\n`;

    if (Object.keys(result.summary.bySeverity).length > 0) {
      md += '### By Severity\n\n';
      for (const [severity, count] of Object.entries(result.summary.bySeverity)) {
        md += `- ${severity}: ${count}\n`;
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

      for (const severity of ['critical', 'high', 'medium', 'low']) {
        const issues = grouped[severity];
        if (issues && issues.length > 0) {
          md += `### ${severity.charAt(0).toUpperCase() + severity.slice(1)} Severity\n\n`;

          for (const issue of issues) {
            md += `#### ${issue.type}\n\n`;
            md += `**File**: \`${issue.filePath}:${issue.lineNumber}\`\n\n`;
            md += `**Description**: ${issue.description}\n\n`;
            md += `**Code**:\n\`\`\`\n${issue.code}\n\`\`\`\n\n`;
            md += `**Suggestion**: ${issue.suggestion}\n\n`;
            md += `**Impact**: ${issue.estimatedImpact}\n\n`;
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
  <title>Performance Analysis Report</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 2rem; }
    h1 { color: #333; }
    .summary { background: #f5f5f5; padding: 1rem; border-radius: 4px; }
    .issue { border: 1px solid #ddd; padding: 1rem; margin: 1rem 0; border-radius: 4px; }
    .critical { border-color: #ff0000; }
    .high { border-color: #ff6600; }
    .medium { border-color: #ffcc00; }
    .low { border-color: #00cc00; }
    code { background: #f0f0f0; padding: 0.2rem 0.4rem; border-radius: 2px; }
    pre { background: #1e1e1e; color: #d4d4d4; padding: 1rem; border-radius: 4px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>Performance Analysis Report</h1>
  <div class="summary">
    <p><strong>Files Analyzed:</strong> ${result.summary.filesAnalyzed}</p>
    <p><strong>Issues Found:</strong> ${result.summary.issuesFound}</p>
  </div>
  <h2>Issues</h2>`;

  for (const issue of result.issues) {
    html += `
  <div class="issue ${issue.severity}">
    <h3>${issue.type} (${issue.severity})</h3>
    <p><strong>File:</strong> <code>${issue.filePath}:${issue.lineNumber}</code></p>
    <p>${issue.description}</p>
    <pre>${issue.code}</pre>
    <p><strong>Suggestion:</strong> ${issue.suggestion}</p>
  </div>`;
  }

  html += '\n</body>\n</html>';
  return html;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Performance Profiler MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
