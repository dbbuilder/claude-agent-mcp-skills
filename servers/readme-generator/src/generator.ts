/**
 * README Generator
 * Generates README.md from project analysis
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalysis, GenerateOptions, GenerateResult } from './types.js';
import { ProjectAnalyzer } from './analyzer.js';

export class ReadmeGenerator {
  private analyzer: ProjectAnalyzer;

  constructor() {
    this.analyzer = new ProjectAnalyzer();
  }

  /**
   * Generate README for a project
   */
  async generate(options: GenerateOptions): Promise<GenerateResult> {
    try {
      // Analyze project
      const analysis = await this.analyzer.analyze(options.projectPath);

      // Generate README content
      const content = this.buildReadme(analysis, options);

      // Determine output path
      const outputPath = options.options?.outputPath || path.join(options.projectPath, 'README.md');

      // Check if file exists
      if (fs.existsSync(outputPath) && !options.options?.overwrite) {
        return {
          content,
          filePath: outputPath,
          sections: this.getSections(options),
          warnings: ['README.md already exists. Use overwrite: true to replace it.'],
          analysis,
          success: false,
          error: 'File exists and overwrite is false',
        };
      }

      // Write README
      fs.writeFileSync(outputPath, content, 'utf-8');

      return {
        content,
        filePath: outputPath,
        sections: this.getSections(options),
        warnings: [],
        analysis,
        success: true,
      };
    } catch (error) {
      return {
        content: '',
        filePath: path.join(options.projectPath, 'README.md'),
        sections: [],
        warnings: [],
        analysis: {} as ProjectAnalysis,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Build README content from analysis
   */
  private buildReadme(analysis: ProjectAnalysis, options: GenerateOptions): string {
    const sections: string[] = [];

    // Title and description
    sections.push(this.buildTitleSection(analysis, options));

    // Badges (if enabled)
    if (options.options?.includeBadges !== false) {
      sections.push(this.buildBadgesSection(analysis));
    }

    // Description
    sections.push(this.buildDescriptionSection(analysis, options));

    // Features
    sections.push(this.buildFeaturesSection(analysis));

    // Tech Stack
    sections.push(this.buildTechStackSection(analysis));

    // Getting Started
    sections.push(this.buildGettingStartedSection(analysis));

    // Project Structure (if enabled)
    if (options.options?.includeStructure !== false) {
      sections.push(this.buildStructureSection(analysis));
    }

    // Environment Variables (if enabled and found)
    if (options.options?.includeEnvVars !== false && analysis.envVars.length > 0) {
      sections.push(this.buildEnvVarsSection(analysis));
    }

    // Development
    sections.push(this.buildDevelopmentSection(analysis));

    // Testing (if has tests)
    if (analysis.hasTests) {
      sections.push(this.buildTestingSection(analysis));
    }

    // Deployment (if has Docker or CI/CD)
    if (analysis.hasDocker || analysis.hasCICD) {
      sections.push(this.buildDeploymentSection(analysis));
    }

    // License
    if (analysis.license) {
      sections.push(this.buildLicenseSection(analysis));
    }

    return sections.filter((s) => s.trim()).join('\n\n');
  }

  private buildTitleSection(analysis: ProjectAnalysis, options: GenerateOptions): string {
    const title = options.options?.title || analysis.projectName;
    return `# ${title}`;
  }

  private buildBadgesSection(analysis: ProjectAnalysis): string {
    const badges: string[] = [];

    // License badge
    if (analysis.license) {
      badges.push(`![License](https://img.shields.io/badge/license-${analysis.license}-blue.svg)`);
    }

    // Language badges
    for (const lang of analysis.techStack.languages) {
      badges.push(`![${lang}](https://img.shields.io/badge/${lang}-blue)`);
    }

    return badges.length > 0 ? badges.join(' ') : '';
  }

  private buildDescriptionSection(analysis: ProjectAnalysis, options: GenerateOptions): string {
    return options.options?.description || `A ${analysis.techStack.frameworks.join(', ') || analysis.techStack.languages.join('/')} project.`;
  }

  private buildFeaturesSection(analysis: ProjectAnalysis): string {
    const features: string[] = [];

    if (analysis.techStack.frameworks.length > 0) {
      features.push(`Built with ${analysis.techStack.frameworks.join(', ')}`);
    }

    if (analysis.techStack.databases.length > 0) {
      features.push(`${analysis.techStack.databases.join(', ')} database integration`);
    }

    if (analysis.hasTests) {
      features.push('Comprehensive test coverage');
    }

    if (analysis.hasDocker) {
      features.push('Docker support');
    }

    if (analysis.hasCICD) {
      features.push('CI/CD pipeline');
    }

    if (features.length === 0) return '';

    return `## Features\n\n${features.map((f) => `- ${f}`).join('\n')}`;
  }

  private buildTechStackSection(analysis: ProjectAnalysis): string {
    const items: string[] = [];

    if (analysis.techStack.languages.length > 0) {
      items.push(`**Languages:** ${analysis.techStack.languages.join(', ')}`);
    }

    if (analysis.techStack.frameworks.length > 0) {
      items.push(`**Frameworks:** ${analysis.techStack.frameworks.join(', ')}`);
    }

    if (analysis.techStack.databases.length > 0) {
      items.push(`**Databases:** ${analysis.techStack.databases.join(', ')}`);
    }

    if (analysis.techStack.tools.length > 0) {
      items.push(`**Tools:** ${analysis.techStack.tools.join(', ')}`);
    }

    if (items.length === 0) return '';

    return `## Tech Stack\n\n${items.join('  \n')}`;
  }

  private buildGettingStartedSection(analysis: ProjectAnalysis): string {
    const prerequisites: string[] = [];
    const installSteps: string[] = [];

    // Prerequisites
    if (analysis.techStack.languages.includes('JavaScript') || analysis.techStack.languages.includes('TypeScript')) {
      prerequisites.push('Node.js 18+ and npm/yarn');
    }
    if (analysis.techStack.languages.includes('Python')) {
      prerequisites.push('Python 3.9+');
    }
    if (analysis.techStack.languages.includes('C#')) {
      prerequisites.push('.NET 8.0 SDK');
    }

    // Installation
    if (analysis.techStack.packageManager === 'npm') {
      installSteps.push('```bash\nnpm install\n```');
    } else if (analysis.techStack.packageManager === 'pip') {
      installSteps.push('```bash\npip install -r requirements.txt\n```');
    } else if (analysis.techStack.packageManager === 'dotnet') {
      installSteps.push('```bash\ndotnet restore\n```');
    }

    const prereqSection = prerequisites.length > 0 ? `### Prerequisites\n\n${prerequisites.map((p) => `- ${p}`).join('\n')}` : '';
    const installSection = installSteps.length > 0 ? `### Installation\n\n${installSteps.join('\n')}` : '';

    return `## Getting Started\n\n${prereqSection}\n\n${installSection}`.trim();
  }

  private buildStructureSection(analysis: ProjectAnalysis): string {
    if (analysis.structure.directories.length === 0) return '';

    const tree = analysis.structure.directories.map((dir) => `├── ${dir}/`).join('\n');

    return `## Project Structure\n\n\`\`\`\n${analysis.projectName}/\n${tree}\n\`\`\``;
  }

  private buildEnvVarsSection(analysis: ProjectAnalysis): string {
    if (analysis.envVars.length === 0) return '';

    const vars = analysis.envVars
      .map((v) => {
        let line = `- \`${v.name}\``;
        if (v.description) line += ` - ${v.description}`;
        if (v.required) line += ' (required)';
        if (v.example) line += `\n  - Example: \`${v.example}\``;
        return line;
      })
      .join('\n');

    return `## Environment Variables\n\nCopy \`.env.template\` to \`.env\` and configure:\n\n${vars}`;
  }

  private buildDevelopmentSection(analysis: ProjectAnalysis): string {
    const commands: string[] = [];

    // Dev command
    if (analysis.scripts.dev) {
      commands.push(`### Development\n\n\`\`\`bash\n${analysis.techStack.packageManager} run dev\n\`\`\``);
    } else if (analysis.scripts.start) {
      commands.push(`### Start\n\n\`\`\`bash\n${analysis.techStack.packageManager} run start\n\`\`\``);
    }

    // Build command
    if (analysis.scripts.build) {
      commands.push(`### Build\n\n\`\`\`bash\n${analysis.techStack.packageManager} run build\n\`\`\``);
    }

    // Lint command
    if (analysis.scripts.lint) {
      commands.push(`### Lint\n\n\`\`\`bash\n${analysis.techStack.packageManager} run lint\n\`\`\``);
    }

    return commands.length > 0 ? `## Development\n\n${commands.join('\n\n')}` : '';
  }

  private buildTestingSection(analysis: ProjectAnalysis): string {
    if (!analysis.scripts.test) return '';

    return `## Testing\n\n\`\`\`bash\n${analysis.techStack.packageManager} test\n\`\`\``;
  }

  private buildDeploymentSection(analysis: ProjectAnalysis): string {
    const sections: string[] = [];

    if (analysis.hasDocker) {
      sections.push(`### Docker\n\n\`\`\`bash\ndocker-compose up\n\`\`\``);
    }

    if (analysis.hasCICD) {
      sections.push('### CI/CD\n\nThis project includes automated CI/CD pipelines. See `.github/workflows/` for details.');
    }

    return sections.length > 0 ? `## Deployment\n\n${sections.join('\n\n')}` : '';
  }

  private buildLicenseSection(analysis: ProjectAnalysis): string {
    return `## License\n\n${analysis.license}`;
  }

  private getSections(options: GenerateOptions): string[] {
    const sections = ['Title', 'Description', 'Features', 'Tech Stack', 'Getting Started'];

    if (options.options?.includeBadges !== false) sections.splice(1, 0, 'Badges');
    if (options.options?.includeStructure !== false) sections.push('Project Structure');
    if (options.options?.includeEnvVars !== false) sections.push('Environment Variables');

    sections.push('Development', 'Testing', 'Deployment', 'License');

    return sections;
  }
}
