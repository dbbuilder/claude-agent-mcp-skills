/**
 * Migration Analyzer
 * Analyzes code for migration issues between framework versions
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import * as semver from 'semver';
import {
  AnalyzeMigrationOptions,
  AnalyzeMigrationResult,
  MigrationIssue,
  MigrationPath,
  DetectedFramework,
  BreakingChange,
  Deprecation,
} from '../types.js';

export class MigrationAnalyzer {
  /**
   * Analyze project for migration issues
   */
  async analyze(options: AnalyzeMigrationOptions): Promise<AnalyzeMigrationResult> {
    const {
      projectPath,
      fromVersion,
      toVersion,
      framework,
      fileTypes = ['ts', 'js', 'tsx', 'jsx'],
      maxFiles = 500,
    } = options;

    try {
      // Detect current framework and version
      const detected = await this.detectFramework(projectPath);
      const actualFramework = framework || detected?.name;
      const actualFromVersion = fromVersion || detected?.version;

      if (!actualFramework) {
        return {
          success: false,
          issues: [],
          summary: this.emptySummary(),
          recommendations: [],
          error: 'Could not detect framework. Please specify framework explicitly.',
        };
      }

      // Get migration path
      const migrationPath = this.getMigrationPath(actualFramework, actualFromVersion, toVersion);

      // Find source files
      const patterns = fileTypes.map(ext => `**/*.${ext}`);
      const ignore = ['**/node_modules/**', '**/dist/**', '**/build/**', '**/.next/**'];

      let files: string[] = [];
      for (const pattern of patterns) {
        const matches = await glob(pattern, {
          cwd: projectPath,
          absolute: true,
          ignore,
        });
        files.push(...matches);
      }

      files = files.slice(0, maxFiles);

      const issues: MigrationIssue[] = [];
      let filesAnalyzed = 0;

      for (const filePath of files) {
        const content = fs.readFileSync(filePath, 'utf-8');
        const fileIssues = this.analyzeFile(content, filePath, actualFramework, migrationPath);
        issues.push(...fileIssues);
        filesAnalyzed++;
      }

      const summary = this.generateSummary(issues, files.length, filesAnalyzed);
      const recommendations = this.generateRecommendations(issues, migrationPath);

      return {
        success: true,
        issues,
        summary,
        migrationPath,
        recommendations,
      };
    } catch (error) {
      return {
        success: false,
        issues: [],
        summary: this.emptySummary(),
        recommendations: [],
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Detect framework from project files
   */
  private async detectFramework(projectPath: string): Promise<DetectedFramework | null> {
    const packageJsonPath = path.join(projectPath, 'package.json');

    if (!fs.existsSync(packageJsonPath)) {
      return null;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
    const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    // React
    if (deps['react']) {
      const version = deps['react'].replace(/[\^~]/, '');
      return {
        name: 'react',
        version,
        configFiles: ['package.json'],
      };
    }

    // Next.js
    if (deps['next']) {
      const version = deps['next'].replace(/[\^~]/, '');
      return {
        name: 'nextjs',
        version,
        configFiles: ['package.json', 'next.config.js', 'next.config.mjs'],
      };
    }

    // Vue
    if (deps['vue']) {
      const version = deps['vue'].replace(/[\^~]/, '');
      return {
        name: 'vue',
        version,
        configFiles: ['package.json', 'vue.config.js'],
      };
    }

    // Angular
    if (deps['@angular/core']) {
      const version = deps['@angular/core'].replace(/[\^~]/, '');
      return {
        name: 'angular',
        version,
        configFiles: ['package.json', 'angular.json'],
      };
    }

    // Express
    if (deps['express']) {
      const version = deps['express'].replace(/[\^~]/, '');
      return {
        name: 'express',
        version,
        configFiles: ['package.json'],
      };
    }

    // Node.js/TypeScript project
    if (deps['typescript']) {
      const version = deps['typescript'].replace(/[\^~]/, '');
      return {
        name: 'typescript',
        version,
        configFiles: ['package.json', 'tsconfig.json'],
      };
    }

    return null;
  }

  /**
   * Get migration path between versions
   */
  private getMigrationPath(
    framework: string,
    fromVersion?: string,
    toVersion?: string
  ): MigrationPath {
    const migrations = this.getMigrationDatabase();
    const frameworkMigrations = migrations[framework] || [];

    // Find applicable migrations
    const breakingChanges: BreakingChange[] = [];
    const deprecations: Deprecation[] = [];
    const newFeatures: string[] = [];

    for (const migration of frameworkMigrations) {
      if (fromVersion && toVersion) {
        if (
          semver.valid(fromVersion) &&
          semver.valid(toVersion) &&
          semver.valid(migration.version)
        ) {
          if (
            semver.gt(migration.version, fromVersion) &&
            semver.lte(migration.version, toVersion)
          ) {
            breakingChanges.push(...migration.breakingChanges);
            deprecations.push(...migration.deprecations);
            newFeatures.push(...migration.newFeatures);
          }
        }
      } else {
        // Include all known issues
        breakingChanges.push(...migration.breakingChanges);
        deprecations.push(...migration.deprecations);
      }
    }

    return {
      from: fromVersion || 'unknown',
      to: toVersion || 'latest',
      framework,
      breakingChanges,
      deprecations,
      newFeatures,
    };
  }

  /**
   * Analyze single file for migration issues
   */
  private analyzeFile(
    content: string,
    filePath: string,
    framework: string,
    migrationPath: MigrationPath
  ): MigrationIssue[] {
    const issues: MigrationIssue[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNumber = i + 1;

      // Check breaking changes
      for (const change of migrationPath.breakingChanges) {
        if (change.pattern && change.pattern.test(line)) {
          issues.push({
            type: 'breaking-change',
            severity: 'breaking',
            filePath,
            lineNumber,
            code: line.trim(),
            description: change.description,
            suggestion: change.migration,
            autoFixable: !!change.replacement,
            fixedCode: change.replacement
              ? line.replace(change.pattern, change.replacement)
              : undefined,
          });
        }
      }

      // Check deprecations
      for (const dep of migrationPath.deprecations) {
        if (dep.pattern && dep.pattern.test(line)) {
          issues.push({
            type: 'deprecated-api',
            severity: 'warning',
            filePath,
            lineNumber,
            code: line.trim(),
            description: dep.description,
            suggestion: `Use ${dep.alternative} instead`,
            autoFixable: false,
          });
        }
      }

      // Framework-specific checks
      const frameworkIssues = this.checkFrameworkSpecific(
        line,
        lineNumber,
        filePath,
        framework
      );
      issues.push(...frameworkIssues);
    }

    return issues;
  }

  /**
   * Framework-specific migration checks
   */
  private checkFrameworkSpecific(
    line: string,
    lineNumber: number,
    filePath: string,
    framework: string
  ): MigrationIssue[] {
    const issues: MigrationIssue[] = [];

    switch (framework) {
      case 'react':
        issues.push(...this.checkReactMigration(line, lineNumber, filePath));
        break;
      case 'nextjs':
        issues.push(...this.checkNextJsMigration(line, lineNumber, filePath));
        break;
      case 'vue':
        issues.push(...this.checkVueMigration(line, lineNumber, filePath));
        break;
      case 'angular':
        issues.push(...this.checkAngularMigration(line, lineNumber, filePath));
        break;
      case 'typescript':
        issues.push(...this.checkTypeScriptMigration(line, lineNumber, filePath));
        break;
    }

    return issues;
  }

  /**
   * React-specific migration checks
   */
  private checkReactMigration(
    line: string,
    lineNumber: number,
    filePath: string
  ): MigrationIssue[] {
    const issues: MigrationIssue[] = [];

    // React 18 breaking changes
    if (line.includes('ReactDOM.render(')) {
      issues.push({
        type: 'breaking-change',
        severity: 'breaking',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'ReactDOM.render is deprecated in React 18',
        suggestion: 'Use createRoot from react-dom/client instead',
        autoFixable: false,
      });
    }

    // Deprecated lifecycle methods
    if (line.match(/componentWillMount|componentWillReceiveProps|componentWillUpdate/)) {
      issues.push({
        type: 'deprecated-api',
        severity: 'warning',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Legacy lifecycle method is deprecated',
        suggestion: 'Use UNSAFE_ prefix or migrate to getDerivedStateFromProps/componentDidUpdate',
        autoFixable: false,
      });
    }

    // String refs
    if (line.match(/ref=["'][^"']+["']/)) {
      issues.push({
        type: 'deprecated-api',
        severity: 'warning',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'String refs are deprecated',
        suggestion: 'Use callback refs or useRef hook',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Next.js-specific migration checks
   */
  private checkNextJsMigration(
    line: string,
    lineNumber: number,
    filePath: string
  ): MigrationIssue[] {
    const issues: MigrationIssue[] = [];

    // Next.js 13+ App Router changes
    if (line.includes('getServerSideProps') || line.includes('getStaticProps')) {
      if (filePath.includes('/app/')) {
        issues.push({
          type: 'breaking-change',
          severity: 'breaking',
          filePath,
          lineNumber,
          code: line.trim(),
          description: 'Data fetching methods not supported in App Router',
          suggestion: 'Use async Server Components or route handlers instead',
          autoFixable: false,
        });
      }
    }

    // Image component changes
    if (line.includes('next/image') && line.includes('layout=')) {
      issues.push({
        type: 'breaking-change',
        severity: 'breaking',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'layout prop removed from next/image in Next.js 13',
        suggestion: 'Use fill prop for layout="fill", or style/className for others',
        autoFixable: false,
      });
    }

    // Link component changes
    if (line.match(/<Link[^>]*>\s*<a/)) {
      issues.push({
        type: 'breaking-change',
        severity: 'breaking',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Nested <a> inside <Link> no longer required in Next.js 13',
        suggestion: 'Remove nested <a> tag, apply props directly to Link',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Vue-specific migration checks
   */
  private checkVueMigration(
    line: string,
    lineNumber: number,
    filePath: string
  ): MigrationIssue[] {
    const issues: MigrationIssue[] = [];

    // Vue 3 breaking changes
    if (line.includes('new Vue(')) {
      issues.push({
        type: 'breaking-change',
        severity: 'breaking',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'new Vue() is removed in Vue 3',
        suggestion: 'Use createApp() from vue instead',
        autoFixable: false,
      });
    }

    // Filters removed
    if (line.match(/\|\s*\w+(?:\s*\|\s*\w+)*/)) {
      issues.push({
        type: 'removed-feature',
        severity: 'breaking',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Filters are removed in Vue 3',
        suggestion: 'Use computed properties or methods instead',
        autoFixable: false,
      });
    }

    // $on, $off, $once removed
    if (line.match(/\$on\(|\$off\(|\$once\(/)) {
      issues.push({
        type: 'removed-feature',
        severity: 'breaking',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Event API ($on, $off, $once) is removed in Vue 3',
        suggestion: 'Use mitt or tiny-emitter for event bus pattern',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Angular-specific migration checks
   */
  private checkAngularMigration(
    line: string,
    lineNumber: number,
    filePath: string
  ): MigrationIssue[] {
    const issues: MigrationIssue[] = [];

    // Deprecated HttpModule
    if (line.includes('HttpModule') && !line.includes('HttpClientModule')) {
      issues.push({
        type: 'deprecated-api',
        severity: 'warning',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'HttpModule is deprecated',
        suggestion: 'Use HttpClientModule from @angular/common/http',
        autoFixable: false,
      });
    }

    // Old Renderer
    if (line.includes('Renderer') && !line.includes('Renderer2')) {
      issues.push({
        type: 'deprecated-api',
        severity: 'warning',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Renderer is deprecated',
        suggestion: 'Use Renderer2 instead',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * TypeScript-specific migration checks
   */
  private checkTypeScriptMigration(
    line: string,
    lineNumber: number,
    filePath: string
  ): MigrationIssue[] {
    const issues: MigrationIssue[] = [];

    // Deprecated module types
    if (line.includes('"module": "commonjs"') && filePath.includes('tsconfig')) {
      issues.push({
        type: 'config-change',
        severity: 'info',
        filePath,
        lineNumber,
        code: line.trim(),
        description: 'Consider migrating to ES modules',
        suggestion: 'Use "module": "NodeNext" or "ESNext" for modern Node.js',
        autoFixable: false,
      });
    }

    return issues;
  }

  /**
   * Get migration database
   */
  private getMigrationDatabase(): Record<string, any[]> {
    return {
      react: [
        {
          version: '18.0.0',
          breakingChanges: [
            {
              name: 'ReactDOM.render removal',
              description: 'ReactDOM.render is no longer supported',
              migration: 'Use createRoot from react-dom/client',
              pattern: /ReactDOM\.render\(/,
            },
          ],
          deprecations: [
            {
              name: 'Legacy context',
              description: 'Legacy context API is deprecated',
              alternative: 'useContext hook or Context.Provider',
            },
          ],
          newFeatures: ['Concurrent rendering', 'Automatic batching', 'Transitions'],
        },
      ],
      nextjs: [
        {
          version: '13.0.0',
          breakingChanges: [
            {
              name: 'Image layout prop',
              description: 'layout prop removed from next/image',
              migration: 'Use fill, style, or className instead',
              pattern: /layout=/,
            },
          ],
          deprecations: [],
          newFeatures: ['App Router', 'Server Components', 'Streaming'],
        },
      ],
      vue: [
        {
          version: '3.0.0',
          breakingChanges: [
            {
              name: 'Global API changes',
              description: 'new Vue() replaced with createApp()',
              migration: 'Use createApp() from vue package',
              pattern: /new Vue\(/,
            },
          ],
          deprecations: [],
          newFeatures: ['Composition API', 'Teleport', 'Fragments'],
        },
      ],
    };
  }

  /**
   * Generate empty summary
   */
  private emptySummary(): AnalyzeMigrationResult['summary'] {
    return {
      totalFiles: 0,
      filesAnalyzed: 0,
      issuesFound: 0,
      bySeverity: {},
      byType: {},
      autoFixableCount: 0,
    };
  }

  /**
   * Generate summary statistics
   */
  private generateSummary(
    issues: MigrationIssue[],
    totalFiles: number,
    filesAnalyzed: number
  ): AnalyzeMigrationResult['summary'] {
    const bySeverity: Record<string, number> = {};
    const byType: Record<string, number> = {};
    let autoFixableCount = 0;

    for (const issue of issues) {
      bySeverity[issue.severity] = (bySeverity[issue.severity] || 0) + 1;
      byType[issue.type] = (byType[issue.type] || 0) + 1;
      if (issue.autoFixable) autoFixableCount++;
    }

    return {
      totalFiles,
      filesAnalyzed,
      issuesFound: issues.length,
      bySeverity,
      byType,
      autoFixableCount,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    issues: MigrationIssue[],
    migrationPath: MigrationPath
  ): string[] {
    const recommendations: string[] = [];
    const typeCount = new Map<string, number>();

    for (const issue of issues) {
      typeCount.set(issue.type, (typeCount.get(issue.type) || 0) + 1);
    }

    const breakingCount = issues.filter(i => i.severity === 'breaking').length;
    if (breakingCount > 0) {
      recommendations.push(
        `Address ${breakingCount} breaking changes before upgrading to prevent runtime errors`
      );
    }

    if ((typeCount.get('deprecated-api') || 0) > 5) {
      recommendations.push(
        'Multiple deprecated APIs detected. Consider updating them to avoid future breaking changes'
      );
    }

    if (migrationPath.newFeatures.length > 0) {
      recommendations.push(
        `New features available: ${migrationPath.newFeatures.slice(0, 3).join(', ')}`
      );
    }

    const autoFixable = issues.filter(i => i.autoFixable).length;
    if (autoFixable > 0) {
      recommendations.push(
        `${autoFixable} issues can be auto-fixed. Run apply_migration_fixes to apply them`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('No migration issues detected. Your code appears compatible!');
    }

    return recommendations;
  }
}
