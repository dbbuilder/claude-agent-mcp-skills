/**
 * README Generator Types
 */

export interface ProjectAnalysis {
  projectPath: string;
  projectName: string;
  techStack: TechStack;
  structure: ProjectStructure;
  scripts: Record<string, string>;
  envVars: EnvVariable[];
  configuration: ConfigFile[];
  hasTests: boolean;
  hasDocker: boolean;
  hasCICD: boolean;
  license?: string;
}

export interface TechStack {
  languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  packageManager: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'cargo' | 'go' | 'dotnet' | null;
}

export interface ProjectStructure {
  directories: string[];
  fileTypes: Record<string, number>;
  totalFiles: number;
  mainEntryPoint?: string;
}

export interface EnvVariable {
  name: string;
  description?: string;
  required: boolean;
  defaultValue?: string;
  example?: string;
}

export interface ConfigFile {
  path: string;
  type: string;
  purpose: string;
}

export interface GenerateOptions {
  projectPath: string;
  options?: {
    title?: string;
    description?: string;
    includeStructure?: boolean;
    includeBadges?: boolean;
    includeEnvVars?: boolean;
    includeTOC?: boolean;
    overwrite?: boolean;
    outputPath?: string;
  };
}

export interface GenerateResult {
  content: string;
  filePath: string;
  sections: string[];
  warnings: string[];
  analysis: ProjectAnalysis;
  success: boolean;
  error?: string;
}
