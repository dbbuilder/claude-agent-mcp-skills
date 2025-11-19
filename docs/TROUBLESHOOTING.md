# Troubleshooting Guide

Solutions for common issues when using Claude Agent SDK MCP servers.

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [Build Errors](#build-errors)
3. [Runtime Errors](#runtime-errors)
4. [Server-Specific Issues](#server-specific-issues)
5. [Claude Code Integration](#claude-code-integration)
6. [Performance Issues](#performance-issues)
7. [Getting Help](#getting-help)

---

## Installation Issues

### npm install fails with EACCES

**Problem:**
```
npm ERR! Error: EACCES: permission denied
```

**Solution:**
```bash
# Option 1: Use npx (recommended)
npx claude-agent-sdk

# Option 2: Fix npm permissions
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
```

### Missing peer dependencies

**Problem:**
```
npm WARN peer dependencies not installed
```

**Solution:**
```bash
# Install all peer dependencies
npm install @modelcontextprotocol/sdk glob semver
```

### Node version incompatibility

**Problem:**
```
SyntaxError: Unexpected token 'export'
```

**Solution:**
```bash
# Ensure Node.js 18+ is installed
node --version  # Should be v18.0.0 or higher

# Use nvm to install correct version
nvm install 20
nvm use 20
```

---

## Build Errors

### TypeScript compilation fails

**Problem:**
```
error TS2307: Cannot find module '@modelcontextprotocol/sdk'
```

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Rebuild TypeScript
npm run build
```

### ES Module resolution issues

**Problem:**
```
Error [ERR_MODULE_NOT_FOUND]: Cannot find module './types'
```

**Solution:**
Add `.js` extension to imports in TypeScript files:
```typescript
// Before
import { MyType } from './types';

// After
import { MyType } from './types.js';
```

### tsconfig.json issues

**Problem:**
```
error TS5083: Cannot read file 'tsconfig.json'
```

**Solution:**
```bash
# Ensure you're in the correct directory
cd servers/api-doc-generator

# Check tsconfig exists
ls tsconfig.json

# Rebuild
npm run build
```

---

## Runtime Errors

### Server won't start

**Problem:**
```
Error: Cannot find module './build/index.js'
```

**Solution:**
```bash
# Build the server first
npm run build

# Then start
npm start
```

### Port already in use

**Problem:**
```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution:**
```bash
# Find process using port
lsof -i :3000

# Kill it
kill -9 <PID>

# Or use different port
PORT=3001 npm start
```

### Memory issues with large projects

**Problem:**
```
FATAL ERROR: CALL_AND_RETRY_LAST Allocation failed - JavaScript heap out of memory
```

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start

# Or limit files analyzed
# Use maxFiles parameter in tool calls
```

### Permission denied reading files

**Problem:**
```
Error: EACCES: permission denied, open '/path/to/file'
```

**Solution:**
```bash
# Check file permissions
ls -la /path/to/file

# Fix permissions
chmod 644 /path/to/file

# Or run with sudo (not recommended)
```

---

## Server-Specific Issues

### API Documentation Generator

#### No endpoints detected

**Problem:** Server returns empty endpoints array.

**Causes & Solutions:**

1. **Wrong framework detected**
   ```json
   {
     "projectPath": "/path/to/project",
     "framework": "express"  // Explicitly specify
   }
   ```

2. **Non-standard route patterns**
   - Ensure routes use standard decorators/methods
   - Express: `app.get()`, `router.post()`
   - ASP.NET: `[HttpGet]`, `[HttpPost]`

3. **Files not in standard locations**
   ```json
   {
     "projectPath": "/path/to/project",
     "fileTypes": ["ts", "js"]  // Add your extensions
   }
   ```

### Security Auditor

#### False positives

**Problem:** Too many false positive security issues.

**Solution:**
```json
{
  "projectPath": "/path/to/project",
  "severity": "high",  // Filter to high+ only
  "exclude": ["**/test/**", "**/examples/**"]
}
```

#### Scan takes too long

**Problem:** Security scan runs for more than 5 minutes.

**Solution:**
```json
{
  "projectPath": "/path/to/project",
  "maxFiles": 200,  // Limit files
  "checks": ["sql-injection", "xss"]  // Only critical checks
}
```

### Integration Test Generator

#### Tests don't compile

**Problem:** Generated tests have TypeScript errors.

**Solution:**
1. Ensure project has proper TypeScript config
2. Install test dependencies:
   ```bash
   npm install --save-dev jest @types/jest supertest @types/supertest
   ```
3. Check import paths match your project structure

#### Missing test cases

**Problem:** Not all endpoints have tests generated.

**Solution:**
- Ensure endpoints have proper decorators/annotations
- Check that endpoints are exported/public
- Verify the analyzer supports your framework version

### Docker Config Generator

#### Invalid Dockerfile syntax

**Problem:** Docker build fails with syntax errors.

**Solution:**
- Ensure project has a valid package.json or requirements.txt
- Check detected language is correct
- Manually adjust base image if needed

#### compose services won't connect

**Problem:** Services can't reach each other in docker-compose.

**Solution:**
- Use service names as hostnames (e.g., `db:5432` not `localhost:5432`)
- Ensure depends_on is configured
- Check networks are properly defined

### Performance Profiler

#### Too many low-severity issues

**Problem:** Report is cluttered with minor issues.

**Solution:**
```json
{
  "projectPath": "/path/to/project",
  "severity": "medium"  // Filter out low severity
}
```

#### React re-render issues not detected

**Problem:** Profiler misses React performance issues.

**Solution:**
- Ensure files have `.tsx` or `.jsx` extension
- Check that JSX syntax is standard
- The analyzer uses pattern matching, complex cases may need manual review

### Code Migration Assistant

#### Framework not detected

**Problem:** "Could not detect framework" error.

**Solution:**
```json
{
  "projectPath": "/path/to/project",
  "framework": "react",  // Explicitly specify
  "fromVersion": "17.0.0",
  "toVersion": "18.0.0"
}
```

#### Auto-fixes not applied

**Problem:** `apply_migration_fixes` reports 0 fixes applied.

**Causes:**
- All issues require manual intervention
- No issues with auto-fix available
- Dry run mode is enabled (default)

**Solution:**
```json
{
  "projectPath": "/path/to/project",
  "dryRun": false,
  "backup": true
}
```

---

## Claude Code Integration

### Server not recognized

**Problem:** Claude Code doesn't recognize the MCP server.

**Solution:**
```bash
# Add server to Claude Code
claude mcp add --transport stdio api-doc-generator -- \
  node /full/path/to/servers/api-doc-generator/build/index.js

# Verify it's added
claude mcp list
```

### Tools not available

**Problem:** Claude can't find the tools from the server.

**Solution:**
1. Ensure server is running:
   ```bash
   claude mcp status api-doc-generator
   ```

2. Restart the server:
   ```bash
   claude mcp restart api-doc-generator
   ```

3. Check server logs:
   ```bash
   claude mcp logs api-doc-generator
   ```

### Invalid tool parameters

**Problem:** Claude sends wrong parameters to tools.

**Solution:**
- Check the tool's input schema in the server's `index.ts`
- Ensure parameter types match (string vs array vs object)
- Use exact parameter names as defined

### Server crashes during operation

**Problem:** Server exits unexpectedly during tool execution.

**Solution:**
1. Check server logs for errors
2. Run server manually to see error output:
   ```bash
   node servers/api-doc-generator/build/index.js
   ```
3. Ensure project path is valid and accessible

---

## Performance Issues

### Slow analysis

**Problem:** Analysis takes more than 30 seconds.

**Solutions:**

1. **Limit files analyzed:**
   ```json
   {
     "projectPath": "/path/to/project",
     "maxFiles": 100
   }
   ```

2. **Exclude unnecessary directories:**
   - node_modules (excluded by default)
   - build/dist directories
   - test files if not needed

3. **Use file type filters:**
   ```json
   {
     "fileTypes": ["ts", "tsx"]  // Only TypeScript
   }
   ```

### High memory usage

**Problem:** Server uses excessive memory.

**Solutions:**

1. **Process smaller batches:**
   ```json
   {
     "maxFiles": 50
   }
   ```

2. **Increase Node.js memory:**
   ```bash
   NODE_OPTIONS="--max-old-space-size=4096" npm start
   ```

3. **Close unused servers:**
   ```bash
   claude mcp stop unused-server
   ```

### Timeout issues

**Problem:** Operations time out before completing.

**Solutions:**

1. **Increase timeout in CLI tests:**
   ```typescript
   execSync(command, { timeout: 60000 });  // 60 seconds
   ```

2. **Process incrementally:** Break large projects into smaller chunks

3. **Check for blocking operations:** Ensure async operations don't block

---

## Common Error Messages

### `ENOENT: no such file or directory`

**Cause:** File or directory doesn't exist.

**Solution:**
```bash
# Verify path exists
ls -la /path/to/project

# Use absolute paths
{
  "projectPath": "/home/user/project"  // Not "~/project"
}
```

### `SyntaxError: Unexpected token`

**Cause:** Invalid JSON or JavaScript syntax.

**Solution:**
```bash
# Validate JSON
cat file.json | jq .

# Check for trailing commas, missing quotes
```

### `Error: Cannot find module`

**Cause:** Missing dependency or wrong import path.

**Solution:**
```bash
# Reinstall dependencies
npm install

# Check module exists
ls node_modules/module-name
```

### `TypeError: Cannot read property of undefined`

**Cause:** Accessing property on null/undefined value.

**Solution:**
- Add null checks in code
- Ensure all required parameters are provided
- Check API response structure

---

## Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Environment variable
DEBUG=mcp:* node servers/api-doc-generator/build/index.js

# In code
console.error('Debug:', JSON.stringify(data, null, 2));
```

### Viewing Server Logs

```bash
# Via Claude Code
claude mcp logs api-doc-generator

# Manual server
node servers/api-doc-generator/build/index.js 2>&1 | tee server.log
```

---

## Getting Help

### Before asking for help

1. **Check this guide** - Most common issues are covered above
2. **Search existing issues** - Someone may have encountered the same problem
3. **Collect information:**
   - Node.js version: `node --version`
   - npm version: `npm --version`
   - OS and version
   - Full error message with stack trace
   - Steps to reproduce

### Where to get help

1. **GitHub Issues** - [Report bugs](https://github.com/dbbuilder/claude-agent-sdk/issues)
2. **GitHub Discussions** - [Ask questions](https://github.com/dbbuilder/claude-agent-sdk/discussions)
3. **Stack Overflow** - Tag with `claude-code` and `mcp`

### Reporting bugs

Include:
- Clear title describing the issue
- Steps to reproduce
- Expected vs actual behavior
- Error messages and logs
- Environment details
- Minimal reproduction case if possible

---

## Quick Reference

### Essential Commands

```bash
# Build all servers
npm run build

# Build specific server
cd servers/api-doc-generator && npm run build

# Run server manually
node servers/api-doc-generator/build/index.js

# Check server in Claude Code
claude mcp status api-doc-generator

# Restart server
claude mcp restart api-doc-generator

# View logs
claude mcp logs api-doc-generator

# Remove server
claude mcp remove api-doc-generator
```

### Environment Variables

```bash
# Increase memory
NODE_OPTIONS="--max-old-space-size=4096"

# Enable debug logging
DEBUG=mcp:*

# Set project path
SDK_PATH=/path/to/claude-agent-sdk
```

---

*Last updated: 2025-11-18*
