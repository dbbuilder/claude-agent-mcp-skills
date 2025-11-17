/**
 * Server execution handler
 */

import { spawn } from 'child_process';
import { servers } from './registry.js';
import { ui } from './ui.js';

export async function executeServer(
  serverId: string,
  commandName: string,
  args: Record<string, string>
): Promise<void> {
  const server = servers[serverId];

  if (!server) {
    ui.error(`Server '${serverId}' not found`);
    process.exit(1);
  }

  const command = server.commands.find(c => c.name === commandName);

  if (!command) {
    ui.error(`Command '${commandName}' not found for server '${serverId}'`);
    process.exit(1);
  }

  // Validate required arguments
  const missingArgs = command.args
    .filter(arg => arg.required && !args[arg.name])
    .map(arg => arg.name);

  if (missingArgs.length > 0) {
    ui.error(`Missing required arguments: ${missingArgs.join(', ')}`);
    process.exit(1);
  }

  // Build command arguments
  const cmdArgs: string[] = [commandName];

  for (const arg of command.args) {
    const value = args[arg.name] || arg.default;
    if (value) {
      cmdArgs.push(`--${arg.name}`, value);
    }
  }

  ui.info(`Executing: ${server.name}`);
  ui.info(`Command: ${commandName}`);
  ui.blank();

  ui.startSpinner('Running server...');

  return new Promise((resolve, reject) => {
    const child = spawn('node', [server.path, ...cmdArgs], {
      stdio: ['inherit', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      const text = data.toString();
      stdout += text;
      ui.updateSpinner(text.trim().split('\n')[0]);
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        ui.succeedSpinner('Completed successfully');

        if (stdout.trim()) {
          ui.blank();
          ui.header('Output');
          console.log(stdout.trim());
        }

        resolve();
      } else {
        ui.failSpinner(`Failed with exit code ${code}`);

        if (stderr.trim()) {
          ui.blank();
          ui.error('Error output:');
          console.error(stderr.trim());
        }

        reject(new Error(`Server exited with code ${code}`));
      }
    });

    child.on('error', (error) => {
      ui.failSpinner('Failed to start server');
      ui.error(error.message);
      reject(error);
    });
  });
}
