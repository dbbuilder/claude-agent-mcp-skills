/**
 * Interactive prompts for CLI menu
 */

import inquirer from 'inquirer';
import chalk from 'chalk';
import { auditCommand } from '../commands/audit.js';
import { scaffoldCommand } from '../commands/scaffold.js';
import { readmeCommand } from '../commands/readme.js';
import { depsCommand } from '../commands/deps.js';

export interface MenuChoice {
  name: string;
  value: string;
  description: string;
}

const mainMenuChoices: MenuChoice[] = [
  {
    name: `${chalk.red('🔒')} Security Auditor - Audit MCP server code`,
    value: 'audit',
    description: 'Run comprehensive security analysis on your MCP server',
  },
  {
    name: `${chalk.blue('⚡')} Project Scaffolder - Create new project`,
    value: 'scaffold',
    description: 'Scaffold a new project from templates',
  },
  {
    name: `${chalk.green('📝')} README Generator - Generate documentation`,
    value: 'readme',
    description: 'Auto-generate README from project analysis',
  },
  {
    name: `${chalk.yellow('📦')} Dependency Updater - Update dependencies`,
    value: 'deps',
    description: 'Check and update project dependencies',
  },
  {
    name: `${chalk.gray('❌')} Exit`,
    value: 'exit',
    description: 'Exit the CLI',
  },
];

export async function interactiveMenu(): Promise<void> {
  console.log(chalk.bold.cyan('\n🤖 Claude MCP Agent Development Tools\n'));
  console.log(chalk.gray('Select a tool to get started:\n'));

  const { tool } = await inquirer.prompt([
    {
      type: 'list',
      name: 'tool',
      message: 'What would you like to do?',
      choices: mainMenuChoices,
      pageSize: 10,
    },
  ]);

  if (tool === 'exit') {
    console.log(chalk.green('\n👋 Goodbye!\n'));
    process.exit(0);
  }

  switch (tool) {
    case 'audit':
      await auditPrompts();
      break;
    case 'scaffold':
      await scaffoldPrompts();
      break;
    case 'readme':
      await readmePrompts();
      break;
    case 'deps':
      await depsPrompts();
      break;
  }

  // Return to main menu
  const { returnToMenu } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'returnToMenu',
      message: 'Return to main menu?',
      default: true,
    },
  ]);

  if (returnToMenu) {
    await interactiveMenu();
  } else {
    console.log(chalk.green('\n👋 Goodbye!\n'));
    process.exit(0);
  }
}

async function auditPrompts(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Path to MCP server directory:',
      default: process.cwd(),
    },
    {
      type: 'input',
      name: 'output',
      message: 'Output file for audit report (optional):',
    },
    {
      type: 'list',
      name: 'format',
      message: 'Report format:',
      choices: ['markdown', 'json', 'html'],
      default: 'markdown',
    },
  ]);

  await auditCommand(answers);
}

async function scaffoldPrompts(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'list',
      name: 'template',
      message: 'Select project template:',
      choices: [
        { name: 'TypeScript Express API', value: 'typescript-express' },
        { name: 'Next.js (React)', value: 'nextjs' },
        { name: '.NET Web API', value: 'dotnet' },
        { name: 'FastAPI (Python)', value: 'fastapi' },
        { name: 'Vue 3', value: 'vue3' },
        { name: 'React', value: 'react' },
        { name: 'React Native', value: 'react-native' },
      ],
    },
    {
      type: 'input',
      name: 'name',
      message: 'Project name:',
      validate: (input: string) => {
        if (!input.trim()) return 'Project name is required';
        if (!/^[a-z0-9-_]+$/i.test(input)) {
          return 'Project name can only contain letters, numbers, hyphens, and underscores';
        }
        return true;
      },
    },
    {
      type: 'input',
      name: 'path',
      message: 'Output directory:',
      default: process.cwd(),
    },
    {
      type: 'confirm',
      name: 'git',
      message: 'Initialize git repository?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'docker',
      message: 'Include Docker configuration?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'ci',
      message: 'Include CI/CD configuration?',
      default: false,
    },
  ]);

  await scaffoldCommand(answers);
}

async function readmePrompts(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Project directory:',
      default: process.cwd(),
    },
    {
      type: 'input',
      name: 'title',
      message: 'Custom project title (optional):',
    },
    {
      type: 'input',
      name: 'description',
      message: 'Custom project description (optional):',
    },
    {
      type: 'confirm',
      name: 'badges',
      message: 'Include badges section?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'structure',
      message: 'Include project structure section?',
      default: true,
    },
    {
      type: 'confirm',
      name: 'overwrite',
      message: 'Overwrite existing README if it exists?',
      default: false,
    },
  ]);

  // Convert badges/structure to CLI format
  const options: any = {
    path: answers.path,
    title: answers.title,
    description: answers.description,
    overwrite: answers.overwrite,
  };

  if (!answers.badges) options.badges = false;
  if (!answers.structure) options.structure = false;

  await readmeCommand(options);
}

async function depsPrompts(): Promise<void> {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'path',
      message: 'Project directory:',
      default: process.cwd(),
    },
    {
      type: 'confirm',
      name: 'checkOnly',
      message: 'Check only (do not apply updates)?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'major',
      message: 'Include major version updates?',
      default: false,
    },
    {
      type: 'confirm',
      name: 'interactive',
      message: 'Prompt for each update?',
      default: true,
    },
  ]);

  await depsCommand(answers);
}
