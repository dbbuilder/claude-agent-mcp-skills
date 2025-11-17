/**
 * Markdown Documentation Generator
 * Generates human-readable Markdown API documentation
 */

import { ApiDocumentation, ApiEndpoint, GenerateResult } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';

export class MarkdownGenerator {
  /**
   * Generate Markdown documentation
   */
  generate(documentation: ApiDocumentation, outputPath?: string): GenerateResult {
    try {
      const content = this.buildMarkdown(documentation);

      // Write to file if path provided
      if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(outputPath, content, 'utf-8');
      }

      return {
        success: true,
        outputPath: outputPath || 'API.md',
        content,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build Markdown documentation
   */
  private buildMarkdown(documentation: ApiDocumentation): string {
    const sections: string[] = [];

    // Title and description
    sections.push(`# ${documentation.title || 'API Documentation'}\n`);

    if (documentation.description) {
      sections.push(`${documentation.description}\n`);
    }

    sections.push(`**Version:** ${documentation.version || '1.0.0'}\n`);

    if (documentation.baseUrl) {
      sections.push(`**Base URL:** \`${documentation.baseUrl}\`\n`);
    }

    // Table of contents
    sections.push('## Table of Contents\n');
    const groupedEndpoints = this.groupByTag(documentation.endpoints);

    for (const [tag, endpoints] of Object.entries(groupedEndpoints)) {
      sections.push(`- [${tag}](#${tag.toLowerCase().replace(/\s+/g, '-')})`);
      for (const endpoint of endpoints) {
        const anchorLink = this.createAnchorLink(endpoint);
        sections.push(`  - [${endpoint.method} ${endpoint.path}](#${anchorLink})`);
      }
    }
    sections.push('');

    // Authentication section
    if (documentation.securitySchemes) {
      sections.push('## Authentication\n');
      sections.push(this.buildAuthenticationSection(documentation.securitySchemes));
      sections.push('');
    }

    // Endpoints by tag
    for (const [tag, endpoints] of Object.entries(groupedEndpoints)) {
      sections.push(`## ${tag}\n`);

      for (const endpoint of endpoints) {
        sections.push(this.buildEndpointSection(endpoint));
        sections.push('');
      }
    }

    // Error codes section
    sections.push('## Common Error Codes\n');
    sections.push(this.buildErrorCodesSection());
    sections.push('');

    // Footer
    sections.push('---\n');
    sections.push('*Documentation generated automatically*');

    return sections.join('\n');
  }

  /**
   * Group endpoints by tag
   */
  private groupByTag(endpoints: ApiEndpoint[]): Record<string, ApiEndpoint[]> {
    const groups: Record<string, ApiEndpoint[]> = {};

    for (const endpoint of endpoints) {
      const tag = endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags[0] : 'Default';

      if (!groups[tag]) {
        groups[tag] = [];
      }
      groups[tag].push(endpoint);
    }

    return groups;
  }

  /**
   * Create anchor link for endpoint
   */
  private createAnchorLink(endpoint: ApiEndpoint): string {
    return `${endpoint.method.toLowerCase()}-${endpoint.path.replace(/[^a-zA-Z0-9]/g, '-')}`;
  }

  /**
   * Build endpoint section
   */
  private buildEndpointSection(endpoint: ApiEndpoint): string {
    const lines: string[] = [];

    // Header
    const methodBadge = this.getMethodBadge(endpoint.method);
    lines.push(`### ${methodBadge} ${endpoint.path}\n`);

    if (endpoint.summary) {
      lines.push(`**${endpoint.summary}**\n`);
    }

    if (endpoint.description) {
      lines.push(`${endpoint.description}\n`);
    }

    // Authentication
    if (endpoint.authentication && endpoint.authentication.length > 0) {
      lines.push(`🔒 **Authentication required:** ${endpoint.authentication.join(', ')}\n`);
    }

    // Parameters
    if (endpoint.parameters.length > 0) {
      lines.push('#### Parameters\n');

      // Group by location
      const pathParams = endpoint.parameters.filter(p => p.location === 'path');
      const queryParams = endpoint.parameters.filter(p => p.location === 'query');
      const headerParams = endpoint.parameters.filter(p => p.location === 'header');
      const bodyParams = endpoint.parameters.filter(p => p.location === 'body');

      if (pathParams.length > 0) {
        lines.push('**Path Parameters:**\n');
        lines.push(this.buildParametersTable(pathParams));
      }

      if (queryParams.length > 0) {
        lines.push('**Query Parameters:**\n');
        lines.push(this.buildParametersTable(queryParams));
      }

      if (headerParams.length > 0) {
        lines.push('**Headers:**\n');
        lines.push(this.buildParametersTable(headerParams));
      }

      if (bodyParams.length > 0) {
        lines.push('**Request Body:**\n');
        lines.push(this.buildParametersTable(bodyParams));
      }

      lines.push('');
    }

    // Responses
    if (endpoint.responses.length > 0) {
      lines.push('#### Responses\n');
      lines.push(this.buildResponsesTable(endpoint.responses));
      lines.push('');
    }

    // Example
    lines.push('#### Example Request\n');
    lines.push(this.buildExampleRequest(endpoint));
    lines.push('');

    return lines.join('\n');
  }

  /**
   * Get method badge
   */
  private getMethodBadge(method: string): string {
    const badges: Record<string, string> = {
      GET: '`GET`',
      POST: '`POST`',
      PUT: '`PUT`',
      PATCH: '`PATCH`',
      DELETE: '`DELETE`',
      HEAD: '`HEAD`',
      OPTIONS: '`OPTIONS`',
    };

    return badges[method] || `\`${method}\``;
  }

  /**
   * Build parameters table
   */
  private buildParametersTable(parameters: any[]): string {
    const lines: string[] = [];

    lines.push('| Name | Type | Required | Description |');
    lines.push('|------|------|----------|-------------|');

    for (const param of parameters) {
      const required = param.required ? '✓' : '';
      const description = param.description || '';
      lines.push(`| \`${param.name}\` | ${param.type} | ${required} | ${description} |`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Build responses table
   */
  private buildResponsesTable(responses: any[]): string {
    const lines: string[] = [];

    lines.push('| Status Code | Description |');
    lines.push('|-------------|-------------|');

    for (const response of responses) {
      lines.push(`| ${response.statusCode} | ${response.description} |`);
    }

    return lines.join('\n');
  }

  /**
   * Build example request
   */
  private buildExampleRequest(endpoint: ApiEndpoint): string {
    const lines: string[] = [];
    const pathParams = endpoint.parameters.filter(p => p.location === 'path');
    const queryParams = endpoint.parameters.filter(p => p.location === 'query');

    // Build example path
    let examplePath = endpoint.path;
    for (const param of pathParams) {
      examplePath = examplePath.replace(`{${param.name}}`, param.example || `{${param.name}}`);
      examplePath = examplePath.replace(`:${param.name}`, param.example || `:${param.name}`);
    }

    // Add query parameters
    if (queryParams.length > 0) {
      const queryString = queryParams
        .map(p => `${p.name}=${p.example || 'value'}`)
        .join('&');
      examplePath += `?${queryString}`;
    }

    lines.push('```bash');
    lines.push(`curl -X ${endpoint.method} \\`);

    if (endpoint.authentication && endpoint.authentication.length > 0) {
      lines.push(`  -H "Authorization: Bearer YOUR_TOKEN" \\`);
    }

    lines.push(`  -H "Content-Type: application/json" \\`);

    // Add request body for POST/PUT/PATCH
    if (['POST', 'PUT', 'PATCH'].includes(endpoint.method)) {
      lines.push(`  -d '{"key": "value"}' \\`);
    }

    lines.push(`  "https://api.example.com${examplePath}"`);
    lines.push('```');

    return lines.join('\n');
  }

  /**
   * Build authentication section
   */
  private buildAuthenticationSection(securitySchemes: Record<string, any>): string {
    const lines: string[] = [];

    for (const [name, scheme] of Object.entries(securitySchemes)) {
      lines.push(`### ${name}\n`);

      if (scheme.type === 'http' && scheme.scheme === 'bearer') {
        lines.push('Bearer token authentication using JWT.\n');
        lines.push('```bash');
        lines.push('Authorization: Bearer YOUR_JWT_TOKEN');
        lines.push('```\n');
      } else if (scheme.type === 'apiKey') {
        lines.push(`API Key authentication in ${scheme.in}: \`${scheme.name}\`\n`);
        lines.push('```bash');
        lines.push(`${scheme.name}: YOUR_API_KEY`);
        lines.push('```\n');
      }
    }

    return lines.join('\n');
  }

  /**
   * Build error codes section
   */
  private buildErrorCodesSection(): string {
    const lines: string[] = [];

    lines.push('| Status Code | Meaning |');
    lines.push('|-------------|---------|');
    lines.push('| 200 | Success |');
    lines.push('| 201 | Created |');
    lines.push('| 400 | Bad Request - Invalid parameters |');
    lines.push('| 401 | Unauthorized - Invalid or missing authentication |');
    lines.push('| 403 | Forbidden - Insufficient permissions |');
    lines.push('| 404 | Not Found - Resource does not exist |');
    lines.push('| 422 | Unprocessable Entity - Validation error |');
    lines.push('| 500 | Internal Server Error |');

    return lines.join('\n');
  }
}
