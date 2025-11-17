/**
 * ASP.NET Core Endpoint Extractor
 * Extracts API endpoints from ASP.NET Core Web APIs
 */

import * as fs from 'fs';
import { glob } from 'glob';
import { ApiEndpoint, HttpMethod, ApiParameter, ApiResponse } from '../types.js';

export class AspNetExtractor {
  /**
   * Extract endpoints from ASP.NET Core project
   */
  async extract(projectPath: string): Promise<ApiEndpoint[]> {
    const endpoints: ApiEndpoint[] = [];

    // Find all C# files (controllers)
    const files = await glob('**/*Controller.cs', {
      cwd: projectPath,
      absolute: true,
      ignore: ['**/bin/**', '**/obj/**'],
    });

    for (const filePath of files) {
      try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileEndpoints = this.parseAspNetFile(content, filePath);
        endpoints.push(...fileEndpoints);
      } catch (error) {
        console.warn(`Failed to parse ${filePath}:`, error);
      }
    }

    return endpoints;
  }

  /**
   * Parse ASP.NET Core controller file
   */
  private parseAspNetFile(content: string, filePath: string): ApiEndpoint[] {
    const endpoints: ApiEndpoint[] = [];
    const lines = content.split('\n');

    // Extract controller-level route
    const controllerRoute = this.extractControllerRoute(content);
    const controllerName = this.extractControllerName(filePath);

    // Patterns to match HTTP method attributes
    const methodPatterns = [
      // [HttpGet("path")] or [HttpGet]
      /\[(Http(?:Get|Post|Put|Patch|Delete|Head|Options))(?:\("([^"]*)")?\]/gi,
      // [Route("path")]
      /\[Route\("([^"]+)"\)/gi,
    ];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const pattern of methodPatterns) {
        pattern.lastIndex = 0;
        const match = pattern.exec(line);

        if (match) {
          let method: HttpMethod | null = null;
          let routePath = '';

          if (match[0].startsWith('[Http')) {
            // HTTP method attribute
            method = match[1].replace('Http', '').toUpperCase() as HttpMethod;
            routePath = match[2] || '';
          } else if (match[0].startsWith('[Route')) {
            // Route attribute - need to find HTTP method
            routePath = match[1];
            method = this.findHttpMethodForRoute(lines, lineNum);
          }

          if (method) {
            // Combine controller route with action route
            const fullPath = this.combinePaths(controllerRoute, routePath);

            // Extract action method info
            const actionInfo = this.extractActionMethod(lines, lineNum);
            const documentation = this.extractXmlDoc(lines, lineNum);

            endpoints.push({
              path: fullPath,
              method,
              handler: actionInfo.methodName || 'anonymous',
              description: documentation.description,
              summary: documentation.summary || `${method} ${fullPath}`,
              tags: [controllerName],
              parameters: this.extractParameters(fullPath, actionInfo, documentation),
              responses: this.extractResponses(documentation, actionInfo),
              authentication: documentation.authentication,
              filePath,
              lineNumber: lineNum + 1,
            });
          }
        }
      }
    }

    return endpoints;
  }

  /**
   * Extract controller-level route prefix
   */
  private extractControllerRoute(content: string): string {
    // [Route("api/[controller]")] or [Route("api/users")]
    const routeMatch = content.match(/\[Route\("([^"]+)"\)\]\s*(?:public\s+)?class/);
    if (routeMatch) {
      let route = routeMatch[1];
      // Replace [controller] with actual controller name
      route = route.replace('[controller]', '');
      return route;
    }
    return 'api';
  }

  /**
   * Extract controller name from file path
   */
  private extractControllerName(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    return fileName.replace('Controller.cs', '').replace('.cs', '');
  }

  /**
   * Find HTTP method for a route attribute
   */
  private findHttpMethodForRoute(lines: string[], routeLine: number): HttpMethod | null {
    // Look for HttpGet, HttpPost, etc. in nearby lines
    for (let i = routeLine - 3; i <= routeLine + 3 && i < lines.length; i++) {
      if (i < 0) continue;
      const methodMatch = lines[i].match(/\[Http(Get|Post|Put|Patch|Delete|Head|Options)\]/i);
      if (methodMatch) {
        return methodMatch[1].toUpperCase() as HttpMethod;
      }
    }
    return null;
  }

  /**
   * Combine controller route and action route
   */
  private combinePaths(controllerRoute: string, actionRoute: string): string {
    // Remove leading/trailing slashes
    const cleanController = controllerRoute.replace(/^\/+|\/+$/g, '');
    const cleanAction = actionRoute.replace(/^\/+|\/+$/g, '');

    if (!cleanAction) return `/${cleanController}`;
    return `/${cleanController}/${cleanAction}`;
  }

  /**
   * Extract action method information
   */
  private extractActionMethod(lines: string[], startLine: number): any {
    const info: any = {
      methodName: '',
      parameters: [],
      returnType: '',
    };

    // Find method definition (usually a few lines after attributes)
    for (let i = startLine; i < Math.min(startLine + 5, lines.length); i++) {
      const line = lines[i].trim();

      // Match: public async Task<ActionResult<User>> GetUser(int id)
      const methodMatch = line.match(/(?:public|private|protected)\s+(?:async\s+)?(?:Task<)?(\w+(?:<\w+>)?)>?\s+(\w+)\s*\(/);
      if (methodMatch) {
        info.returnType = methodMatch[1];
        info.methodName = methodMatch[2];

        // Extract parameters
        const paramsMatch = line.match(/\((.*)\)/);
        if (paramsMatch) {
          const paramsList = paramsMatch[1].split(',');
          for (const param of paramsList) {
            const paramMatch = param.trim().match(/(?:\[FromBody\]|\[FromQuery\]|\[FromRoute\])?\s*(\w+(?:<\w+>)?)\s+(\w+)/);
            if (paramMatch) {
              const location = param.includes('[FromBody]') ? 'body' :
                              param.includes('[FromQuery]') ? 'query' :
                              param.includes('[FromRoute]') ? 'path' : 'query';

              info.parameters.push({
                type: paramMatch[1],
                name: paramMatch[2],
                location,
              });
            }
          }
        }
        break;
      }
    }

    return info;
  }

  /**
   * Extract XML documentation comments
   */
  private extractXmlDoc(lines: string[], currentLine: number): any {
    const doc: any = {
      summary: '',
      description: '',
      authentication: [],
      parameters: [],
      returns: '',
    };

    // Look backwards for XML doc comments (/// <summary>)
    let i = currentLine - 1;
    const docLines: string[] = [];

    while (i >= 0) {
      const line = lines[i].trim();
      if (line.startsWith('///')) {
        docLines.unshift(line.substring(3).trim());
      } else if (!line) {
        // Empty line, continue
      } else {
        // Non-doc line, stop
        break;
      }
      i--;
    }

    // Parse XML tags
    let currentTag = '';
    let currentContent = '';

    for (const line of docLines) {
      const openTagMatch = line.match(/<(\w+)>/);
      const closeTagMatch = line.match(/<\/(\w+)>/);
      const selfClosingMatch = line.match(/<(\w+)\s+name="([^"]+)"\s*\/>/);

      if (selfClosingMatch) {
        // <param name="id" />
        if (selfClosingMatch[1] === 'param') {
          doc.parameters.push({ name: selfClosingMatch[2], description: '' });
        }
      } else if (openTagMatch) {
        currentTag = openTagMatch[1];
        currentContent = line.replace(/<[^>]+>/g, '').trim();
      } else if (closeTagMatch) {
        if (currentTag === 'summary') {
          doc.summary = currentContent;
        } else if (currentTag === 'remarks') {
          doc.description = currentContent;
        } else if (currentTag === 'returns') {
          doc.returns = currentContent;
        }
        currentTag = '';
        currentContent = '';
      } else if (currentTag) {
        currentContent += ' ' + line.trim();
      }
    }

    return doc;
  }

  /**
   * Extract parameters from action method and documentation
   */
  private extractParameters(routePath: string, actionInfo: any, documentation: any): ApiParameter[] {
    const parameters: ApiParameter[] = [];

    // Extract path parameters from route (e.g., {id})
    const pathParamMatches = routePath.matchAll(/\{(\w+)\}/g);
    for (const match of pathParamMatches) {
      const paramName = match[1];
      const actionParam = actionInfo.parameters.find((p: any) => p.name === paramName);
      const docParam = documentation.parameters.find((p: any) => p.name === paramName);

      parameters.push({
        name: paramName,
        location: 'path',
        type: actionParam?.type || 'string',
        required: true,
        description: docParam?.description || `Path parameter: ${paramName}`,
      });
    }

    // Add other parameters from action method
    for (const actionParam of actionInfo.parameters) {
      if (!parameters.find(p => p.name === actionParam.name)) {
        const docParam = documentation.parameters.find((p: any) => p.name === actionParam.name);
        parameters.push({
          name: actionParam.name,
          location: actionParam.location,
          type: actionParam.type,
          required: actionParam.location === 'body',
          description: docParam?.description || `${actionParam.location} parameter`,
        });
      }
    }

    return parameters;
  }

  /**
   * Extract response definitions
   */
  private extractResponses(documentation: any, actionInfo: any): ApiResponse[] {
    const responses: ApiResponse[] = [
      {
        statusCode: 200,
        description: documentation.returns || 'Successful response',
        schema: actionInfo.returnType !== 'void' ? { type: actionInfo.returnType } : undefined,
      },
    ];

    return responses;
  }
}
