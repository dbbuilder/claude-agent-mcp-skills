#!/usr/bin/env node

/**
 * Claude MCP Tools - Unified CLI
 * Main entry point for all development tools
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { auditCommand } from './commands/audit.js';
import { scaffoldCommand } from './commands/scaffold.js';
import { readmeCommand } from './commands/readme.js';
import { depsCommand } from './commands/deps.js';
import { interactiveMenu } from './utils/prompts.js';

const program = new Command();

program
  .name('claude-mcp-tools')
  .description('Claude MCP Agent Development Tools - Security Auditor, Project Scaffolder, README Generator, and Dependency Updater')
  .version('1.0.0');

// Security Auditor command
program
  .command('audit')
  .description('Run security audit on MCP server code')
  .option('-p, --path <path>', 'Path to MCP server directory', process.cwd())
  .option('-o, --output <file>', 'Output file for audit report')
  .option('--format <type>', 'Report format (json, markdown, html)', 'markdown')
  .action(auditCommand);

// Project Scaffolder command
program
  .command('scaffold')
  .description('Scaffold a new project from template')
  .option('-t, --template <name>', 'Template name (typescript-express, nextjs, dotnet, fastapi, vue3, react, react-native)')
  .option('-n, --name <name>', 'Project name')
  .option('-p, --path <path>', 'Output directory', process.cwd())
  .option('--git', 'Initialize git repository', false)
  .option('--docker', 'Include Docker configuration', false)
  .option('--ci', 'Include CI/CD configuration', false)
  .action(scaffoldCommand);

// README Generator command
program
  .command('readme')
  .description('Generate README.md from project analysis')
  .option('-p, --path <path>', 'Project directory', process.cwd())
  .option('-o, --output <file>', 'Output file path')
  .option('--title <title>', 'Custom project title')
  .option('--description <desc>', 'Custom project description')
  .option('--no-badges', 'Exclude badges section')
  .option('--no-structure', 'Exclude project structure section')
  .option('--overwrite', 'Overwrite existing README', false)
  .action(readmeCommand);

// Dependency Updater command
program
  .command('deps')
  .description('Check and update project dependencies')
  .option('-p, --path <path>', 'Project directory', process.cwd())
  .option('--check-only', 'Only check for updates, do not apply', false)
  .option('--major', 'Include major version updates', false)
  .option('--interactive', 'Prompt for each update', true)
  .action(depsCommand);

// Interactive mode (default when no command specified)
program
  .command('interactive', { isDefault: true })
  .description('Launch interactive menu')
  .action(async () => {
    await interactiveMenu();
  });

// Custom help
program.addHelpText('after', `

${chalk.bold('Examples:')}
  ${chalk.cyan('$ claude-mcp-tools audit -p ./my-server')}
    Run security audit on MCP server

  ${chalk.cyan('$ claude-mcp-tools scaffold -t typescript-express -n my-api')}
    Scaffold a new TypeScript Express project

  ${chalk.cyan('$ claude-mcp-tools readme -p ./my-project --overwrite')}
    Generate README for project

  ${chalk.cyan('$ claude-mcp-tools deps -p ./my-project --major')}
    Check for dependency updates including major versions

  ${chalk.cyan('$ claude-mcp-tools')}
    Launch interactive menu

${chalk.bold('Documentation:')}
  For more information, visit: https://github.com/yourusername/claude-agent-sdk
`);

program.parse();
