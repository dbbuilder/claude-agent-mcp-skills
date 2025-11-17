/**
 * Integration Test Generator
 * Main orchestrator for generating integration tests
 */

import { APIAnalyzer } from './analyzers/api-analyzer.js';
import { JestGenerator } from './generators/jest-generator.js';
import { PytestGenerator } from './generators/pytest-generator.js';
import { XUnitGenerator } from './generators/xunit-generator.js';
import {
  TestCase,
  Framework,
  TestFramework,
  GenerateOptions,
  GenerateResult,
  AnalyzeOptions,
} from './types.js';

export class TestGenerator {
  private analyzer: APIAnalyzer;
  private jestGenerator: JestGenerator;
  private pytestGenerator: PytestGenerator;
  private xunitGenerator: XUnitGenerator;

  constructor() {
    this.analyzer = new APIAnalyzer();
    this.jestGenerator = new JestGenerator();
    this.pytestGenerator = new PytestGenerator();
    this.xunitGenerator = new XUnitGenerator();
  }

  /**
   * Analyze API and return test cases without generating tests
   */
  async analyze(options: AnalyzeOptions): Promise<TestCase[]> {
    const { projectPath, framework } = options;
    return await this.analyzer.analyze(projectPath, framework);
  }

  /**
   * Generate integration tests for a project
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      const { projectPath, outputPath, testFramework, framework } = options;

      // Analyze API to get test cases
      const testCases = await this.analyzer.analyze(projectPath, framework);

      if (testCases.length === 0) {
        return {
          success: false,
          error: 'No API endpoints found in the project',
        };
      }

      // Determine test framework
      const finalTestFramework = testFramework || this.detectTestFramework(framework);

      // Generate tests using appropriate generator
      let result: GenerateResult;
      switch (finalTestFramework) {
        case 'jest':
          result = this.jestGenerator.generate(testCases, outputPath);
          break;
        case 'pytest':
          result = this.pytestGenerator.generate(testCases, outputPath);
          break;
        case 'xunit':
          result = this.xunitGenerator.generate(testCases, outputPath);
          break;
        default:
          return {
            success: false,
            error: `Unsupported test framework: ${finalTestFramework}`,
          };
      }

      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate tests for all supported frameworks
   */
  async generateAll(options: GenerateOptions): Promise<Record<TestFramework, GenerateResult>> {
    const { projectPath, framework } = options;

    // Analyze once
    const testCases = await this.analyzer.analyze(projectPath, framework);

    const results: Record<TestFramework, GenerateResult> = {
      jest: { success: false, error: 'Not generated' },
      pytest: { success: false, error: 'Not generated' },
      xunit: { success: false, error: 'Not generated' },
    };

    // Generate for all frameworks
    results.jest = this.jestGenerator.generate(testCases, options.outputPath || 'tests/api.test.ts');
    results.pytest = this.pytestGenerator.generate(testCases, options.outputPath || 'tests/test_api.py');
    results.xunit = this.xunitGenerator.generate(testCases, options.outputPath || 'Tests/ApiTests.cs');

    return results;
  }

  /**
   * Get test case preview without writing files
   */
  async preview(options: AnalyzeOptions): Promise<{
    testCases: TestCase[];
    summary: {
      totalEndpoints: number;
      totalTests: number;
      byScenario: Record<string, number>;
      byMethod: Record<string, number>;
    };
  }> {
    const testCases = await this.analyzer.analyze(options.projectPath, options.framework);

    const summary = {
      totalEndpoints: new Set(testCases.map(tc => `${tc.endpoint.method} ${tc.endpoint.path}`)).size,
      totalTests: testCases.length,
      byScenario: this.countBy(testCases, tc => tc.scenario),
      byMethod: this.countBy(testCases, tc => tc.endpoint.method),
    };

    return { testCases, summary };
  }

  /**
   * Helper: Detect test framework from API framework
   */
  private detectTestFramework(framework?: Framework): TestFramework {
    switch (framework) {
      case 'express':
        return 'jest';
      case 'fastapi':
        return 'pytest';
      case 'aspnet':
        return 'xunit';
      default:
        return 'jest';
    }
  }

  /**
   * Helper: Count items by property
   */
  private countBy<T>(items: T[], selector: (item: T) => string): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const item of items) {
      const key = selector(item);
      counts[key] = (counts[key] || 0) + 1;
    }
    return counts;
  }
}
