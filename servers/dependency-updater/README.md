# Dependency Updater MCP Server

**Priority:** 1600 (High)
**ROI:** $24,000/year
**Status:** Week 3 Development

## Overview

Automated dependency updates with breaking change detection and test verification. Saves 3-5 hours per project per month on dependency maintenance.

## Features

### Detection Capabilities

- **npm/yarn/pnpm** - Detects outdated Node.js packages
- **pip/poetry** - Detects outdated Python packages
- **dotnet** - Detects outdated NuGet packages
- **cargo** - Detects outdated Rust crates
- **go** - Detects outdated Go modules

### Update Strategies

1. **Patch Updates** - Safe, automatic updates (1.0.0 → 1.0.1)
2. **Minor Updates** - Low-risk updates (1.0.0 → 1.1.0)
3. **Major Updates** - Breaking change updates (1.0.0 → 2.0.0)

### Safety Features

- **Changelog Analysis** - Parses CHANGELOGs for breaking changes
- **Test Verification** - Runs tests before confirming updates
- **Rollback Support** - Automatic rollback if tests fail
- **Batch Updates** - Group related updates together
- **Incremental Updates** - Update one major version at a time

## MCP Tools

### `check_outdated`

Check for outdated dependencies in a project.

**Parameters:**
- `projectPath` (string) - Path to project directory
- `packageManager` (enum, optional) - npm, yarn, pnpm, pip, poetry, dotnet, cargo, go
- `updateType` (enum, optional) - patch, minor, major, all

**Returns:**
- Outdated dependencies list
- Current versions
- Latest versions
- Update type (patch/minor/major)
- Breaking change warnings

**Example:**
```typescript
await checkOutdated({
  projectPath: '/path/to/project',
  packageManager: 'npm',
  updateType: 'minor',
});
```

### `update_dependencies`

Update dependencies in a project.

**Parameters:**
- `projectPath` (string) - Path to project directory
- `dependencies` (array) - List of dependencies to update
- `runTests` (boolean, optional) - Run tests after update (default: true)
- `autoRollback` (boolean, optional) - Rollback if tests fail (default: true)

**Returns:**
- Updated dependencies
- Test results
- Changelog summaries
- Warnings/errors

### `analyze_breaking_changes`

Analyze potential breaking changes in updates.

**Parameters:**
- `packageName` (string) - Package name
- `fromVersion` (string) - Current version
- `toVersion` (string) - Target version

**Returns:**
- Breaking change list
- Migration guide links
- Compatibility notes

## Quick Start

```bash
# Install dependencies
npm install

# Build
npm run build

# Test
npm test

# Run as MCP server
npm run dev
```

## Usage Example

```typescript
import { checkOutdated, updateDependencies } from './servers/dependency-updater';

// Check for outdated dependencies
const outdated = await checkOutdated({
  projectPath: '/path/to/project',
  updateType: 'minor',
});

console.log(`Found ${outdated.count} outdated dependencies`);

// Update patch and minor versions
await updateDependencies({
  projectPath: '/path/to/project',
  dependencies: outdated.dependencies.filter(d => d.updateType !== 'major'),
  runTests: true,
  autoRollback: true,
});
```

## Token Efficiency

**Traditional Approach:**
- Agent reads package.json, runs `npm outdated`, reads CHANGELOGs, updates files
- Token cost: 20K-50K tokens per update cycle

**Code Execution Approach:**
- Agent calls `check_outdated` and `update_dependencies` tools
- Token cost: 1K-2K tokens
- **Savings: 95-98% token reduction**

## Update Workflow

1. **Detection**
   - Scan for outdated dependencies
   - Classify by update type (patch/minor/major)
   - Identify breaking changes

2. **Analysis**
   - Parse CHANGELOGs
   - Check for breaking changes
   - Find migration guides

3. **Update**
   - Update package files
   - Install new versions
   - Run tests

4. **Verification**
   - Test results analysis
   - Rollback if tests fail
   - Report status

5. **Documentation**
   - Generate update summary
   - List breaking changes
   - Provide migration notes

## Breaking Change Detection

**Methods:**
- Semantic versioning analysis
- CHANGELOG parsing
- Release notes extraction
- Known breaking change patterns
- Community reports

**Patterns Detected:**
- API removals
- Signature changes
- Configuration changes
- Deprecated features
- Minimum version bumps

## Integration Examples

### GitHub Action
```yaml
name: Dependency Updates

on:
  schedule:
    - cron: '0 0 * * 1'  # Weekly

jobs:
  update:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Check for updates
        run: npx tsx update-deps.ts
```

### Scheduled Task
```typescript
// update-deps.ts
import { checkOutdated, updateDependencies } from '@claude-mcp-skills/dependency-updater';

const outdated = await checkOutdated({
  projectPath: process.cwd(),
  updateType: 'minor',
});

if (outdated.count > 0) {
  await updateDependencies({
    projectPath: process.cwd(),
    dependencies: outdated.dependencies,
    runTests: true,
  });
}
```

## License

MIT
