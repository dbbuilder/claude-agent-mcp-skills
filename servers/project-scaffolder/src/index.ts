#!/usr/bin/env node
/**
 * Project Scaffolder MCP Server
 * Template-based project generation
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { ProjectGenerator } from './generator.js';
import { ScaffoldOptions, ProjectTemplate } from './types.js';
import { listTemplates, getTemplate } from './templates/index.js';

// Create MCP server
const server = new McpServer({
  name: 'project-scaffolder',
  version: '0.1.0',
});

const generator = new ProjectGenerator();

/**
 * Tool: Scaffold Project
 * Creates a new project from a template
 */
server.tool(
  'scaffold_project',
  {
    projectName: z.string().describe('Name of the project (will be used as directory name)'),
    template: z
      .enum([
        'typescript-express',
        'typescript-nextjs',
        'dotnet-webapi',
        'python-fastapi',
        'vue3-frontend',
        'react-frontend',
      ])
      .describe('Project template to use'),
    outputPath: z.string().describe('Directory where project will be created'),
    options: z
      .object({
        database: z
          .enum(['postgresql', 'mysql', 'sqlserver', 'sqlite', 'mongodb'])
          .optional()
          .describe('Database to use'),
        authentication: z.enum(['jwt', 'oauth', 'none']).optional().describe('Authentication method'),
        includeDocker: z.boolean().optional().describe('Include Docker configuration'),
        includeTests: z.boolean().optional().describe('Include test setup'),
        includeCICD: z.boolean().optional().describe('Include CI/CD configuration'),
        author: z.string().optional().describe('Author name'),
        license: z
          .enum(['MIT', 'Apache-2.0', 'GPL-3.0', 'BSD-3-Clause'])
          .optional()
          .describe('License type'),
        description: z.string().optional().describe('Project description'),
        gitInit: z.boolean().optional().describe('Initialize git repository'),
      })
      .optional(),
  },
  async ({ projectName, template, outputPath, options }) => {
    const scaffoldOptions: ScaffoldOptions = {
      projectName,
      template: template as ProjectTemplate,
      outputPath,
      options,
    };

    const result = await generator.scaffold(scaffoldOptions);

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
 * Tool: List Templates
 * Lists all available project templates
 */
server.tool('list_templates', {}, async () => {
  const templates = listTemplates();

  return {
    content: [
      {
        type: 'text',
        text: JSON.stringify({ templates }, null, 2),
      },
    ],
  };
});

/**
 * Tool: Get Template Info
 * Get detailed information about a specific template
 */
server.tool(
  'get_template_info',
  {
    template: z
      .enum([
        'typescript-express',
        'typescript-nextjs',
        'dotnet-webapi',
        'python-fastapi',
        'vue3-frontend',
        'react-frontend',
      ])
      .describe('Template name'),
  },
  async ({ template }) => {
    const templateInfo = getTemplate(template as ProjectTemplate);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(templateInfo, null, 2),
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

  console.error('Project Scaffolder MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
