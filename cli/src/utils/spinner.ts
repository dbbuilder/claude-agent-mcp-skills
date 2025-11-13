/**
 * Progress spinner utilities
 */

import ora, { Ora } from 'ora';
import chalk from 'chalk';

export class ProgressSpinner {
  private spinner: Ora;

  constructor(text: string) {
    this.spinner = ora({
      text,
      color: 'cyan',
      spinner: 'dots',
    });
  }

  start(text?: string): void {
    if (text) this.spinner.text = text;
    this.spinner.start();
  }

  update(text: string): void {
    this.spinner.text = text;
  }

  succeed(text?: string): void {
    this.spinner.succeed(text || this.spinner.text);
  }

  fail(text?: string): void {
    this.spinner.fail(text || this.spinner.text);
  }

  warn(text?: string): void {
    this.spinner.warn(text || this.spinner.text);
  }

  info(text?: string): void {
    this.spinner.info(text || this.spinner.text);
  }

  stop(): void {
    this.spinner.stop();
  }
}

export function createSpinner(text: string): ProgressSpinner {
  return new ProgressSpinner(text);
}

export function logSuccess(message: string): void {
  console.log(chalk.green('✔'), message);
}

export function logError(message: string): void {
  console.log(chalk.red('✖'), message);
}

export function logWarning(message: string): void {
  console.log(chalk.yellow('⚠'), message);
}

export function logInfo(message: string): void {
  console.log(chalk.blue('ℹ'), message);
}
