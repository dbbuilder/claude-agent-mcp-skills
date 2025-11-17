#!/usr/bin/env node

/**
 * Docker Configuration Generator MCP Server
 * Generates optimized Dockerfiles and Docker Compose configurations
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { DockerGenerator } from './docker-generator.js';
import { ProjectType, DatabaseType } from './types.js';

const generator = new DockerGenerator();

const TOOLS: Tool[] = [
  {
    name: 'analyze_project_for_docker',
    description:
      'Analyze a project to determine its type, framework, dependencies, and Docker requirements. ' +
      'Detects Node.js, Python, .NET, React, Next.js, Vue, and more.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_dockerfile',
    description:
      'Generate an optimized Dockerfile for a project. Supports multi-stage builds, ' +
      'security best practices, health checks, and framework-specific optimizations.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
        projectType: {
          type: 'string',
          enum: ['nodejs', 'nodejs-typescript', 'python-fastapi', 'python-django', 'dotnet-aspnet', 'react', 'nextjs', 'vue', 'static'],
          description: 'Type of project (auto-detected if not specified)',
        },
        outputPath: {
          type: 'string',
          description: 'Where to write the Dockerfile (optional)',
        },
        multiStage: {
          type: 'boolean',
          description: 'Use multi-stage build (default: true)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_docker_compose',
    description:
      'Generate Docker Compose configuration with application and database services. ' +
      'Automatically configures PostgreSQL, MySQL, MongoDB, SQL Server, and Redis.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
        outputPath: {
          type: 'string',
          description: 'Where to write docker-compose.yml (optional)',
        },
        databases: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['postgresql', 'mysql', 'mongodb', 'sqlserver', 'redis'],
          },
          description: 'Database services to include (auto-detected if not specified)',
        },
        includeRedis: {
          type: 'boolean',
          description: 'Include Redis cache service (default: false)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_docker_config',
    description:
      'Complete workflow: analyze project and generate both Dockerfile and Docker Compose. ' +
      'One-stop solution for Dockerizing any project.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
        outputDir: {
          type: 'string',
          description: 'Directory where files should be written (optional)',
        },
      },
      required: ['projectPath'],
    },
  },
];

const server = new Server(
  {
    name: 'docker-config-generator',
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
      case 'analyze_project_for_docker': {
        const { projectPath } = args as { projectPath: string };

        const analysis = await generator.analyzeProject({ projectPath });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  projectType: analysis.projectType,
                  framework: analysis.framework,
                  runtime: analysis.runtime,
                  packageManager: analysis.packageManager,
                  port: analysis.port,
                  buildCommand: analysis.buildCommand,
                  startCommand: analysis.startCommand,
                  hasDatabase: analysis.hasDatabase,
                  databases: analysis.databases,
                  needsCache: analysis.needsCache,
                  hasTests: analysis.hasTests,
                  testCommand: analysis.testCommand,
                  dependenciesCount: analysis.dependencies.length,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_dockerfile': {
        const { projectPath, projectType, outputPath, multiStage = true } = args as {
          projectPath: string;
          projectType?: ProjectType;
          outputPath?: string;
          multiStage?: boolean;
        };

        const result = await generator.generateDockerfile({
          projectPath,
          projectType: projectType!,
          outputPath,
          options: { projectType: projectType!, multiStage },
        });

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  dockerfilePath: result.dockerfilePath,
                  dockerignorePath: result.dockerignorePath,
                  message: 'Successfully generated Dockerfile and .dockerignore',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_docker_compose': {
        const { projectPath, outputPath, databases, includeRedis = false } = args as {
          projectPath: string;
          outputPath?: string;
          databases?: DatabaseType[];
          includeRedis?: boolean;
        };

        const result = await generator.generateCompose({
          projectPath,
          outputPath,
          databases,
          includeRedis,
        });

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  dockerComposePath: result.dockerComposePath,
                  message: 'Successfully generated docker-compose.yml',
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_docker_config': {
        const { projectPath, outputDir } = args as {
          projectPath: string;
          outputDir?: string;
        };

        const result = await generator.generate(projectPath, outputDir);

        if (!result.success) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify(
                  {
                    success: false,
                    error: result.error,
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  dockerfilePath: result.dockerfilePath,
                  dockerignorePath: result.dockerignorePath,
                  dockerComposePath: result.dockerComposePath,
                  message: 'Successfully generated Docker configuration',
                },
                null,
                2
              ),
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

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Docker Configuration Generator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
