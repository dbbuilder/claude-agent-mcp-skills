import { ProjectGenerator } from './dist/generator.js';
import * as fs from 'fs';
import * as path from 'path';

const generator = new ProjectGenerator();
const testOutputDir = path.join(process.cwd(), 'test-output');

console.log('=== Verifying Next.js Template ===\n');

const projectPath = path.join(testOutputDir, 'verify-nextjs');
if (fs.existsSync(projectPath)) {
  fs.rmSync(projectPath, { recursive: true, force: true });
}

const result = await generator.scaffold({
  template: 'typescript-nextjs',
  projectName: 'verify-nextjs',
  outputPath: testOutputDir,
  options: { description: 'Verification test' },
});

console.log(result.success ? `✅ Next.js template works: ${result.filesCreated.length} files` : `❌ Failed: ${result.error}`);
