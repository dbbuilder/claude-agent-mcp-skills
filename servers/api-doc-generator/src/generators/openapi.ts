/**
 * OpenAPI 3.0 Generator
 * Generates OpenAPI/Swagger specifications from API documentation
 */

import { ApiDocumentation, ApiEndpoint, ApiParameter, GenerateResult } from '../types.js';
import * as fs from 'fs';
import * as path from 'path';
import YAML from 'yaml';

export class OpenAPIGenerator {
  /**
   * Generate OpenAPI 3.0 specification
   */
  generate(documentation: ApiDocumentation, outputPath?: string): GenerateResult {
    try {
      const spec = this.buildOpenAPISpec(documentation);

      // Determine output path
      const finalPath = outputPath || 'openapi.yaml';
      const format = finalPath.endsWith('.json') ? 'json' : 'yaml';

      // Convert to string
      const content = format === 'json'
        ? JSON.stringify(spec, null, 2)
        : YAML.stringify(spec);

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
        outputPath: finalPath,
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
   * Build OpenAPI 3.0 specification object
   */
  private buildOpenAPISpec(documentation: ApiDocumentation): any {
    const spec: any = {
      openapi: '3.0.3',
      info: {
        title: documentation.title || 'API Documentation',
        version: documentation.version || '1.0.0',
        description: documentation.description || 'Automatically generated API documentation',
      },
      servers: documentation.baseUrl
        ? [{ url: documentation.baseUrl }]
        : [
            { url: 'http://localhost:3000', description: 'Development server' },
            { url: 'https://api.example.com', description: 'Production server' },
          ],
      paths: {},
      components: {
        schemas: documentation.schemas || {},
        securitySchemes: documentation.securitySchemes || this.getDefaultSecuritySchemes(),
      },
    };

    // Group endpoints by path
    const pathGroups = this.groupByPath(documentation.endpoints);

    // Build paths
    for (const [apiPath, endpoints] of Object.entries(pathGroups)) {
      spec.paths[apiPath] = {};

      for (const endpoint of endpoints) {
        const method = endpoint.method.toLowerCase();
        spec.paths[apiPath][method] = this.buildOperation(endpoint);
      }
    }

    return spec;
  }

  /**
   * Group endpoints by path
   */
  private groupByPath(endpoints: ApiEndpoint[]): Map<string, ApiEndpoint[]> {
    const groups = new Map<string, ApiEndpoint[]>();

    for (const endpoint of endpoints) {
      const existing = groups.get(endpoint.path) || [];
      existing.push(endpoint);
      groups.set(endpoint.path, existing);
    }

    return groups;
  }

  /**
   * Build OpenAPI operation object
   */
  private buildOperation(endpoint: ApiEndpoint): any {
    const operation: any = {
      summary: endpoint.summary || `${endpoint.method} ${endpoint.path}`,
      description: endpoint.description || endpoint.summary,
      tags: endpoint.tags && endpoint.tags.length > 0 ? endpoint.tags : ['default'],
      operationId: `${endpoint.method.toLowerCase()}_${endpoint.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      parameters: [],
      responses: {},
    };

    // Add parameters
    for (const param of endpoint.parameters) {
      if (param.location !== 'body') {
        operation.parameters.push(this.buildParameter(param));
      } else {
        // Body parameters become requestBody
        operation.requestBody = {
          required: param.required,
          description: param.description,
          content: {
            'application/json': {
              schema: param.schema || { type: param.type },
              example: param.example,
            },
          },
        };
      }
    }

    // Add responses
    for (const response of endpoint.responses) {
      operation.responses[response.statusCode] = {
        description: response.description,
        content: response.schema
          ? {
              'application/json': {
                schema: response.schema,
                example: response.example,
              },
            }
          : undefined,
      };
    }

    // Add default error responses if not present
    if (!operation.responses['400']) {
      operation.responses['400'] = { description: 'Bad Request' };
    }
    if (!operation.responses['500']) {
      operation.responses['500'] = { description: 'Internal Server Error' };
    }

    // Add authentication
    if (endpoint.authentication && endpoint.authentication.length > 0) {
      operation.security = endpoint.authentication.map(auth => ({ [auth]: [] }));
    }

    return operation;
  }

  /**
   * Build OpenAPI parameter object
   */
  private buildParameter(param: ApiParameter): any {
    return {
      name: param.name,
      in: param.location,
      required: param.required,
      description: param.description,
      schema: param.schema || {
        type: this.mapTypeToOpenAPI(param.type),
      },
      example: param.example,
    };
  }

  /**
   * Map language-specific types to OpenAPI types
   */
  private mapTypeToOpenAPI(type: string): string {
    const typeMap: Record<string, string> = {
      string: 'string',
      str: 'string',
      int: 'integer',
      integer: 'integer',
      long: 'integer',
      float: 'number',
      double: 'number',
      decimal: 'number',
      bool: 'boolean',
      boolean: 'boolean',
      date: 'string',
      datetime: 'string',
      array: 'array',
      object: 'object',
    };

    return typeMap[type.toLowerCase()] || 'string';
  }

  /**
   * Get default security schemes
   */
  private getDefaultSecuritySchemes(): any {
    return {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
      apiKey: {
        type: 'apiKey',
        in: 'header',
        name: 'X-API-Key',
      },
    };
  }
}
