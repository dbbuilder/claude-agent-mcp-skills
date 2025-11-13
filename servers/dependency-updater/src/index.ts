#!/usr/bin/env node
/**
 * Dependency Updater MCP Server
 * Automated dependency updates with breaking change detection
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DependencyChecker } from './checker.js';
import { CheckOutdatedOptions } from './types.js';

// Create MCP server
const server = new McpServer({
  name: 'dependency-updater',
  version: '0.1.0',
});

const checker = new DependencyChecker();

/**
 * Tool: Check Outdated Dependencies
 * Scans project for outdated dependencies
 */
server.tool(
  'check_outdated',
  {
    projectPath: z.string().describe('Path to project directory'),
    packageManager: z
      .enum(['npm', 'yarn', 'pnpm', 'pip', 'poetry', 'dotnet', 'cargo', 'go'])
      .optional()
      .describe('Package manager to use (auto-detected if not specified)'),
    updateType: z
      .enum(['patch', 'minor', 'major', 'all'])
      .optional()
      .describe('Filter by update type (default: all)'),
  },
  async ({ projectPath, packageManager, updateType }) => {
    const options: CheckOutdatedOptions = {
      projectPath,
      packageManager,
      updateType,
    };

    const result = await checker.check(options);

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
 * Tool: Get Dependency Info
 * Get detailed information about a specific dependency
 */
server.tool(
  'get_dependency_info',
  {
    packageName: z.string().describe('Package name'),
    currentVersion: z.string().describe('Current version'),
    latestVersion: z.string().describe('Latest version'),
  },
  async ({ packageName, currentVersion, latestVersion }) => {
    const info = {
      package: packageName,
      current: currentVersion,
      latest: latestVersion,
      updateType: determineUpdateType(currentVersion, latestVersion),
      npmUrl: `https://www.npmjs.com/package/${packageName}`,
      changelogUrl: `https://github.com/${packageName}/blob/main/CHANGELOG.md`,
      releasesUrl: `https://github.com/${packageName}/releases`,
      recommendations: [
        'Review changelog for breaking changes',
        'Update one major version at a time',
        'Run tests after updating',
        'Check peer dependencies',
      ],
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(info, null, 2),
        },
      ],
    };
  }
);

/**
 * Tool: Get Update Recommendations
 * Get recommendations for safe dependency updates
 */
server.tool(
  'get_update_recommendations',
  {
    outdatedCount: z.number().describe('Number of outdated dependencies'),
    patchCount: z.number().describe('Number of patch updates'),
    minorCount: z.number().describe('Number of minor updates'),
    majorCount: z.number().describe('Number of major updates'),
  },
  async ({ outdatedCount, patchCount, minorCount, majorCount }) => {
    const recommendations: string[] = [];

    if (outdatedCount === 0) {
      recommendations.push('All dependencies are up to date!');
    } else {
      if (patchCount > 0) {
        recommendations.push(
          `Update ${patchCount} patch versions immediately (low risk)`
        );
      }
      if (minorCount > 0) {
        recommendations.push(
          `Update ${minorCount} minor versions after reviewing changelogs`
        );
      }
      if (majorCount > 0) {
        recommendations.push(
          `Update ${majorCount} major versions one at a time with thorough testing`
        );
        recommendations.push(
          'For major updates: read migration guides, update tests, and deploy to staging first'
        );
      }

      recommendations.push('Always run your test suite after updates');
      recommendations.push('Consider using a staging environment for major updates');
      recommendations.push('Update dependencies in batches of 3-5 packages');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ recommendations }, null, 2),
        },
      ],
    };
  }
);

/**
 * Helper: Determine update type
 */
function determineUpdateType(current: string, latest: string): string {
  const currentParts = current.split('.').map(Number);
  const latestParts = latest.split('.').map(Number);

  if (currentParts[0] !== latestParts[0]) return 'major';
  if (currentParts[1] !== latestParts[1]) return 'minor';
  if (currentParts[2] !== latestParts[2]) return 'patch';
  return 'none';
}

/**
 * Start the MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  console.error('Dependency Updater MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
