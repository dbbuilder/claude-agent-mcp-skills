#!/usr/bin/env node

/**
 * Config Template Generator MCP Server
 * Generates configuration templates by scanning codebases for environment variables
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { ConfigGenerator } from './config-generator.js';

const generator = new ConfigGenerator();

const TOOLS: Tool[] = [
  {
    name: 'discover_config_vars',
    description:
      'Discover all configuration variables in a project by scanning code for environment ' +
      'variable usage, database connections, API keys, and settings.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory to scan',
        },
        includeNodeModules: {
          type: 'boolean',
          description: 'Include node_modules in scan (default: false)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_env_template',
    description:
      'Generate .env.template file from discovered configuration variables. ' +
      'Creates a well-documented template with examples, descriptions, and type hints.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
        outputPath: {
          type: 'string',
          description: 'Where to write the .env.template file (optional)',
        },
        includeValidation: {
          type: 'boolean',
          description: 'Generate validation schema (default: true)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_validation_schema',
    description:
      'Generate validation schema (Zod or Joi) for environment variables. ' +
      'Creates type-safe validation code that can be used at application startup.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the project directory',
        },
        framework: {
          type: 'string',
          enum: ['zod', 'joi'],
          description: 'Validation framework to use',
        },
        outputPath: {
          type: 'string',
          description: 'Where to write the validation file (optional)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_config_template',
    description:
      'Complete workflow: discover variables and generate both .env.template and ' +
      'validation schema. One-stop solution for configuration setup.',
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
    name: 'config-template-generator',
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
      case 'discover_config_vars': {
        const { projectPath, includeNodeModules = false } = args as {
          projectPath: string;
          includeNodeModules?: boolean;
        };

        const result = await generator.discoverVariables({
          projectPath,
          includeNodeModules,
        });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  variablesFound: result.variables.length,
                  frameworks: result.frameworks ?? [],
                  configFiles: result.configFiles ?? [],
                  totalUsages: result.totalUsages ?? 0,
                  variablesByCategory: groupByCategory(result.variables),
                  variables: result.variables.map((v) => ({
                    name: v.name,
                    type: v.type,
                    category: v.category,
                    required: v.required,
                    sensitive: v.sensitive,
                    description: v.description,
                    exampleValue: v.exampleValue,
                    usageCount: v.usages.length,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_env_template': {
        const { projectPath, outputPath, includeValidation = true } = args as {
          projectPath: string;
          outputPath?: string;
          includeValidation?: boolean;
        };

        const result = await generator.generate(projectPath, outputPath);

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
                  templatePath: result.templatePath,
                  validationPath: result.validationPath,
                  variablesCount: result.variablesCount,
                  message: `Generated .env.template with ${result.variablesCount} variables`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_validation_schema': {
        const { projectPath, framework = 'zod', outputPath } = args as {
          projectPath: string;
          framework?: 'zod' | 'joi';
          outputPath?: string;
        };

        // Discover variables first
        const discovery = await generator.discoverVariables({ projectPath });

        // Generate validation
        const result = await generator.generateTemplate({
          variables: discovery.variables,
          outputPath,
          format: 'env',
          includeValidation: true,
          validationFramework: framework,
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
                  validationPath: result.validationPath,
                  framework,
                  variablesCount: result.variablesCount,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_config_template': {
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
                  templatePath: result.templatePath,
                  validationPath: result.validationPath,
                  variablesCount: result.variablesCount,
                  message: `Successfully generated configuration template with ${result.variablesCount} variables`,
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

function groupByCategory(variables: any[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const variable of variables) {
    counts[variable.category] = (counts[variable.category] || 0) + 1;
  }
  return counts;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Config Template Generator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
