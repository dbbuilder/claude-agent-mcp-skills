import { ProjectGenerator } from './dist/generator.js';
import * as fs from 'fs';
import * as path from 'path';

const generator = new ProjectGenerator();
const testOutputDir = path.join(process.cwd(), 'test-output');

// Clean up test directory
if (fs.existsSync(testOutputDir)) {
  fs.rmSync(testOutputDir, { recursive: true, force: true });
}
fs.mkdirSync(testOutputDir, { recursive: true });

const templates = [
  { name: 'typescript-express', projectName: 'test-express-api' },
  { name: 'typescript-nextjs', projectName: 'test-nextjs-app' },
  { name: 'dotnet-webapi', projectName: 'TestDotNetApi' },
  { name: 'python-fastapi', projectName: 'test-fastapi-app' },
  { name: 'vue3-frontend', projectName: 'test-vue3-app' },
  { name: 'react-frontend', projectName: 'test-react-app' },
];

console.log('=== Testing All 6 Project Templates ===\n');

let totalSuccess = 0;
let totalFailed = 0;

for (const template of templates) {
  console.log(`Testing ${template.name}...`);

  try {
    const result = await generator.scaffold({
      template: template.name,
      projectName: template.projectName,
      outputPath: testOutputDir,
      options: {
        author: 'Claude Agent SDK',
        description: `Test project for ${template.name}`,
        includeDocker: true,
        includeTests: true,
        includeCICD: true,
      },
    });

    if (result.success) {
      console.log(`  ✅ Success: ${result.filesCreated.length} files created`);
      console.log(`  📁 Location: ${result.projectPath}`);
      totalSuccess++;
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      totalFailed++;
    }
  } catch (error) {
    console.log(`  ❌ Error: ${error instanceof Error ? error.message : String(error)}`);
    totalFailed++;
  }

  console.log('');
}

console.log('=== Summary ===');
console.log(`✅ Successful: ${totalSuccess}/6`);
console.log(`❌ Failed: ${totalFailed}/6`);

if (totalSuccess === 6) {
  console.log('\n🎉 All templates generated successfully!');

  // List all generated projects
  console.log('\n=== Generated Projects ===');
  for (const template of templates) {
    const projectPath = path.join(testOutputDir, template.projectName);
    if (fs.existsSync(projectPath)) {
      const files = fs.readdirSync(projectPath, { recursive: true }) as string[];
      console.log(`\n${template.projectName}/ (${files.length} files)`);

      // Show directory structure (top-level only)
      const topLevel = fs.readdirSync(projectPath);
      topLevel.forEach((file) => {
        const filePath = path.join(projectPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isDirectory()) {
          console.log(`  📁 ${file}/`);
        } else {
          console.log(`  📄 ${file}`);
        }
      });
    }
  }
} else {
  console.log('\n⚠️  Some templates failed to generate');
  process.exit(1);
}
