/**
 * .env Template Generator
 * Generates .env.template files with documentation
 */

import { ConfigVariable } from '../types.js';

export class EnvGenerator {
  /**
   * Generate .env template file
   */
  generate(
    variables: ConfigVariable[],
    options: {
      includeExamples: boolean;
      includeDescriptions: boolean;
      groupByCategory: boolean;
    }
  ): string {
    const lines: string[] = [];

    // Header
    lines.push('# Environment Configuration Template');
    lines.push('# Copy this file to .env and fill in the values');
    lines.push('# Do not commit .env to version control!');
    lines.push('');

    if (options.groupByCategory) {
      // Group variables by category
      const grouped = this.groupByCategory(variables);

      for (const [category, vars] of Object.entries(grouped)) {
        lines.push('# ' + '='.repeat(70));
        lines.push(`# ${this.categoryTitle(category)}`);
        lines.push('# ' + '='.repeat(70));
        lines.push('');

        for (const variable of vars) {
          lines.push(...this.generateVariableBlock(variable, options));
          lines.push('');
        }
      }
    } else {
      // No grouping
      for (const variable of variables) {
        lines.push(...this.generateVariableBlock(variable, options));
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate block for a single variable
   */
  private generateVariableBlock(
    variable: ConfigVariable,
    options: { includeExamples: boolean; includeDescriptions: boolean }
  ): string[] {
    const lines: string[] = [];

    // Description
    if (options.includeDescriptions && variable.description) {
      lines.push(`# ${variable.description}`);
    }

    // Type and requirement info
    const info: string[] = [];
    info.push(`Type: ${variable.type}`);
    if (variable.required) info.push('Required');
    else info.push('Optional');
    if (variable.sensitive) info.push('Sensitive - Do not share!');

    lines.push(`# ${info.join(' | ')}`);

    // Example value
    if (options.includeExamples && variable.exampleValue) {
      lines.push(`# Example: ${variable.exampleValue}`);
    }

    // Default value
    if (variable.defaultValue) {
      lines.push(`# Default: ${variable.defaultValue}`);
    }

    // Format/pattern hint
    if (variable.format) {
      lines.push(`# Format: ${variable.format}`);
    }

    // The actual variable line
    if (variable.required) {
      // Required variables are left empty for user to fill
      lines.push(`${variable.name}=`);
    } else {
      // Optional variables use default or example
      const value = variable.defaultValue || (options.includeExamples ? variable.exampleValue : '');
      lines.push(`# ${variable.name}=${value || ''}`);
    }

    return lines;
  }

  /**
   * Group variables by category
   */
  private groupByCategory(variables: ConfigVariable[]): Record<string, ConfigVariable[]> {
    const grouped: Record<string, ConfigVariable[]> = {};

    for (const variable of variables) {
      const category = variable.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(variable);
    }

    // Sort each category by required first, then alphabetically
    for (const category in grouped) {
      grouped[category].sort((a, b) => {
        if (a.required !== b.required) return a.required ? -1 : 1;
        return a.name.localeCompare(b.name);
      });
    }

    return grouped;
  }

  /**
   * Get category display title
   */
  private categoryTitle(category: string): string {
    const titles: Record<string, string> = {
      database: 'Database Configuration',
      api: 'API Configuration',
      authentication: 'Authentication & Security',
      email: 'Email Configuration',
      storage: 'Storage Configuration',
      cache: 'Cache Configuration',
      feature_flags: 'Feature Flags',
      logging: 'Logging Configuration',
      monitoring: 'Monitoring & Analytics',
      general: 'General Configuration',
    };

    return titles[category] || category.toUpperCase();
  }
}
