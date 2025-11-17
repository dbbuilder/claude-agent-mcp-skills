/**
 * Interactive mode handler
 */

import inquirer from 'inquirer';
import { servers } from './registry.js';
import { ui } from './ui.js';
import { executeServer } from './executor.js';

export async function runInteractiveMode(): Promise<void> {
  ui.banner();
  ui.header('Interactive Mode');

  // Select server
  const serverChoices = Object.entries(servers).map(([key, info]) => ({
    name: `${info.name} - ${info.description}`,
    value: key,
  }));

  const { serverId } = await inquirer.prompt([
    {
      type: 'list',
      name: 'serverId',
      message: 'Select an MCP server:',
      choices: serverChoices,
      pageSize: 10,
    },
  ]);

  const server = servers[serverId];

  // Select command
  if (server.commands.length === 0) {
    ui.error('No commands available for this server');
    return;
  }

  const { commandName } = await inquirer.prompt([
    {
      type: 'list',
      name: 'commandName',
      message: 'Select a command:',
      choices: server.commands.map(cmd => ({
        name: `${cmd.name} - ${cmd.description}`,
        value: cmd.name,
      })),
    },
  ]);

  const command = server.commands.find(c => c.name === commandName);
  if (!command) {
    ui.error('Command not found');
    return;
  }

  // Collect arguments
  const args: Record<string, string> = {};

  for (const arg of command.args) {
    if (!arg.required && arg.default) {
      const { useDefault } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'useDefault',
          message: `Use default value for ${arg.name}? (${arg.default})`,
          default: true,
        },
      ]);

      if (useDefault) {
        args[arg.name] = arg.default;
        continue;
      }
    }

    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: `${arg.description}:`,
        default: arg.default,
        validate: (input: string) => {
          if (arg.required && !input) {
            return 'This field is required';
          }
          return true;
        },
      },
    ]);

    args[arg.name] = value;
  }

  // Execute
  ui.blank();
  await executeServer(serverId, commandName, args);
}
