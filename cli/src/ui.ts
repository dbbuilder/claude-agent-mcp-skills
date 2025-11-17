/**
 * UI utilities for CLI
 */

import chalk from 'chalk';
import ora, { Ora } from 'ora';
import figlet from 'figlet';

export class UI {
  private spinner: Ora | null = null;

  /**
   * Display banner
   */
  banner(): void {
    const banner = figlet.textSync('Claude Agent SDK', {
      font: 'Standard',
      horizontalLayout: 'default',
    });
    console.log(chalk.cyan(banner));
    console.log(chalk.gray('MCP Servers Unified CLI\n'));
  }

  /**
   * Display success message
   */
  success(message: string): void {
    console.log(chalk.green('✓'), message);
  }

  /**
   * Display error message
   */
  error(message: string): void {
    console.log(chalk.red('✗'), message);
  }

  /**
   * Display warning message
   */
  warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  /**
   * Display info message
   */
  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  /**
   * Start spinner
   */
  startSpinner(text: string): void {
    this.spinner = ora({
      text,
      color: 'cyan',
    }).start();
  }

  /**
   * Update spinner text
   */
  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  /**
   * Stop spinner with success
   */
  succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  /**
   * Stop spinner with failure
   */
  failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  /**
   * Display section header
   */
  header(text: string): void {
    console.log('\n' + chalk.bold.underline(text) + '\n');
  }

  /**
   * Display list item
   */
  listItem(text: string, indent: number = 0): void {
    const prefix = '  '.repeat(indent) + chalk.gray('•');
    console.log(prefix, text);
  }

  /**
   * Display table
   */
  table(headers: string[], rows: string[][]): void {
    const columnWidths = headers.map((h, i) => {
      const maxContentWidth = Math.max(
        h.length,
        ...rows.map(r => (r[i] || '').length)
      );
      return maxContentWidth + 2;
    });

    // Header
    const headerRow = headers
      .map((h, i) => h.padEnd(columnWidths[i]))
      .join(' ');
    console.log(chalk.bold(headerRow));

    // Separator
    const separator = columnWidths.map(w => '-'.repeat(w)).join(' ');
    console.log(chalk.gray(separator));

    // Rows
    rows.forEach(row => {
      const formattedRow = row
        .map((cell, i) => (cell || '').padEnd(columnWidths[i]))
        .join(' ');
      console.log(formattedRow);
    });
  }

  /**
   * Display key-value pair
   */
  keyValue(key: string, value: string): void {
    console.log(chalk.bold(key + ':'), value);
  }

  /**
   * Display blank line
   */
  blank(): void {
    console.log();
  }
}

export const ui = new UI();
