/**
 * Config Template Generator
 * Main orchestrator for configuration template generation
 */

import * as fs from 'fs';
import * as path from 'path';
import { VariableDiscoverer } from './analyzers/variable-discoverer.js';
import { EnvGenerator } from './generators/env-generator.js';
import { ValidationGenerator } from './generators/validation-generator.js';
import {
  DiscoverOptions,
  GenerateTemplateOptions,
  GenerateResult,
  ConfigVariable,
} from './types.js';

export class ConfigGenerator {
  private discoverer: VariableDiscoverer;
  private envGenerator: EnvGenerator;
  private validationGenerator: ValidationGenerator;

  constructor() {
    this.discoverer = new VariableDiscoverer();
    this.envGenerator = new EnvGenerator();
    this.validationGenerator = new ValidationGenerator();
  }

  /**
   * Discover configuration variables in a project
   */
  async discoverVariables(options: DiscoverOptions) {
    return await this.discoverer.discover(options);
  }

  /**
   * Generate configuration template from variables
   */
  async generateTemplate(options: GenerateTemplateOptions): Promise<GenerateResult> {
    try {
      const {
        variables,
        outputPath,
        format = 'env',
        includeValidation = true,
        validationFramework = 'zod',
      } = options;

      if (variables.length === 0) {
        return {
          success: false,
          error: 'No configuration variables found',
        };
      }

      // Generate template content
      let templateContent: string;
      let templateFileName: string;

      switch (format) {
        case 'env':
          templateContent = this.envGenerator.generate(variables, {
            includeExamples: true,
            includeDescriptions: true,
            groupByCategory: true,
          });
          templateFileName = '.env.template';
          break;

        case 'json':
          templateContent = this.generateJsonTemplate(variables);
          templateFileName = 'config.template.json';
          break;

        case 'yaml':
          templateContent = this.generateYamlTemplate(variables);
          templateFileName = 'config.template.yaml';
          break;

        default:
          return {
            success: false,
            error: `Unsupported format: ${format}`,
          };
      }

      // Generate validation schema if requested
      let validationContent: string | undefined;
      let validationFileName: string | undefined;

      if (includeValidation) {
        switch (validationFramework) {
          case 'zod':
            validationContent = this.validationGenerator.generateZod(variables);
            validationFileName = 'env.validation.ts';
            break;
          case 'joi':
            validationContent = this.validationGenerator.generateJoi(variables);
            validationFileName = 'env.validation.ts';
            break;
          default:
            break;
        }
      }

      // Write files if output path specified
      if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        const templatePath = path.join(dir, templateFileName);
        fs.writeFileSync(templatePath, templateContent, 'utf-8');

        let validationPath: string | undefined;
        if (validationContent && validationFileName) {
          validationPath = path.join(dir, validationFileName);
          fs.writeFileSync(validationPath, validationContent, 'utf-8');
        }

        return {
          success: true,
          templatePath,
          validationPath,
          variablesCount: variables.length,
        };
      }

      // Return content without writing files
      return {
        success: true,
        variablesCount: variables.length,
        content: {
          template: templateContent,
          validation: validationContent,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Complete workflow: discover and generate
   */
  async generate(projectPath: string, outputDir?: string): Promise<GenerateResult> {
    try {
      // Discover variables
      const discovery = await this.discoverer.discover({ projectPath });

      if (discovery.variables.length === 0) {
        return {
          success: false,
          error: 'No configuration variables found in project',
        };
      }

      // Generate template
      const finalOutputDir = outputDir || projectPath;

      return await this.generateTemplate({
        variables: discovery.variables,
        outputPath: path.join(finalOutputDir, '.env.template'),
        format: 'env',
        includeValidation: true,
        validationFramework: 'zod',
      });
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate JSON template
   */
  private generateJsonTemplate(variables: ConfigVariable[]): string {
    const config: Record<string, any> = {};

    for (const variable of variables) {
      const value = variable.exampleValue || '';
      const comment = variable.description || '';

      // Group by category
      const category = variable.category;
      if (!config[category]) {
        config[category] = {};
      }

      config[category][variable.name] = {
        value,
        type: variable.type,
        required: variable.required,
        description: comment,
      };
    }

    return JSON.stringify(config, null, 2);
  }

  /**
   * Generate YAML template
   */
  private generateYamlTemplate(variables: ConfigVariable[]): string {
    const lines: string[] = [];
    lines.push('# Configuration Template');
    lines.push('# Auto-generated from project analysis');
    lines.push('');

    // Group by category
    const grouped: Record<string, ConfigVariable[]> = {};
    for (const variable of variables) {
      const category = variable.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(variable);
    }

    for (const [category, vars] of Object.entries(grouped)) {
      lines.push(`# ${category.toUpperCase()}`);
      lines.push(`${category}:`);

      for (const variable of vars) {
        if (variable.description) {
          lines.push(`  # ${variable.description}`);
        }
        lines.push(`  # Type: ${variable.type} | Required: ${variable.required}`);
        const value = variable.exampleValue || '';
        lines.push(`  ${variable.name}: "${value}"`);
        lines.push('');
      }
    }

    return lines.join('\n');
  }
}
