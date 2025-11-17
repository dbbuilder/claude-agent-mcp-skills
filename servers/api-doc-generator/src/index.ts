#!/usr/bin/env node

/**
 * API Documentation Generator MCP Server
 * Provides tools for extracting endpoints and generating API documentation
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { APIDocumenter } from './documenter.js';
import { Framework } from './types.js';

const documenter = new APIDocumenter();

const server = new Server(
  {
    name: 'api-doc-generator',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

/**
 * List available tools
 */
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'extract_endpoints',
        description:
          'Extract API endpoints from a project (Express, FastAPI, or ASP.NET Core)',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            framework: {
              type: 'string',
              enum: ['express', 'fastapi', 'aspnet', 'auto'],
              description: 'Framework to extract from (auto-detect if not specified)',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'generate_openapi',
        description: 'Generate OpenAPI 3.0 specification from extracted endpoints',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            outputPath: {
              type: 'string',
              description: 'Output path for OpenAPI spec (YAML or JSON)',
            },
            framework: {
              type: 'string',
              enum: ['express', 'fastapi', 'aspnet', 'auto'],
              description: 'Framework to extract from',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'generate_markdown_docs',
        description: 'Generate Markdown API documentation from extracted endpoints',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            outputPath: {
              type: 'string',
              description: 'Output path for Markdown documentation',
            },
            framework: {
              type: 'string',
              enum: ['express', 'fastapi', 'aspnet', 'auto'],
              description: 'Framework to extract from',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'document_api',
        description:
          'Complete workflow: extract endpoints and generate both OpenAPI and Markdown documentation',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            outputDir: {
              type: 'string',
              description: 'Output directory for generated documentation',
            },
            framework: {
              type: 'string',
              enum: ['express', 'fastapi', 'aspnet', 'auto'],
              description: 'Framework to extract from',
            },
          },
          required: ['projectPath'],
        },
      },
    ],
  };
});

/**
 * Handle tool calls
 */
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'extract_endpoints': {
        const endpoints = await documenter.extractEndpoints({
          projectPath: args.projectPath as string,
          framework:
            args.framework === 'auto' ? undefined : (args.framework as Framework),
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  endpointsFound: endpoints.length,
                  endpoints: endpoints.map(ep => ({
                    path: ep.path,
                    method: ep.method,
                    handler: ep.handler,
                    summary: ep.summary,
                    parameters: ep.parameters.length,
                    filePath: ep.filePath,
                    lineNumber: ep.lineNumber,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_openapi': {
        // Extract endpoints first
        const endpoints = await documenter.extractEndpoints({
          projectPath: args.projectPath as string,
          framework:
            args.framework === 'auto' ? undefined : (args.framework as Framework),
        });

        const result = await documenter.generateDocumentation({
          documentation: {
            title: 'API Documentation',
            version: '1.0.0',
            endpoints,
          },
          outputPath: args?.outputPath as string,
          format: 'openapi',
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

      case 'generate_markdown_docs': {
        // Extract endpoints first
        const endpoints = await documenter.extractEndpoints({
          projectPath: args.projectPath as string,
          framework:
            args.framework === 'auto' ? undefined : (args.framework as Framework),
        });

        const result = await documenter.generateDocumentation({
          documentation: {
            title: 'API Documentation',
            version: '1.0.0',
            endpoints,
          },
          outputPath: args?.outputPath as string,
          format: 'markdown',
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

      case 'document_api': {
        const result = await documenter.documentAPI(
          args?.projectPath as string,
          args?.outputDir as string | undefined,
          args?.framework === 'auto' ? undefined : (args?.framework as Framework)
        );

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: false,
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

/**
 * Start the server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('API Documentation Generator MCP server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
