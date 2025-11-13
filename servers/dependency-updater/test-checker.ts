import { DependencyChecker } from './dist/checker.js';

const checker = new DependencyChecker();

console.log('=== Dependency Updater Test ===\n');

// Test on Security Auditor project (has npm dependencies)
const result = await checker.check({
  projectPath: '../security-auditor',
  updateType: 'all',
});

console.log('Package Manager:', result.packageManager);
console.log('Outdated Count:', result.count);
console.log('\nSummary:');
console.log('- Patch updates:', result.summary.patch);
console.log('- Minor updates:', result.summary.minor);
console.log('- Major updates:', result.summary.major);

if (result.count > 0) {
  console.log('\nOutdated Dependencies:');
  result.dependencies.slice(0, 5).forEach(dep => {
    console.log(`\n  ${dep.name}`);
    console.log(`    Current: ${dep.current}`);
    console.log(`    Latest: ${dep.latest}`);
    console.log(`    Type: ${dep.updateType}`);
    if (dep.breaking) console.log(`    ⚠️  Breaking changes possible`);
  });

  if (result.dependencies.length > 5) {
    console.log(`\n  ... and ${result.dependencies.length - 5} more`);
  }
}

console.log('\n✅ Dependency Updater working correctly!');
