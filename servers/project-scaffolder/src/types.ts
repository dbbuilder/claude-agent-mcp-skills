/**
 * Project Scaffolder Types
 * Type definitions for template-based project generation
 */

export type ProjectTemplate =
  | 'typescript-express'
  | 'typescript-nextjs'
  | 'dotnet-webapi'
  | 'python-fastapi'
  | 'vue3-frontend'
  | 'react-frontend'
  | 'react-native';

export interface TemplateMetadata {
  name: string;
  displayName: string;
  description: string;
  language: string;
  framework: string;
  category: 'backend' | 'frontend' | 'fullstack';
  tags: string[];
  defaultOptions: Record<string, any>;
}

export interface ScaffoldOptions {
  projectName: string;
  template: ProjectTemplate;
  outputPath: string;
  options?: {
    database?: 'postgresql' | 'mysql' | 'sqlserver' | 'sqlite' | 'mongodb';
    authentication?: 'jwt' | 'oauth' | 'none';
    includeDocker?: boolean;
    includeTests?: boolean;
    includeCICD?: boolean;
    author?: string;
    license?: 'MIT' | 'Apache-2.0' | 'GPL-3.0' | 'BSD-3-Clause';
    description?: string;
    gitInit?: boolean;
  };
}

export interface ScaffoldResult {
  projectPath: string;
  filesCreated: string[];
  nextSteps: string[];
  template: ProjectTemplate;
  success: boolean;
  error?: string;
}

export interface TemplateFile {
  path: string;
  content: string;
  mode?: number; // File permissions (e.g., 0o755 for executables)
}

export interface TemplateVariable {
  projectName: string;
  projectDescription: string;
  authorName: string;
  license: string;
  currentYear: number;
  database?: string;
  authentication?: string;
  [key: string]: any;
}
