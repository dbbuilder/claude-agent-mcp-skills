#!/usr/bin/env node
/**
 * README Generator MCP Server
 * Automatic README.md generation from project analysis
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ReadmeGenerator } from './generator.js';
import { ProjectAnalyzer } from './analyzer.js';
import { GenerateOptions } from './types.js';

// Create MCP server
const server = new McpServer({
  name: 'readme-generator',
  version: '0.1.0',
});

const generator = new ReadmeGenerator();
const analyzer = new ProjectAnalyzer();

/**
 * Tool: Generate README
 * Analyzes project and generates README.md
 */
server.tool(
  'generate_readme',
  {
    projectPath: z.string().describe('Path to project directory'),
    options: z
      .object({
        title: z.string().optional().describe('Project title (overrides auto-detected)'),
        description: z.string().optional().describe('Project description'),
        includeStructure: z.boolean().optional().describe('Include directory structure'),
        includeBadges: z.boolean().optional().describe('Include status badges'),
        includeEnvVars: z.boolean().optional().describe('Include environment variables'),
        includeTOC: z.boolean().optional().describe('Include table of contents'),
        overwrite: z.boolean().optional().describe('Overwrite existing README.md'),
        outputPath: z.string().optional().describe('Output file path'),
      })
      .optional(),
  },
  async ({ projectPath, options }) => {
    const generateOptions: GenerateOptions = {
      projectPath,
      options,
    };

    const result = await generator.generate(generateOptions);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

/**
 * Tool: Analyze Project
 * Analyzes project without generating README
 */
server.tool(
  'analyze_project',
  {
    projectPath: z.string().describe('Path to project directory'),
  },
  async ({ projectPath }) => {
    const analysis = await analyzer.analyze(projectPath);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(analysis, null, 2),
        },
      ],
    };
  }
);

/**
 * Start the MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('README Generator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
