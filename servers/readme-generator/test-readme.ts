import { ReadmeGenerator } from './dist/generator.js';

const generator = new ReadmeGenerator();

// Test on the security-auditor project
const result = await generator.generate({
  projectPath: '../security-auditor',
  options: {
    title: 'Security Auditor MCP Server',
    description: 'OWASP Top 10 security scanner for TypeScript, C#, and Python projects',
    includeStructure: true,
    includeBadges: true,
    includeEnvVars: false,
    overwrite: false,
  },
});

console.log('SUCCESS:', result.success);
console.log('File Path:', result.filePath);
console.log('Sections:', result.sections.join(', '));
console.log('\nAnalysis:');
console.log('- Languages:', result.analysis.techStack?.languages?.join(', '));
console.log('- Frameworks:', result.analysis.techStack?.frameworks?.join(', '));
console.log('- Has Tests:', result.analysis.hasTests);
console.log('- Has Docker:', result.analysis.hasDocker);

if (!result.success) {
  console.log('\nWarnings:', result.warnings);
  console.error('ERROR:', result.error);
}

console.log('\nGenerated README Preview (first 500 chars):');
console.log(result.content.substring(0, 500) + '...');
