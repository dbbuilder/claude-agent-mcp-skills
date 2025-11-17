/**
 * Shared logging utilities
 */

import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LoggerOptions {
  level?: LogLevel;
  prefix?: string;
  timestamps?: boolean;
  colors?: boolean;
}

export class Logger {
  private level: LogLevel;
  private prefix: string;
  private timestamps: boolean;
  private colors: boolean;

  constructor(options: LoggerOptions = {}) {
    this.level = options.level ?? LogLevel.INFO;
    this.prefix = options.prefix ?? '';
    this.timestamps = options.timestamps ?? true;
    this.colors = options.colors ?? true;
  }

  private formatMessage(level: string, message: string): string {
    const parts: string[] = [];

    if (this.timestamps) {
      const timestamp = new Date().toISOString();
      parts.push(this.colors ? chalk.gray(`[${timestamp}]`) : `[${timestamp}]`);
    }

    if (this.prefix) {
      parts.push(this.colors ? chalk.cyan(`[${this.prefix}]`) : `[${this.prefix}]`);
    }

    parts.push(this.colors ? this.colorizeLevel(level) : `[${level}]`);
    parts.push(message);

    return parts.join(' ');
  }

  private colorizeLevel(level: string): string {
    switch (level.toUpperCase()) {
      case 'DEBUG':
        return chalk.gray(`[${level}]`);
      case 'INFO':
        return chalk.blue(`[${level}]`);
      case 'WARN':
        return chalk.yellow(`[${level}]`);
      case 'ERROR':
        return chalk.red(`[${level}]`);
      default:
        return `[${level}]`;
    }
  }

  debug(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.DEBUG) {
      console.debug(this.formatMessage('DEBUG', message), ...args);
    }
  }

  info(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.INFO) {
      console.info(this.formatMessage('INFO', message), ...args);
    }
  }

  warn(message: string, ...args: any[]): void {
    if (this.level <= LogLevel.WARN) {
      console.warn(this.formatMessage('WARN', message), ...args);
    }
  }

  error(message: string, error?: Error | unknown): void {
    if (this.level <= LogLevel.ERROR) {
      console.error(this.formatMessage('ERROR', message));

      if (error instanceof Error) {
        console.error(this.colors ? chalk.red(error.stack || error.message) : error.stack || error.message);
      } else if (error) {
        console.error(this.colors ? chalk.red(String(error)) : String(error));
      }
    }
  }

  success(message: string): void {
    console.log(
      this.formatMessage(
        this.colors ? chalk.green('SUCCESS') : 'SUCCESS',
        this.colors ? chalk.green(message) : message
      )
    );
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  child(prefix: string): Logger {
    return new Logger({
      level: this.level,
      prefix: this.prefix ? `${this.prefix}:${prefix}` : prefix,
      timestamps: this.timestamps,
      colors: this.colors,
    });
  }
}

// Default logger instance
export const logger = new Logger({
  prefix: 'MCP',
  timestamps: true,
  colors: true,
});

// Performance timing utility
export class Timer {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  constructor() {
    this.startTime = performance.now();
  }

  mark(label: string): void {
    this.marks.set(label, performance.now());
  }

  elapsed(label?: string): number {
    const endTime = performance.now();
    const startTime = label ? this.marks.get(label) ?? this.startTime : this.startTime;
    return endTime - startTime;
  }

  elapsedFormatted(label?: string): string {
    const ms = this.elapsed(label);

    if (ms < 1000) {
      return `${ms.toFixed(2)}ms`;
    }

    const seconds = ms / 1000;
    if (seconds < 60) {
      return `${seconds.toFixed(2)}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = (seconds % 60).toFixed(0);
    return `${minutes}m ${remainingSeconds}s`;
  }

  log(message: string, label?: string): void {
    logger.info(`${message} (${this.elapsedFormatted(label)})`);
  }
}
