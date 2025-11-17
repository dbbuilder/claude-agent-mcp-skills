/**
 * Type definitions for Docker Config Generator
 */

export type ProjectType =
  | 'nodejs'
  | 'nodejs-typescript'
  | 'python-fastapi'
  | 'python-django'
  | 'dotnet-aspnet'
  | 'react'
  | 'nextjs'
  | 'vue'
  | 'static';

export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb' | 'sqlserver' | 'redis' | 'none';

export interface ProjectAnalysis {
  projectType: ProjectType;
  packageManager?: 'npm' | 'yarn' | 'pnpm' | 'pip' | 'poetry' | 'dotnet';
  framework?: string;
  runtime?: string;
  buildCommand?: string;
  startCommand?: string;
  port?: number;
  dependencies: string[];
  devDependencies: string[];
  hasDatabase: boolean;
  databases: DatabaseType[];
  needsCache: boolean;
  hasTests: boolean;
  testCommand?: string;
}

export interface DockerfileOptions {
  projectType: ProjectType;
  baseImage?: string;
  nodeVersion?: string;
  pythonVersion?: string;
  dotnetVersion?: string;
  workdir?: string;
  port?: number;
  buildCommand?: string;
  startCommand?: string;
  multiStage?: boolean;
  includeHealthcheck?: boolean;
  user?: string;
}

export interface DockerComposeOptions {
  projectName: string;
  services: ServiceConfig[];
  networks?: string[];
  volumes?: VolumeConfig[];
}

export interface ServiceConfig {
  name: string;
  type: 'app' | 'database' | 'cache' | 'proxy';
  image?: string;
  build?: {
    context: string;
    dockerfile: string;
  };
  ports?: string[];
  environment?: Record<string, string>;
  volumes?: string[];
  dependsOn?: string[];
  healthcheck?: HealthcheckConfig;
}

export interface HealthcheckConfig {
  test: string[];
  interval: string;
  timeout: string;
  retries: number;
  startPeriod?: string;
}

export interface VolumeConfig {
  name: string;
  driver?: string;
  driverOpts?: Record<string, string>;
}

export interface GenerateResult {
  success: boolean;
  dockerfilePath?: string;
  dockerComposePath?: string;
  dockerignorePath?: string;
  content?: {
    dockerfile: string;
    dockerCompose?: string;
    dockerignore?: string;
  };
  error?: string;
}

export interface AnalyzeOptions {
  projectPath: string;
}

export interface GenerateDockerfileOptions {
  projectPath?: string;
  projectType: ProjectType;
  outputPath?: string;
  options?: Partial<DockerfileOptions>;
}

export interface GenerateComposeOptions {
  projectPath: string;
  outputPath?: string;
  databases?: DatabaseType[];
  includeRedis?: boolean;
}
