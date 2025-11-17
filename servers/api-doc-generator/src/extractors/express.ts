/**
 * Express/Node.js Endpoint Extractor
 * Extracts API endpoints from Express applications
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import { ApiEndpoint, HttpMethod, ApiParameter, ApiResponse } from '../types.js';

export class ExpressExtractor {
  /**
   * Extract endpoints from Express project
   */
  async extract(projectPath: string): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];

    // Find all TypeScript/JavaScript files
    const files = await glob('**/*.{ts,js}', {
      cwd: projectPath,
      absolute: true,
      ignore: [
        '**/node_modules/**',
        '**/dist/**',
        '**/build/**',
        '**/*.test.{ts,js}',
        '**/*.spec.{ts,js}',
      ],
    });

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileEndpoints = this.parseExpressFile(content, filePath);
        endpoints.push(...fileEndpoints);
      } catch (error) {
        console.warn(`Failed to parse ${filePath}:`, error);
      }
    }

    return endpoints;
  }

  /**
   * Parse Express routes from file content
   */
  private parseExpressFile(content: string, filePath: string): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const lines = content.split('\n');

    // Patterns to match Express routes
    const routePatterns = [
      // router.get('/path', handler)
      /(?:router|app)\.(get|post|put|patch|delete|head|options)\s*\(\s*['"`]([^'"`]+)['"`]/g,
      // @Get('/path') decorator
      /@(Get|Post|Put|Patch|Delete|Head|Options)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    ];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const pattern of routePatterns) {
        pattern.lastIndex = 0; // Reset regex
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const method = match[1].toUpperCase() as HttpMethod;
          const routePath = match[2];

          // Extract JSDoc comments above the route
          const documentation = this.extractJSDoc(lines, lineNum);

          endpoints.push({
            path: routePath,
            method,
            handler: this.extractHandlerName(line),
            description: documentation.description,
            summary: documentation.summary || `${method} ${routePath}`,
            tags: documentation.tags,
            parameters: this.extractParameters(routePath, documentation),
            responses: this.extractResponses(documentation),
            authentication: documentation.authentication,
            filePath,
            lineNumber: lineNum + 1,
          });
        }
      }
    }

    return endpoints;
  }

  /**
   * Extract JSDoc comments above route definition
   */
  private extractJSDoc(lines: string[], currentLine: number): any {
    const doc: any = {
      description: '',
      summary: '',
      tags: [],
      authentication: [],
      parameters: [],
      responses: [],
    };

    // Look backwards for JSDoc comment
    let i = currentLine - 1;
    const commentLines: string[] = [];

    while (i >= 0) {
      const line = lines[i].trim();
      if (line.startsWith('*/')) {
        // Found end of comment, continue
        i--;
        continue;
      }
      if (line.startsWith('/**') || line.startsWith('/*')) {
        // Found start of comment
        break;
      }
      if (line.startsWith('*')) {
        commentLines.unshift(line.replace(/^\*\s?/, ''));
      } else if (!line) {
        // Empty line, continue
      } else {
        // Non-comment line, stop
        break;
      }
      i--;
    }

    // Parse JSDoc tags
    let currentDescription = '';

    for (const line of commentLines) {
      if (line.startsWith('@')) {
        const tagMatch = line.match(/@(\w+)\s+(.*)/);
        if (tagMatch) {
          const [, tag, value] = tagMatch;

          switch (tag) {
            case 'summary':
              doc.summary = value;
              break;
            case 'description':
            case 'desc':
              doc.description = value;
              break;
            case 'tag':
            case 'tags':
              doc.tags.push(value);
              break;
            case 'auth':
            case 'authentication':
              doc.authentication.push(value);
              break;
            case 'param':
            case 'parameter':
              // @param {type} name - description
              const paramMatch = value.match(/\{(\w+)\}\s+(\w+)\s+-\s+(.*)/);
              if (paramMatch) {
                doc.parameters.push({
                  name: paramMatch[2],
                  type: paramMatch[1],
                  description: paramMatch[3],
                });
              }
              break;
            case 'returns':
            case 'response':
              // @returns {statusCode} description
              const responseMatch = value.match(/\{?(\d+)\}?\s+(.*)/);
              if (responseMatch) {
                doc.responses.push({
                  statusCode: parseInt(responseMatch[1]),
                  description: responseMatch[2],
                });
              }
              break;
          }
        }
      } else {
        currentDescription += (currentDescription ? ' ' : '') + line;
      }
    }

    if (!doc.description && currentDescription) {
      doc.description = currentDescription;
    }

    return doc;
  }

  /**
   * Extract handler function name
   */
  private extractHandlerName(line: string): string {
    // Try to extract handler name from various patterns
    const patterns = [
      /,\s*(\w+)\s*\)/,  // (path, handlerName)
      /async\s+(\w+)/,   // async handlerName
      /function\s+(\w+)/, // function handlerName
    ];

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) return match[1];
    }

    return 'anonymous';
  }

  /**
   * Extract parameters from route path and documentation
   */
  private extractParameters(routePath: string, documentation: any): ApiParameter[] {
    const parameters: ApiParameter[] = [];

    // Extract path parameters (e.g., /users/:id)
    const pathParamMatches = routePath.matchAll(/:(\w+)/g);
    for (const match of pathParamMatches) {
      const paramName = match[1];
      const docParam = documentation.parameters.find((p: any) => p.name === paramName);

      parameters.push({
        name: paramName,
        location: 'path',
        type: docParam?.type || 'string',
        required: true,
        description: docParam?.description || `Path parameter: ${paramName}`,
      });
    }

    // Add documented parameters
    for (const docParam of documentation.parameters) {
      if (!parameters.find(p => p.name === docParam.name)) {
        parameters.push({
          name: docParam.name,
          location: 'query',
          type: docParam.type || 'string',
          required: false,
          description: docParam.description,
        });
      }
    }

    return parameters;
  }

  /**
   * Extract response definitions
   */
  private extractResponses(documentation: any): ApiResponse[] {
    const responses: ApiResponse[] = [];

    // Add documented responses
    for (const docResponse of documentation.responses) {
      responses.push({
        statusCode: docResponse.statusCode,
        description: docResponse.description,
      });
    }

    // Add default 200 response if none specified
    if (responses.length === 0) {
      responses.push({
        statusCode: 200,
        description: 'Successful response',
      });
    }

    return responses;
  }
}
