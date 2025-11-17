/**
 * FastAPI/Python Endpoint Extractor
 * Extracts API endpoints from FastAPI applications
 */

import * as fs from 'fs';
import { glob } from 'glob';
import { ApiEndpoint, HttpMethod, ApiParameter, ApiResponse } from '../types.js';

export class FastAPIExtractor {
  /**
   * Extract endpoints from FastAPI project
   */
  async extract(projectPath: string): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];

    // Find all Python files
    const files = await glob('**/*.py', {
      cwd: projectPath,
      absolute: true,
      ignore: [
        '**/venv/**',
        '**/__pycache__/**',
        '**/test_*.py',
        '**/*_test.py',
      ],
    });

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileEndpoints = this.parseFastAPIFile(content, filePath);
        endpoints.push(...fileEndpoints);
      } catch (error) {
        console.warn(`Failed to parse ${filePath}:`, error);
      }
    }

    return endpoints;
  }

  /**
   * Parse FastAPI routes from file content
   */
  private parseFastAPIFile(content: string, filePath: string): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const lines = content.split('\n');

    // Patterns to match FastAPI routes
    // @app.get("/path") or @router.get("/path")
    const routePattern = /@(?:app|router)\.(get|post|put|patch|delete|head|options)\s*\(\s*["']([^"']+)["']/gi;

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];
      routePattern.lastIndex = 0;
      let match;

      while ((match = routePattern.exec(line)) !== null) {
        const method = match[1].toUpperCase() as HttpMethod;
        const routePath = match[2];

        // Extract function definition and docstring
        const documentation = this.extractDocstring(lines, lineNum);

        endpoints.push({
          path: routePath,
          method,
          handler: documentation.functionName || 'anonymous',
          description: documentation.description,
          summary: documentation.summary || `${method} ${routePath}`,
          tags: documentation.tags,
          parameters: this.extractParameters(routePath, documentation, lines, lineNum),
          responses: this.extractResponses(documentation),
          authentication: documentation.authentication,
          filePath,
          lineNumber: lineNum + 1,
        });
      }
    }

    return endpoints;
  }

  /**
   * Extract Python docstring and route metadata
   */
  private extractDocstring(lines: string[], decoratorLine: number): any {
    const doc: any = {
      functionName: '',
      description: '',
      summary: '',
      tags: [],
      authentication: [],
      parameters: [],
      responses: [],
    };

    // Find function definition (should be next non-empty line after decorator)
    let funcLine = decoratorLine + 1;
    while (funcLine < lines.length && !lines[funcLine].trim()) {
      funcLine++;
    }

    if (funcLine < lines.length) {
      const funcMatch = lines[funcLine].match(/def\s+(\w+)/);
      if (funcMatch) {
        doc.functionName = funcMatch[1];
      }
    }

    // Look for docstring (triple quotes)
    let docstringStart = funcLine + 1;
    while (docstringStart < lines.length && !lines[docstringStart].trim()) {
      docstringStart++;
    }

    if (docstringStart < lines.length && lines[docstringStart].trim().startsWith('"""')) {
      const docstringLines: string[] = [];
      let i = docstringStart;
      let foundEnd = false;

      // First line might have content after """
      const firstLine = lines[i].trim().substring(3);
      if (firstLine.endsWith('"""')) {
        // Single line docstring
        docstringLines.push(firstLine.substring(0, firstLine.length - 3));
        foundEnd = true;
      } else if (firstLine) {
        docstringLines.push(firstLine);
      }

      i++;

      // Multi-line docstring
      while (!foundEnd && i < lines.length) {
        const line = lines[i].trim();
        if (line.endsWith('"""')) {
          docstringLines.push(line.substring(0, line.length - 3));
          foundEnd = true;
        } else {
          docstringLines.push(line);
        }
        i++;
      }

      // Parse docstring content
      let currentSection = 'description';
      for (const line of docstringLines) {
        if (line.startsWith('Args:') || line.startsWith('Parameters:')) {
          currentSection = 'parameters';
          continue;
        } else if (line.startsWith('Returns:')) {
          currentSection = 'returns';
          continue;
        } else if (line.startsWith('Raises:')) {
          currentSection = 'raises';
          continue;
        }

        if (currentSection === 'description') {
          if (!doc.summary && line) {
            doc.summary = line;
          } else {
            doc.description += (doc.description ? ' ' : '') + line;
          }
        } else if (currentSection === 'parameters') {
          // Parse parameter documentation
          // Format: param_name (type): description
          const paramMatch = line.match(/(\w+)\s*\(([^)]+)\):\s*(.*)/);
          if (paramMatch) {
            doc.parameters.push({
              name: paramMatch[1],
              type: paramMatch[2],
              description: paramMatch[3],
            });
          }
        }
      }
    }

    return doc;
  }

  /**
   * Extract parameters from route path, function signature, and documentation
   */
  private extractParameters(
    routePath: string,
    documentation: any,
    lines: string[],
    startLine: number
  ): ApiParameter[] {
    const parameters: ApiParameter[] = [];

    // Extract path parameters (e.g., /users/{id})
    const pathParamMatches = routePath.matchAll(/\{(\w+)\}/g);
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

    // Try to extract query parameters from function signature
    // Look for: param_name: type = Query(...)
    let funcLine = startLine + 1;
    while (funcLine < lines.length && !lines[funcLine].includes('def ')) {
      funcLine++;
    }

    if (funcLine < lines.length) {
      const funcDef = lines[funcLine];
      const queryMatch = funcDef.matchAll(/(\w+):\s*\w+\s*=\s*Query/g);
      for (const match of queryMatch) {
        const paramName = match[1];
        if (!parameters.find(p => p.name === paramName)) {
          const docParam = documentation.parameters.find((p: any) => p.name === paramName);
          parameters.push({
            name: paramName,
            location: 'query',
            type: docParam?.type || 'string',
            required: false,
            description: docParam?.description || `Query parameter: ${paramName}`,
          });
        }
      }
    }

    return parameters;
  }

  /**
   * Extract response definitions
   */
  private extractResponses(documentation: any): ApiResponse[] {
    const responses: ApiResponse[] = [
      {
        statusCode: 200,
        description: documentation.returns || 'Successful response',
      },
    ];

    return responses;
  }
}
