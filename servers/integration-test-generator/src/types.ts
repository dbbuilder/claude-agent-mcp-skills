/**
 * Type definitions for Integration Test Generator
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type Framework = 'express' | 'fastapi' | 'aspnet';
export type TestFramework = 'jest' | 'pytest' | 'xunit';

export interface ApiEndpoint {
  path: string;
  method: HttpMethod;
  handler: string;
  description?: string;
  requiresAuth: boolean;
  parameters: EndpointParameter[];
  requestBody?: RequestBodySchema;
  responses: ResponseDefinition[];
}

export interface EndpointParameter {
  name: string;
  location: 'path' | 'query' | 'header';
  type: string;
  required: boolean;
  example?: any;
}

export interface RequestBodySchema {
  type: string;
  properties?: Record<string, PropertySchema>;
  example?: any;
}

export interface PropertySchema {
  type: string;
  required?: boolean;
  example?: any;
}

export interface ResponseDefinition {
  statusCode: number;
  description: string;
  schema?: any;
}

export interface TestCase {
  name: string;
  endpoint: ApiEndpoint;
  scenario: 'success' | 'validation-error' | 'auth-error' | 'not-found' | 'server-error';
  expectedStatus: number;
  setupCode?: string;
  teardownCode?: string;
}

export interface TestSuite {
  name: string;
  framework: TestFramework;
  testCases: TestCase[];
  setupCode: string;
  teardownCode: string;
  imports: string[];
}

export interface AnalyzeOptions {
  projectPath: string;
  framework?: Framework;
}

export interface GenerateOptions {
  projectPath: string;
  outputPath?: string;
  testFramework?: TestFramework;
  framework?: Framework;
  includeAuthTests?: boolean;
  includeErrorTests?: boolean;
}

export interface GenerateResult {
  success: boolean;
  outputPath?: string;
  content?: string;
  testsGenerated?: number;
  error?: string;
}
