#!/usr/bin/env node

/**
 * Claude Agent SDK CLI
 * Unified command-line interface for all MCP servers
 */

import { Command } from 'commander';
import chalk from 'chalk';
import { runInteractiveMode } from './interactive.js';
import { servers } from './registry.js';
import { ui } from './ui.js';
import { executeServer } from './executor.js';

const program = new Command();

program
  .name('claude-agent')
  .description('Claude Agent SDK - Unified CLI for MCP servers')
  .version('1.0.0');

// Interactive mode (default)
program
  .command('interactive', { isDefault: true })
  .alias('i')
  .description('Run in interactive mode')
  .action(async () => {
    try {
      await runInteractiveMode();
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// List available servers
program
  .command('list')
  .alias('ls')
  .description('List all available MCP servers')
  .action(() => {
    ui.banner();
    ui.header('Available MCP Servers');

    const rows = Object.entries(servers).map(([key, info]) => [
      key,
      info.name,
      info.description,
    ]);

    ui.table(['ID', 'Name', 'Description'], rows);
    ui.blank();
  });

// Show server details
program
  .command('info <server>')
  .description('Show detailed information about a server')
  .action((serverId: string) => {
    const server = servers[serverId];

    if (!server) {
      ui.error(`Server '${serverId}' not found`);
      ui.info('Run "claude-agent list" to see available servers');
      process.exit(1);
    }

    ui.banner();
    ui.header(server.name);

    ui.keyValue('Description', server.description);
    ui.keyValue('Path', server.path);
    ui.blank();

    if (server.commands.length > 0) {
      ui.header('Available Commands');

      server.commands.forEach(cmd => {
        ui.info(`${cmd.name} - ${cmd.description}`);

        if (cmd.args.length > 0) {
          ui.blank();
          cmd.args.forEach(arg => {
            const required = arg.required ? chalk.red('*') : '';
            const defaultVal = arg.default ? ` (default: ${arg.default})` : '';
            ui.listItem(`${arg.name}${required}: ${arg.description}${defaultVal}`, 1);
          });
          ui.blank();
        }
      });
    } else {
      ui.warning('No commands available');
    }

    ui.blank();
  });

// Direct server execution
program
  .command('run <server> <command>')
  .description('Run a server command directly')
  .option('--args <json>', 'Arguments as JSON string')
  .action(async (serverId: string, commandName: string, options: { args?: string }) => {
    try {
      const args = options.args ? JSON.parse(options.args) : {};
      await executeServer(serverId, commandName, args);
    } catch (error) {
      ui.error(error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  });

// Add convenience commands for each server
Object.entries(servers).forEach(([serverId, server]) => {
  const serverCmd = program
    .command(serverId)
    .description(server.description);

  server.commands.forEach(cmd => {
    const cmdBuilder = serverCmd
      .command(cmd.name)
      .description(cmd.description);

    cmd.args.forEach(arg => {
      if (arg.required) {
        cmdBuilder.argument(`<${arg.name}>`, arg.description);
      } else {
        cmdBuilder.option(
          `--${arg.name} <value>`,
          arg.description,
          arg.default
        );
      }
    });

    cmdBuilder.action(async (...actionArgs: any[]) => {
      try {
        const options = actionArgs[actionArgs.length - 1];
        const positionalArgs = actionArgs.slice(0, cmd.args.filter(a => a.required).length);

        const args: Record<string, string> = {};

        // Add positional arguments
        let positionalIndex = 0;
        cmd.args.forEach(arg => {
          if (arg.required) {
            args[arg.name] = positionalArgs[positionalIndex++];
          } else if (options[arg.name]) {
            args[arg.name] = options[arg.name];
          }
        });

        await executeServer(serverId, cmd.name, args);
      } catch (error) {
        ui.error(error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });
  });
});

// Parse arguments
program.parse();
