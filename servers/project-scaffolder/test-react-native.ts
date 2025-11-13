import { ProjectGenerator } from './dist/generator.js';
import * as fs from 'fs';
import * as path from 'path';

const generator = new ProjectGenerator();
const testOutputDir = path.join(process.cwd(), 'test-output');

console.log('=== Testing React Native Template ===\n');

// Clean up previous test if exists
const projectPath = path.join(testOutputDir, 'test-react-native-app');
if (fs.existsSync(projectPath)) {
  fs.rmSync(projectPath, { recursive: true, force: true });
}

try {
  const result = await generator.scaffold({
    template: 'react-native',
    projectName: 'test-react-native-app',
    outputPath: testOutputDir,
    options: {
      author: 'Claude Agent SDK',
      description: 'Test React Native app with Expo and TypeScript',
      includeDocker: false,
      includeTests: true,
      includeCICD: true,
    },
  });

  if (result.success) {
    console.log(`✅ Success: ${result.filesCreated.length} files created`);
    console.log(`📁 Location: ${result.projectPath}\n`);

    console.log('Files created:');
    result.filesCreated.forEach((file, idx) => {
      console.log(`  ${idx + 1}. ${file}`);
    });

    console.log('\n📂 Directory structure:');
    const files = fs.readdirSync(result.projectPath);
    files.forEach((file) => {
      const filePath = path.join(result.projectPath, file);
      const stat = fs.statSync(filePath);
      if (stat.isDirectory()) {
        console.log(`  📁 ${file}/`);
        // Show contents of src directory
        if (file === 'src') {
          const srcFiles = fs.readdirSync(filePath);
          srcFiles.forEach((srcFile) => {
            const srcFilePath = path.join(filePath, srcFile);
            const srcStat = fs.statSync(srcFilePath);
            if (srcStat.isDirectory()) {
              console.log(`    📁 ${srcFile}/`);
            } else {
              console.log(`    📄 ${srcFile}`);
            }
          });
        }
      } else {
        console.log(`  📄 ${file}`);
      }
    });

    console.log('\n✨ Next steps:');
    result.nextSteps.forEach((step, idx) => {
      console.log(`  ${idx + 1}. ${step}`);
    });

    console.log('\n✅ React Native template test passed!');
  } else {
    console.log(`❌ Failed: ${result.error}`);
    process.exit(1);
  }
} catch (error) {
  console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}
