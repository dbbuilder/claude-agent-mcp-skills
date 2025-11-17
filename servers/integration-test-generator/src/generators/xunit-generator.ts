/**
 * xUnit Test Generator
 * Generates integration tests for ASP.NET Core APIs
 */

import { TestCase, TestSuite, GenerateResult } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class XUnitGenerator {
  /**
   * Generate xUnit tests
   */
  generate(testCases: TestCase[], outputPath?: string): GenerateResult {
    try {
      const testSuite = this.buildTestSuite(testCases);
      const content = this.generateTestFile(testSuite);

      const finalPath = outputPath || 'Tests/ApiTests.cs';

      if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, content, 'utf-8');
      }

      return {
        success: true,
        outputPath: finalPath,
        content,
        testsGenerated: testCases.length,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build test suite structure
   */
  private buildTestSuite(testCases: TestCase[]): TestSuite {
    return {
      name: 'API Integration Tests',
      framework: 'xunit',
      testCases,
      setupCode: '',
      teardownCode: '',
      imports: [],
    };
  }

  /**
   * Generate complete test file
   */
  private generateTestFile(testSuite: TestSuite): string {
    const lines: string[] = [];

    // Usings
    lines.push('using System;');
    lines.push('using System.Net;');
    lines.push('using System.Net.Http;');
    lines.push('using System.Net.Http.Json;');
    lines.push('using System.Threading.Tasks;');
    lines.push('using Microsoft.AspNetCore.Mvc.Testing;');
    lines.push('using Xunit;');
    lines.push('using FluentAssertions;');
    lines.push('');

    // Namespace
    lines.push('namespace API.Tests');
    lines.push('{');

    // Group test cases by endpoint
    const grouped = this.groupByEndpoint(testSuite.testCases);

    // Test classes
    for (const [endpoint, cases] of Object.entries(grouped)) {
      const className = this.generateClassName(endpoint);

      lines.push(`    public class ${className} : IClassFixture<WebApplicationFactory<Program>>`);
      lines.push('    {');
      lines.push('        private readonly WebApplicationFactory<Program> _factory;');
      lines.push('        private readonly HttpClient _client;');
      lines.push('        private string _authToken;');
      lines.push('');

      // Constructor
      lines.push(`        public ${className}(WebApplicationFactory<Program> factory)`);
      lines.push('        {');
      lines.push('            _factory = factory;');
      lines.push('            _client = factory.CreateClient();');
      lines.push('        }');
      lines.push('');

      // Setup method (if auth required)
      const needsAuth = cases.some(tc => tc.endpoint.requiresAuth);
      if (needsAuth) {
        lines.push('        private async Task<string> GetAuthTokenAsync()');
        lines.push('        {');
        lines.push('            if (_authToken != null) return _authToken;');
        lines.push('');
        lines.push('            var response = await _client.PostAsJsonAsync("/api/auth/login", new');
        lines.push('            {');
        lines.push('                Email = "test@example.com",');
        lines.push('                Password = "password"');
        lines.push('            });');
        lines.push('');
        lines.push('            var result = await response.Content.ReadFromJsonAsync<dynamic>();');
        lines.push('            _authToken = result.Token;');
        lines.push('            return _authToken;');
        lines.push('        }');
        lines.push('');
      }

      // Test methods
      for (const testCase of cases) {
        lines.push(...this.generateTestCase(testCase, needsAuth));
      }

      lines.push('    }');
      lines.push('');
    }

    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Generate individual test case
   */
  private generateTestCase(testCase: TestCase, needsAuth: boolean): string[] {
    const lines: string[] = [];

    const methodName = this.generateMethodName(testCase.name);

    lines.push('        [Fact]');
    lines.push(`        public async Task ${methodName}()`);
    lines.push('        {');

    // Get auth token if needed
    if (testCase.endpoint.requiresAuth && testCase.scenario !== 'auth-error') {
      lines.push('            // Arrange');
      lines.push('            var token = await GetAuthTokenAsync();');
      lines.push('            _client.DefaultRequestHeaders.Authorization =');
      lines.push('                new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);');
      lines.push('');
    }

    // Build request
    const endpoint = testCase.endpoint;
    let requestPath = endpoint.path;

    // Replace path parameters
    for (const param of endpoint.parameters) {
      if (param.location === 'path') {
        requestPath = requestPath.replace(`{${param.name}}`, param.example || '123');
      }
    }

    lines.push('            // Act');

    // Make request
    const method = endpoint.method.toLowerCase();

    if (['post', 'put', 'patch'].includes(method)) {
      if (testCase.scenario === 'validation-error') {
        lines.push(`            var response = await _client.${this.capitalize(method)}AsJsonAsync("${requestPath}", new { });`);
      } else if (testCase.scenario === 'success') {
        const body = this.generateExampleBody(endpoint);
        lines.push(`            var response = await _client.${this.capitalize(method)}AsJsonAsync("${requestPath}", ${body});`);
      }
    } else if (method === 'delete') {
      lines.push(`            var response = await _client.DeleteAsync("${requestPath}");`);
    } else {
      lines.push(`            var response = await _client.GetAsync("${requestPath}");`);
    }

    lines.push('');

    // Assertions
    lines.push('            // Assert');
    lines.push(`            response.StatusCode.Should().Be(HttpStatusCode.${this.getStatusCodeName(testCase.expectedStatus)});`);

    switch (testCase.scenario) {
      case 'success':
        if (endpoint.method === 'GET') {
          lines.push('            var result = await response.Content.ReadFromJsonAsync<dynamic>();');
          lines.push('            result.Should().NotBeNull();');
        } else if (endpoint.method === 'POST') {
          lines.push('            var result = await response.Content.ReadFromJsonAsync<dynamic>();');
          lines.push('            result.Id.Should().NotBeNull();');
        } else if (endpoint.method === 'DELETE') {
          lines.push('            var result = await response.Content.ReadFromJsonAsync<dynamic>();');
          lines.push('            result.Message.Should().NotBeNullOrEmpty();');
        }
        break;

      case 'validation-error':
        lines.push('            var error = await response.Content.ReadFromJsonAsync<dynamic>();');
        lines.push('            error.Should().NotBeNull();');
        break;

      case 'auth-error':
        lines.push('            // Unauthorized response expected');
        break;

      case 'not-found':
        lines.push('            // Not found response expected');
        break;
    }

    lines.push('        }');
    lines.push('');

    return lines;
  }

  /**
   * Generate example request body
   */
  private generateExampleBody(endpoint: any): string {
    if (endpoint.requestBody) {
      return 'new { }'; // Simplified for now
    }

    if (endpoint.path.includes('user')) {
      return `new
            {
                Name = "Test User",
                Email = "test@example.com",
                Password = "password123"
            }`;
    }

    return 'new { Data = "test" }';
  }

  /**
   * Group test cases by endpoint
   */
  private groupByEndpoint(testCases: TestCase[]): Record<string, TestCase[]> {
    const grouped: Record<string, TestCase[]> = {};

    for (const testCase of testCases) {
      const key = `${testCase.endpoint.method} ${testCase.endpoint.path}`;
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(testCase);
    }

    return grouped;
  }

  /**
   * Generate class name from endpoint
   */
  private generateClassName(endpoint: string): string {
    const parts = endpoint.split(' ');
    const method = parts[0];
    const path = parts[1] || '';
    const resource = path.split('/').filter(p => p && !p.startsWith('{') && p !== 'api').join('');

    return `${method}${this.toPascalCase(resource)}Tests`;
  }

  /**
   * Generate method name from test case name
   */
  private generateMethodName(name: string): string {
    // Convert "GET /users/:id - Success" to "Should_Return_Success"
    const scenario = name.split(' - ')[1] || name;
    return `Should_Return_${scenario.replace(/\s+/g, '_')}`;
  }

  /**
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Capitalize first letter
   */
  private capitalize(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  /**
   * Get HttpStatusCode enum name
   */
  private getStatusCodeName(code: number): string {
    const names: Record<number, string> = {
      200: 'OK',
      201: 'Created',
      204: 'NoContent',
      400: 'BadRequest',
      401: 'Unauthorized',
      403: 'Forbidden',
      404: 'NotFound',
      500: 'InternalServerError',
    };

    return names[code] || 'OK';
  }
}
