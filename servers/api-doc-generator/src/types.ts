/**
 * Type definitions for API Documentation Generator
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type ParameterLocation = 'path' | 'query' | 'header' | 'body';

export interface ApiParameter {
  name: string;
  location: ParameterLocation;
  type: string;
  required: boolean;
  description?: string;
  example?: any;
  schema?: any;
}

export interface ApiResponse {
  statusCode: number;
  description: string;
  schema?: any;
  example?: any;
}

export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  handler: string;
  description?: string;
  summary?: string;
  tags?: string[];
  parameters: ApiParameter[];
  responses: ApiResponse[];
  authentication?: string[];
  filePath: string;
  lineNumber?: number;
}

export interface ApiDocumentation {
  title: string;
  version: string;
  description?: string;
  baseUrl?: string;
  endpoints: ApiEndpoint[];
  schemas?: Record<string, any>;
  securitySchemes?: Record<string, any>;
}

export type Framework = 'express' | 'fastapi' | 'aspnet' | 'unknown';

export interface ExtractOptions {
  projectPath: string;
  framework?: Framework;
  includePrivate?: boolean;
}

export interface GenerateOptions {
  documentation: ApiDocumentation;
  outputPath?: string;
  format?: 'openapi' | 'markdown' | 'both';
  includeExamples?: boolean;
}

export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  content?: string;
  error?: string;
}
