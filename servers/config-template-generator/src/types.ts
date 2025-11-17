/**
 * Type definitions for Config Template Generator
 */

export type ConfigVarType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'url'
  | 'email'
  | 'port'
  | 'database_url'
  | 'api_key'
  | 'secret'
  | 'jwt_secret'
  | 'path'
  | 'json';

export type ConfigVarCategory =
  | 'database'
  | 'api'
  | 'authentication'
  | 'email'
  | 'storage'
  | 'cache'
  | 'feature_flags'
  | 'logging'
  | 'monitoring'
  | 'general';

export interface ConfigVariable {
  name: string;
  type: ConfigVarType;
  category: ConfigVarCategory;
  description?: string;
  required: boolean;
  defaultValue?: string;
  exampleValue?: string;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  format?: string;
  sensitive: boolean;
  usages: ConfigVariableUsage[];
}

export interface ConfigVariableUsage {
  filePath: string;
  lineNumber: number;
  context: string;
  accessPattern: string;
}

export interface DiscoveryResult {
  variables: ConfigVariable[];
  frameworks: string[];
  configFiles: string[];
  totalUsages: number;
}

export interface TemplateGenerationOptions {
  includeExamples: boolean;
  includeDescriptions: boolean;
  includeValidation: boolean;
  format: 'env' | 'json' | 'yaml';
  groupByCategory: boolean;
}

export interface ValidationSchema {
  framework: 'zod' | 'joi' | 'yup';
  code: string;
}

export interface GenerateResult {
  success: boolean;
  templatePath?: string;
  validationPath?: string;
  variablesCount?: number;
  content?: {
    template: string;
    validation?: string;
    documentation?: string;
  };
  error?: string;
}

export interface DiscoverOptions {
  projectPath: string;
  includeNodeModules?: boolean;
  customPatterns?: string[];
}

export interface GenerateTemplateOptions {
  variables: ConfigVariable[];
  outputPath?: string;
  format?: 'env' | 'json' | 'yaml';
  includeValidation?: boolean;
  validationFramework?: 'zod' | 'joi' | 'yup';
}
