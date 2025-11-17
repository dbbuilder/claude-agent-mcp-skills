#!/usr/bin/env node

/**
 * Integration Test Generator MCP Server
 * Generates integration tests for APIs (Express, FastAPI, ASP.NET Core)
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { TestGenerator } from './test-generator.js';
import { Framework, TestFramework } from './types.js';

const generator = new TestGenerator();

const TOOLS: Tool[] = [
  {
    name: 'analyze_api',
    description:
      'Analyze an API project and return the test cases that would be generated. ' +
      'Useful for previewing what tests will be created without writing files.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the API project directory',
        },
        framework: {
          type: 'string',
          enum: ['express', 'fastapi', 'aspnet'],
          description: 'API framework (auto-detected if not specified)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_integration_tests',
    description:
      'Generate integration tests for an API project. Discovers endpoints and creates ' +
      'comprehensive test suites including success, auth, validation, and error cases.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the API project directory',
        },
        outputPath: {
          type: 'string',
          description: 'Path where test file should be written (optional)',
        },
        framework: {
          type: 'string',
          enum: ['express', 'fastapi', 'aspnet'],
          description: 'API framework (auto-detected if not specified)',
        },
        testFramework: {
          type: 'string',
          enum: ['jest', 'pytest', 'xunit'],
          description: 'Test framework to use (auto-detected from API framework if not specified)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'generate_all_test_frameworks',
    description:
      'Generate integration tests for ALL test frameworks (Jest, Pytest, xUnit). ' +
      'Useful for polyglot projects or when you want tests in multiple formats.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the API project directory',
        },
        framework: {
          type: 'string',
          enum: ['express', 'fastapi', 'aspnet'],
          description: 'API framework (auto-detected if not specified)',
        },
      },
      required: ['projectPath'],
    },
  },
  {
    name: 'preview_test_plan',
    description:
      'Preview the test plan for an API project. Shows what endpoints will be tested, ' +
      'how many tests will be generated, and breakdown by scenario and HTTP method.',
    inputSchema: {
      type: 'object',
      properties: {
        projectPath: {
          type: 'string',
          description: 'Path to the API project directory',
        },
        framework: {
          type: 'string',
          enum: ['express', 'fastapi', 'aspnet'],
          description: 'API framework (auto-detected if not specified)',
        },
      },
      required: ['projectPath'],
    },
  },
];

const server = new Server(
  {
    name: 'integration-test-generator',
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
      case 'analyze_api': {
        const { projectPath, framework } = args as {
          projectPath: string;
          framework?: Framework;
        };

        const testCases = await generator.analyze({ projectPath, framework });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  testCasesCount: testCases.length,
                  testCases: testCases.map((tc) => ({
                    name: tc.name,
                    scenario: tc.scenario,
                    method: tc.endpoint.method,
                    path: tc.endpoint.path,
                    expectedStatus: tc.expectedStatus,
                    requiresAuth: tc.endpoint.requiresAuth,
                  })),
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_integration_tests': {
        const { projectPath, outputPath, framework, testFramework } = args as {
          projectPath: string;
          outputPath?: string;
          framework?: Framework;
          testFramework?: TestFramework;
        };

        const result = await generator.generate({
          projectPath,
          outputPath,
          framework,
          testFramework,
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
                  outputPath: result.outputPath,
                  testsGenerated: result.testsGenerated,
                  message: `Successfully generated ${result.testsGenerated} integration tests`,
                },
                null,
                2
              ),
            },
          ],
        };
      }

      case 'generate_all_test_frameworks': {
        const { projectPath, framework } = args as {
          projectPath: string;
          framework?: Framework;
        };

        const results = await generator.generateAll({ projectPath, framework });

        const summary = {
          success: true,
          results: {
            jest: {
              success: results.jest.success,
              outputPath: results.jest.outputPath,
              testsGenerated: results.jest.testsGenerated,
              error: results.jest.error,
            },
            pytest: {
              success: results.pytest.success,
              outputPath: results.pytest.outputPath,
              testsGenerated: results.pytest.testsGenerated,
              error: results.pytest.error,
            },
            xunit: {
              success: results.xunit.success,
              outputPath: results.xunit.outputPath,
              testsGenerated: results.xunit.testsGenerated,
              error: results.xunit.error,
            },
          },
        };

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      }

      case 'preview_test_plan': {
        const { projectPath, framework } = args as {
          projectPath: string;
          framework?: Framework;
        };

        const preview = await generator.preview({ projectPath, framework });

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(
                {
                  success: true,
                  summary: preview.summary,
                  endpoints: Array.from(
                    new Set(
                      preview.testCases.map(
                        (tc) => `${tc.endpoint.method} ${tc.endpoint.path}`
                      )
                    )
                  ),
                  sampleTestCases: preview.testCases.slice(0, 5).map((tc) => ({
                    name: tc.name,
                    scenario: tc.scenario,
                    expectedStatus: tc.expectedStatus,
                  })),
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
  console.error('Integration Test Generator MCP Server running on stdio');
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
