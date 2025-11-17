/**
 * Type definitions for CLI
 */

export interface ServerInfo {
  name: string;
  description: string;
  path: string;
  commands: CommandInfo[];
}

export interface CommandInfo {
  name: string;
  description: string;
  args: ArgumentInfo[];
}

export interface ArgumentInfo {
  name: string;
  description: string;
  required: boolean;
  default?: string;
}

export interface ServerRegistry {
  [key: string]: ServerInfo;
}
