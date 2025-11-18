/**
 * API Analyzer
 * Analyzes API endpoints to generate appropriate test cases
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ApiEndpoint, TestCase, Framework } from '../types.js';

export class APIAnalyzer {
  /**
   * Analyze API and generate test cases
   */
  async analyze(projectPath: string, framework?: Framework): Promise<TestCase[]> {
    const endpoints = await this.discoverEndpoints(projectPath, framework);
    const testCases: TestCase[] = [];

    for (const endpoint of endpoints) {
      // Generate test cases for each endpoint
      testCases.push(...this.generateTestCasesForEndpoint(endpoint));
    }

    return testCases;
  }

  /**
   * Discover API endpoints from project
   */
  private async discoverEndpoints(projectPath: string, framework?: Framework): Promise<ApiEndpoint[]> {
    const detectedFramework = framework || this.detectFramework(projectPath);
    const endpoints: ApiEndpoint[] = [];

    switch (detectedFramework) {
      case 'express':
        endpoints.push(...await this.discoverExpressEndpoints(projectPath));
        break;
      case 'fastapi':
        endpoints.push(...await this.discoverFastAPIEndpoints(projectPath));
        break;
      case 'aspnet':
        endpoints.push(...await this.discoverAspNetEndpoints(projectPath));
        break;
    }

    return endpoints;
  }

  /**
   * Discover Express endpoints
   */
  private async discoverExpressEndpoints(projectPath: string): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    const files = await glob('**/*.{ts,js}', {
      cwd: projectPath,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/*.test.{ts,js}'],
    });

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Pattern: router.get('/path', handler)
      const routePattern = /(?:router|app)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi;

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        routePattern.lastIndex = 0;
        let match;

        while ((match = routePattern.exec(line)) !== null) {
          const method = match[1].toUpperCase() as any;
          const routePath = match[2];

          endpoints.push({
            path: routePath,
            method,
            handler: this.extractHandler(line),
            requiresAuth: this.checkAuthRequired(lines, lineNum),
            parameters: this.extractPathParams(routePath),
            responses: [{ statusCode: 200, description: 'Success' }],
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Discover FastAPI endpoints
   */
  private async discoverFastAPIEndpoints(projectPath: string): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    const files = await glob('**/*.py', {
      cwd: projectPath,
      absolute: true,
      ignore: ['**/venv/**', '**/__pycache__/**', '**/test_*.py'],
    });

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Pattern: @app.get("/path") or @router.get("/path")
      const routePattern = /@(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*["']([^"']+)["']/gi;

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        routePattern.lastIndex = 0;
        let match;

        while ((match = routePattern.exec(line)) !== null) {
          const method = match[1].toUpperCase() as any;
          const routePath = match[2];

          endpoints.push({
            path: routePath,
            method,
            handler: this.extractPythonHandler(lines, lineNum),
            requiresAuth: this.checkPythonAuthRequired(lines, lineNum),
            parameters: this.extractPathParamsPython(routePath),
            responses: [{ statusCode: 200, description: 'Success' }],
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Discover ASP.NET endpoints
   */
  private async discoverAspNetEndpoints(projectPath: string): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];
    const files = await glob('**/*Controller.cs', {
      cwd: projectPath,
      absolute: true,
      ignore: ['**/bin/**', '**/obj/**'],
    });

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      const controllerRoute = this.extractControllerRoute(content);

      // Pattern: [HttpGet] or [HttpGet("path")]
      const methodPattern = /\[Http(Get|Post|Put|Patch|Delete)(?:\("?([^"]*)"?\))?\]/gi;

      for (let lineNum = 0; lineNum < lines.length; lineNum++) {
        const line = lines[lineNum];
        methodPattern.lastIndex = 0;
        let match;

        while ((match = methodPattern.exec(line)) !== null) {
          const method = match[1].toUpperCase() as any;
          const actionRoute = match[2] || '';
          const fullPath = this.combinePaths(controllerRoute, actionRoute);

          endpoints.push({
            path: fullPath,
            method,
            handler: this.extractCSharpHandler(lines, lineNum),
            requiresAuth: this.checkCSharpAuthRequired(lines, lineNum),
            parameters: this.extractPathParams(fullPath),
            responses: [{ statusCode: 200, description: 'Success' }],
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Generate test cases for an endpoint
   */
  private generateTestCasesForEndpoint(endpoint: ApiEndpoint): TestCase[] {
    const testCases: TestCase[] = [];

    // Success case
    testCases.push({
      name: `${endpoint.method} ${endpoint.path} - Success`,
      endpoint,
      scenario: 'success',
      expectedStatus: 200,
    });

    // Authentication error (if auth required)
    if (endpoint.requiresAuth) {
      testCases.push({
        name: `${endpoint.method} ${endpoint.path} - Unauthorized`,
        endpoint,
        scenario: 'auth-error',
        expectedStatus: 401,
      });
    }

    // Validation error (for POST/PUT/PATCH)
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      testCases.push({
        name: `${endpoint.method} ${endpoint.path} - Invalid Body`,
        endpoint,
        scenario: 'validation-error',
        expectedStatus: 400,
      });
    }

    // Not found (for GET with ID parameter)
    if (endpoint.method === 'GET' && endpoint.parameters.some(p => p.name.match(/id$/i))) {
      testCases.push({
        name: `${endpoint.method} ${endpoint.path} - Not Found`,
        endpoint,
        scenario: 'not-found',
        expectedStatus: 404,
      });
    }

    return testCases;
  }

  /**
   * Helper methods
   */

  private detectFramework(projectPath: string): Framework {
    if (fs.existsSync(path.join(projectPath, 'package.json'))) return 'express';
    if (fs.existsSync(path.join(projectPath, 'requirements.txt'))) return 'fastapi';
    if (fs.existsSync(path.join(projectPath, '*.csproj'))) return 'aspnet';
    return 'express';
  }

  private extractHandler(line: string): string {
    const match = line.match(/,\s*(\w+)\s*\)/);
    return match ? match[1] : 'handler';
  }

  private extractPythonHandler(lines: string[], startLine: number): string {
    for (let i = startLine + 1; i < Math.min(startLine + 3, lines.length); i++) {
      const match = lines[i].match(/def\s+(\w+)/);
      if (match) return match[1];
    }
    return 'handler';
  }

  private extractCSharpHandler(lines: string[], startLine: number): string {
    for (let i = startLine + 1; i < Math.min(startLine + 5, lines.length); i++) {
      const match = lines[i].match(/\s+(\w+)\s*\(/);
      if (match) return match[1];
    }
    return 'handler';
  }

  private checkAuthRequired(lines: string[], lineNum: number): boolean {
    for (let i = Math.max(0, lineNum - 5); i < lineNum; i++) {
      if (lines[i].includes('authenticate') || lines[i].includes('requireAuth')) {
        return true;
      }
    }
    return false;
  }

  private checkPythonAuthRequired(lines: string[], lineNum: number): boolean {
    for (let i = Math.max(0, lineNum - 5); i < lineNum; i++) {
      if (lines[i].includes('Depends(') && lines[i].includes('auth')) {
        return true;
      }
    }
    return false;
  }

  private checkCSharpAuthRequired(lines: string[], lineNum: number): boolean {
    for (let i = Math.max(0, lineNum - 5); i < lineNum; i++) {
      if (lines[i].includes('[Authorize]')) {
        return true;
      }
    }
    return false;
  }

  private extractPathParams(path: string): any[] {
    const params: any[] = [];
    // Express style: /users/:id
    const expressParams = path.matchAll(/:(\w+)/g);
    for (const match of expressParams) {
      params.push({
        name: match[1],
        location: 'path',
        type: 'string',
        required: true,
        example: match[1] === 'id' ? '123' : 'value',
      });
    }
    // ASP.NET style: /users/{id}
    const aspnetParams = path.matchAll(/\{(\w+)\}/g);
    for (const match of aspnetParams) {
      if (!params.find(p => p.name === match[1])) {
        params.push({
          name: match[1],
          location: 'path',
          type: 'string',
          required: true,
          example: match[1] === 'id' ? '123' : 'value',
        });
      }
    }
    return params;
  }

  private extractPathParamsPython(path: string): any[] {
    const params: any[] = [];
    // Python style: /users/{user_id}
    const pythonParams = path.matchAll(/\{(\w+)\}/g);
    for (const match of pythonParams) {
      params.push({
        name: match[1],
        location: 'path',
        type: 'string',
        required: true,
        example: match[1].includes('id') ? '123' : 'value',
      });
    }
    return params;
  }

  private extractControllerRoute(content: string): string {
    const match = content.match(/\[Route\("([^"]+)"\)\]/);
    return match ? match[1].replace('[controller]', '') : 'api';
  }

  private combinePaths(base: string, action: string): string {
    const cleanBase = base.replace(/^\/+|\/+$/g, '');
    const cleanAction = action.replace(/^\/+|\/+$/g, '');
    return `/${cleanBase}${cleanAction ? '/' + cleanAction : ''}`;
  }
}
