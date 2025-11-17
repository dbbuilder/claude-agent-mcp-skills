/**
 * API Documenter - Main Orchestrator
 * Coordinates endpoint extraction and documentation generation
 */

import * as fs from 'fs';
import * as path from 'path';
import { ExpressExtractor } from './extractors/express.js';
import { FastAPIExtractor } from './extractors/fastapi.js';
import { AspNetExtractor } from './extractors/aspnet.js';
import { OpenAPIGenerator } from './generators/openapi.js';
import { MarkdownGenerator } from './generators/markdown.js';
import {
  Framework,
  ExtractOptions,
  GenerateOptions,
  GenerateResult,
  ApiDocumentation,
  ApiEndpoint,
} from './types.js';

export class APIDocumenter {
  private expressExtractor = new ExpressExtractor();
  private fastapiExtractor = new FastAPIExtractor();
  private aspnetExtractor = new AspNetExtractor();
  private openapiGenerator = new OpenAPIGenerator();
  private markdownGenerator = new MarkdownGenerator();

  /**
   * Extract API endpoints from project
   */
  async extractEndpoints(options: ExtractOptions): Promise<ApiEndpoint[]> {
    const framework = options.framework || this.detectFramework(options.projectPath);

    console.log(`📡 Extracting endpoints from ${framework} project: ${options.projectPath}`);

    let endpoints: ApiEndpoint[] = [];

    switch (framework) {
      case 'express':
        endpoints = await this.expressExtractor.extract(options.projectPath);
        break;
      case 'fastapi':
        endpoints = await this.fastapiExtractor.extract(options.projectPath);
        break;
      case 'aspnet':
        endpoints = await this.aspnetExtractor.extract(options.projectPath);
        break;
      default:
        // Try all extractors
        const [expressEp, fastapiEp, aspnetEp] = await Promise.all([
          this.expressExtractor.extract(options.projectPath),
          this.fastapiExtractor.extract(options.projectPath),
          this.aspnetExtractor.extract(options.projectPath),
        ]);
        endpoints = [...expressEp, ...fastapiEp, ...aspnetEp];
    }

    console.log(`✅ Found ${endpoints.length} endpoints`);
    return endpoints;
  }

  /**
   * Generate documentation from endpoints
   */
  async generateDocumentation(options: GenerateOptions): Promise<GenerateResult> {
    const format = options.format || 'both';

    try {
      if (format === 'openapi') {
        return this.openapiGenerator.generate(options.documentation, options.outputPath);
      } else if (format === 'markdown') {
        return this.markdownGenerator.generate(options.documentation, options.outputPath);
      } else {
        // Generate both
        const openapiPath = options.outputPath
          ? options.outputPath.replace(/\.[^.]+$/, '.yaml')
          : 'openapi.yaml';
        const markdownPath = options.outputPath
          ? options.outputPath.replace(/\.[^.]+$/, '.md')
          : 'API.md';

        const openapiResult = this.openapiGenerator.generate(options.documentation, openapiPath);
        const markdownResult = this.markdownGenerator.generate(
          options.documentation,
          markdownPath
        );

        if (!openapiResult.success) return openapiResult;
        if (!markdownResult.success) return markdownResult;

        return {
          success: true,
          outputPath: `${openapiPath}, ${markdownPath}`,
          content: `OpenAPI: ${openapiPath}\nMarkdown: ${markdownPath}`,
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Full workflow: extract and generate
   */
  async documentAPI(
    projectPath: string,
    outputDir?: string,
    framework?: Framework
  ): Promise<GenerateResult> {
    try {
      // Extract endpoints
      const endpoints = await this.extractEndpoints({
        projectPath,
        framework,
      });

      if (endpoints.length === 0) {
        return {
          success: false,
          error: 'No API endpoints found in project',
        };
      }

      // Build documentation object
      const documentation: ApiDocumentation = {
        title: this.getProjectName(projectPath),
        version: this.getProjectVersion(projectPath),
        description: `API documentation for ${this.getProjectName(projectPath)}`,
        endpoints,
      };

      // Generate documentation
      const outputPath = outputDir
        ? path.join(outputDir, 'API')
        : path.join(projectPath, 'API');

      return await this.generateDocumentation({
        documentation,
        outputPath,
        format: 'both',
        includeExamples: true,
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Detect framework from project files
   */
  private detectFramework(projectPath: string): Framework {
    // Check for package.json (Express)
    if (fs.existsSync(path.join(projectPath, 'package.json'))) {
      const packageJson = JSON.parse(
        fs.readFileSync(path.join(projectPath, 'package.json'), 'utf-8')
      );
      if (packageJson.dependencies?.express || packageJson.devDependencies?.express) {
        return 'express';
      }
    }

    // Check for requirements.txt or pyproject.toml (FastAPI)
    const requirementsPath = path.join(projectPath, 'requirements.txt');
    if (fs.existsSync(requirementsPath)) {
      const requirements = fs.readFileSync(requirementsPath, 'utf-8');
      if (requirements.includes('fastapi')) {
        return 'fastapi';
      }
    }

    const pyprojectPath = path.join(projectPath, 'pyproject.toml');
    if (fs.existsSync(pyprojectPath)) {
      const pyproject = fs.readFileSync(pyprojectPath, 'utf-8');
      if (pyproject.includes('fastapi')) {
        return 'fastapi';
      }
    }

    // Check for .csproj files (ASP.NET)
    const files = fs.readdirSync(projectPath);
    if (files.some(f => f.endsWith('.csproj'))) {
      return 'aspnet';
    }

    return 'unknown';
  }

  /**
   * Get project name from directory or package file
   */
  private getProjectName(projectPath: string): string {
    // Try package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.name) return packageJson.name;
      } catch {}
    }

    // Try pyproject.toml
    const pyprojectPath = path.join(projectPath, 'pyproject.toml');
    if (fs.existsSync(pyprojectPath)) {
      try {
        const content = fs.readFileSync(pyprojectPath, 'utf-8');
        const nameMatch = content.match(/name\s*=\s*"([^"]+)"/);
        if (nameMatch) return nameMatch[1];
      } catch {}
    }

    // Use directory name
    return path.basename(projectPath);
  }

  /**
   * Get project version
   */
  private getProjectVersion(projectPath: string): string {
    // Try package.json
    const packageJsonPath = path.join(projectPath, 'package.json');
    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
        if (packageJson.version) return packageJson.version;
      } catch {}
    }

    return '1.0.0';
  }
}
