/**
 * Config Variable Discoverer
 * Scans codebases for environment variables and configuration usage
 */

import * as fs from 'fs';
import { glob } from 'glob';
import {
  ConfigVariable,
  ConfigVariableUsage,
  DiscoveryResult,
  DiscoverOptions,
  ConfigVarType,
  ConfigVarCategory,
} from '../types.js';

export class VariableDiscoverer {
  /**
   * Discover all configuration variables in a project
   */
  async discover(options: DiscoverOptions): Promise<DiscoveryResult> {
    const { projectPath, includeNodeModules = false } = options;

    // Find all relevant files
    const files = await this.findFiles(projectPath, includeNodeModules);

    const variablesMap = new Map<string, ConfigVariable>();
    const frameworks = new Set<string>();
    const configFiles = new Set<string>();

    for (const filePath of files) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      // Detect frameworks
      this.detectFrameworks(content, filePath, frameworks);

      // Detect config files
      if (this.isConfigFile(filePath)) {
        configFiles.add(filePath);
      }

      // Find environment variable usages
      const usages = this.findEnvUsages(content, lines, filePath);

      for (const usage of usages) {
        const varName = usage.variableName;

        if (!variablesMap.has(varName)) {
          // Create new variable entry
          const variable: ConfigVariable = {
            name: varName,
            type: this.inferType(varName, usage.context),
            category: this.inferCategory(varName, usage.context),
            required: this.inferRequired(varName, usage.context),
            sensitive: this.isSensitive(varName),
            usages: [],
            exampleValue: this.generateExampleValue(varName),
          };

          // Infer description from context
          const description = this.inferDescription(varName, usage.context, filePath);
          if (description) {
            variable.description = description;
          }

          variablesMap.set(varName, variable);
        }

        // Add usage to variable
        variablesMap.get(varName)!.usages.push({
          filePath,
          lineNumber: usage.lineNumber,
          context: usage.context,
          accessPattern: usage.pattern,
        });
      }
    }

    const variables = Array.from(variablesMap.values());
    const totalUsages = variables.reduce((sum, v) => sum + v.usages.length, 0);

    return {
      variables,
      frameworks: Array.from(frameworks),
      configFiles: Array.from(configFiles),
      totalUsages,
    };
  }

  /**
   * Find all relevant source files
   */
  private async findFiles(projectPath: string, includeNodeModules: boolean): Promise<string[]> {
    const patterns = [
      '**/*.ts',
      '**/*.js',
      '**/*.tsx',
      '**/*.jsx',
      '**/*.py',
      '**/*.cs',
      '**/*.go',
      '**/*.java',
      '**/.env*',
      '**/config.json',
      '**/config.yaml',
      '**/config.yml',
    ];

    const ignore = includeNodeModules
      ? ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**']
      : ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.git/**', '**/venv/**', '**/env/**'];

    const files: string[] = [];

    for (const pattern of patterns) {
      const matches = await glob(pattern, {
        cwd: projectPath,
        absolute: true,
        ignore,
      });
      files.push(...matches);
    }

    return files;
  }

  /**
   * Find environment variable usages in file content
   */
  private findEnvUsages(
    content: string,
    lines: string[],
    filePath: string
  ): Array<{ variableName: string; lineNumber: number; context: string; pattern: string }> {
    const usages: Array<{ variableName: string; lineNumber: number; context: string; pattern: string }> = [];

    // Patterns for different languages and access methods
    const patterns = [
      // Node.js: process.env.VAR_NAME
      /process\.env\.([A-Z_][A-Z0-9_]*)/g,
      // Node.js: process.env['VAR_NAME']
      /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
      // Python: os.environ['VAR_NAME']
      /os\.environ\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g,
      // Python: os.getenv('VAR_NAME')
      /os\.getenv\(['"]([A-Z_][A-Z0-9_]*)['"]\)/g,
      // .NET: Environment.GetEnvironmentVariable("VAR_NAME")
      /Environment\.GetEnvironmentVariable\(["']([A-Z_][A-Z0-9_]*)["']\)/g,
      // .NET: Configuration["VAR_NAME"]
      /Configuration\[["']([A-Z_][A-Z0-9_:]*)["']\]/g,
      // Go: os.Getenv("VAR_NAME")
      /os\.Getenv\(["']([A-Z_][A-Z0-9_]*)["']\)/g,
      // Java: System.getenv("VAR_NAME")
      /System\.getenv\(["']([A-Z_][A-Z0-9_]*)["']\)/g,
      // Generic: ${VAR_NAME} in strings
      /\$\{([A-Z_][A-Z0-9_]*)\}/g,
    ];

    for (let lineNum = 0; lineNum < lines.length; lineNum++) {
      const line = lines[lineNum];

      for (const pattern of patterns) {
        pattern.lastIndex = 0;
        let match;

        while ((match = pattern.exec(line)) !== null) {
          const varName = match[1];

          // Get context (3 lines before and after)
          const startLine = Math.max(0, lineNum - 3);
          const endLine = Math.min(lines.length - 1, lineNum + 3);
          const context = lines.slice(startLine, endLine + 1).join('\n');

          usages.push({
            variableName: varName,
            lineNumber: lineNum + 1,
            context,
            pattern: match[0],
          });
        }
      }
    }

    return usages;
  }

  /**
   * Detect frameworks from file content
   */
  private detectFrameworks(content: string, filePath: string, frameworks: Set<string>): void {
    if (content.includes('express') || content.includes('fastify')) frameworks.add('Node.js/Express');
    if (content.includes('fastapi') || content.includes('from fastapi')) frameworks.add('Python/FastAPI');
    if (content.includes('django')) frameworks.add('Python/Django');
    if (content.includes('ASP.NET') || filePath.endsWith('.cs')) frameworks.add('.NET/ASP.NET Core');
    if (content.includes('react') || content.includes('React')) frameworks.add('React');
    if (content.includes('vue') || content.includes('Vue')) frameworks.add('Vue');
    if (content.includes('next') || filePath.includes('next.config')) frameworks.add('Next.js');
  }

  /**
   * Check if file is a configuration file
   */
  private isConfigFile(filePath: string): boolean {
    const configFilePatterns = [
      '.env',
      '.env.example',
      '.env.template',
      'config.js',
      'config.ts',
      'config.json',
      'appsettings.json',
      'settings.py',
    ];

    return configFilePatterns.some((pattern) => filePath.includes(pattern));
  }

  /**
   * Infer variable type from name and context
   */
  private inferType(varName: string, context: string): ConfigVarType {
    const lowerName = varName.toLowerCase();

    if (lowerName.includes('url') && lowerName.includes('database')) return 'database_url';
    if (lowerName.includes('url')) return 'url';
    if (lowerName.includes('email')) return 'email';
    if (lowerName.includes('port')) return 'port';
    if (lowerName.includes('api_key') || lowerName.includes('apikey')) return 'api_key';
    if (lowerName.includes('secret') || lowerName.includes('jwt')) return 'secret';
    if (lowerName.includes('path') || lowerName.includes('dir')) return 'path';
    if (lowerName.includes('json')) return 'json';
    if (lowerName.includes('enable') || lowerName.includes('debug') || lowerName.includes('flag'))
      return 'boolean';
    if (lowerName.includes('timeout') || lowerName.includes('limit') || lowerName.includes('max'))
      return 'number';

    return 'string';
  }

  /**
   * Infer variable category
   */
  private inferCategory(varName: string, context: string): ConfigVarCategory {
    const lowerName = varName.toLowerCase();

    if (lowerName.includes('db') || lowerName.includes('database') || lowerName.includes('postgres') || lowerName.includes('mongo'))
      return 'database';
    if (lowerName.includes('api') || lowerName.includes('endpoint')) return 'api';
    if (lowerName.includes('auth') || lowerName.includes('jwt') || lowerName.includes('token'))
      return 'authentication';
    if (lowerName.includes('email') || lowerName.includes('smtp') || lowerName.includes('mail'))
      return 'email';
    if (lowerName.includes('s3') || lowerName.includes('storage') || lowerName.includes('bucket'))
      return 'storage';
    if (lowerName.includes('redis') || lowerName.includes('cache')) return 'cache';
    if (lowerName.includes('feature') || lowerName.includes('flag')) return 'feature_flags';
    if (lowerName.includes('log') || lowerName.includes('debug')) return 'logging';
    if (lowerName.includes('sentry') || lowerName.includes('monitoring')) return 'monitoring';

    return 'general';
  }

  /**
   * Infer if variable is required
   */
  private inferRequired(varName: string, context: string): boolean {
    // Find the specific line containing this variable to check for fallbacks
    const lines = context.split('\n');
    const varLine = lines.find(line => line.includes(varName)) || '';

    // Check if the specific line with this variable has a fallback/default value
    if (varLine.includes('||') || varLine.includes('??') || varLine.includes('default')) {
      return false;
    }

    // Database URLs, API keys, secrets are usually required
    const lowerName = varName.toLowerCase();
    if (lowerName.includes('database_url') || lowerName.includes('secret') || lowerName.includes('api_key')) {
      return true;
    }

    // Debug, optional, feature flags are usually optional
    if (lowerName.includes('debug') || lowerName.includes('optional') || lowerName.includes('feature')) {
      return false;
    }

    return true;
  }

  /**
   * Check if variable contains sensitive data
   */
  private isSensitive(varName: string): boolean {
    const lowerName = varName.toLowerCase();
    const sensitiveKeywords = [
      'secret',
      'password',
      'pwd',
      'key',
      'token',
      'api_key',
      'apikey',
      'private',
      'credential',
    ];

    return sensitiveKeywords.some((keyword) => lowerName.includes(keyword));
  }

  /**
   * Generate example value for variable
   */
  private generateExampleValue(varName: string): string {
    const lowerName = varName.toLowerCase();

    if (lowerName.includes('database_url')) return 'postgresql://user:password@localhost:5432/dbname';
    if (lowerName.includes('mongo') && lowerName.includes('url')) return 'mongodb://localhost:27017/mydb';
    if (lowerName.includes('redis') && lowerName.includes('url')) return 'redis://localhost:6379';
    if (lowerName.includes('port')) return '3000';
    if (lowerName.includes('api_key')) return 'your-api-key-here';
    if (lowerName.includes('secret')) return 'your-secret-key-here';
    if (lowerName.includes('jwt') && lowerName.includes('secret')) return 'your-jwt-secret-key';
    if (lowerName.includes('email')) return 'user@example.com';
    if (lowerName.includes('smtp') && lowerName.includes('host')) return 'smtp.gmail.com';
    if (lowerName.includes('smtp') && lowerName.includes('port')) return '587';
    if (lowerName.includes('url')) return 'https://example.com';
    if (lowerName.includes('debug') || lowerName.includes('enable')) return 'false';
    if (lowerName.includes('timeout') || lowerName.includes('limit')) return '30';
    if (lowerName.includes('log') && lowerName.includes('level')) return 'info';

    return 'value';
  }

  /**
   * Infer description from variable name and context
   */
  private inferDescription(varName: string, context: string, filePath: string): string | undefined {
    const lowerName = varName.toLowerCase();

    // Extract comments from context
    const commentMatch = context.match(/\/\/\s*(.+)|\/\*\s*(.+)\s*\*\/|#\s*(.+)/);
    if (commentMatch) {
      const comment = commentMatch[1] || commentMatch[2] || commentMatch[3];
      if (comment && comment.trim().length > 5) {
        return comment.trim();
      }
    }

    // Generate description from variable name
    if (lowerName.includes('database_url')) return 'Database connection URL';
    if (lowerName.includes('api_key')) return 'API authentication key';
    if (lowerName.includes('jwt') && lowerName.includes('secret')) return 'Secret key for JWT token signing';
    if (lowerName.includes('port')) return 'Server port number';
    if (lowerName.includes('host')) return 'Server host address';
    if (lowerName.includes('email')) return 'Email address';
    if (lowerName.includes('smtp')) return 'SMTP server configuration';
    if (lowerName.includes('redis')) return 'Redis cache configuration';
    if (lowerName.includes('debug')) return 'Enable debug mode';
    if (lowerName.includes('log') && lowerName.includes('level')) return 'Logging level (debug, info, warn, error)';

    return undefined;
  }
}
