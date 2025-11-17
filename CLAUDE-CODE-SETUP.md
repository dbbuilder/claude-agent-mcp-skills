# Using MCP Servers with Claude Code

This guide shows how to integrate the Claude Agent SDK MCP servers into your Claude Code workflow.

## Quick Start

### 1. Build the MCP Servers

First, build all the MCP servers you want to use:

```bash
cd /mnt/d/Dev2/claude-agent-sdk

# Build all servers
npm install
npm run build

# Or build individual servers
cd servers/api-doc-generator
npm install
npm run build
```

### 2. Add Servers to Claude Code

Use the Claude CLI to add servers:

```bash
# API Documentation Generator
claude mcp add --transport stdio api-doc-generator -- \
  node /mnt/d/Dev2/claude-agent-sdk/servers/api-doc-generator/build/index.js

# Integration Test Generator
claude mcp add --transport stdio integration-test-generator -- \
  node /mnt/d/Dev2/claude-agent-sdk/servers/integration-test-generator/build/index.js

# Security Auditor
claude mcp add --transport stdio security-auditor -- \
  node /mnt/d/Dev2/claude-agent-sdk/servers/security-auditor/build/index.js

# Project Scaffolder
claude mcp add --transport stdio project-scaffolder -- \
  node /mnt/d/Dev2/claude-agent-sdk/servers/project-scaffolder/build/index.js

# README Generator
claude mcp add --transport stdio readme-generator -- \
  node /mnt/d/Dev2/claude-agent-sdk/servers/readme-generator/build/index.js

# Dependency Updater
claude mcp add --transport stdio dependency-updater -- \
  node /mnt/d/Dev2/claude-agent-sdk/servers/dependency-updater/build/index.js
```

### 3. Verify Installation

Check that servers are configured:

```bash
claude mcp list
```

In Claude Code, type `/mcp` to see server connection status.

## Project-Level Configuration (Recommended)

For team collaboration, create a `.mcp.json` file in your project root:

```json
{
  "mcpServers": {
    "api-doc-generator": {
      "type": "stdio",
      "command": "node",
      "args": ["${HOME}/claude-agent-sdk/servers/api-doc-generator/build/index.js"]
    },
    "integration-test-generator": {
      "type": "stdio",
      "command": "node",
      "args": ["${HOME}/claude-agent-sdk/servers/integration-test-generator/build/index.js"]
    },
    "security-auditor": {
      "type": "stdio",
      "command": "node",
      "args": ["${HOME}/claude-agent-sdk/servers/security-auditor/build/index.js"]
    }
  }
}
```

**Benefits:**
- Version controlled with your project
- Team members get same tools automatically
- Environment variable support for flexible paths
- Scoped to specific projects

## Usage Examples

### API Documentation Generator

**Generate documentation for your API:**

In Claude Code chat:
```
Use the api-doc-generator to create OpenAPI and Markdown docs for this Express project at /path/to/api
```

Claude will use the `document_api` tool automatically.

**Preview endpoints first:**

```
Use the api-doc-generator to extract and show me all endpoints from this FastAPI project
```

Uses the `extract_endpoints` tool.

### Integration Test Generator

**Generate tests for your API:**

```
Use the integration-test-generator to create Jest tests for the Express API in this project
```

**Preview what tests will be created:**

```
Use the integration-test-generator to preview the test plan for this API
```

**Generate tests for all frameworks:**

```
Use the integration-test-generator to generate tests for Jest, Pytest, and xUnit for this project
```

### Security Auditor

**Scan for vulnerabilities:**

```
Use the security-auditor to scan this project for security issues
```

**Check specific vulnerability type:**

```
Use the security-auditor to check for SQL injection vulnerabilities in this codebase
```

### Project Scaffolder

**Create a new project:**

```
Use the project-scaffolder to create a new Next.js + TypeScript project called my-app
```

**List available templates:**

```
Use the project-scaffolder to show me all available project templates
```

### README Generator

**Generate a README:**

```
Use the readme-generator to create a comprehensive README for this project
```

### Dependency Updater

**Check for outdated dependencies:**

```
Use the dependency-updater to check what dependencies need updating in this project
```

**Update dependencies:**

```
Use the dependency-updater to update all patch and minor version dependencies
```

## Typical Workflows

### New API Project Workflow

1. **Scaffold the project:**
```
Use project-scaffolder to create a new Express + TypeScript API project
```

2. **Build your API** (manual coding)

3. **Generate documentation:**
```
Use api-doc-generator to create OpenAPI spec and Markdown docs
```

4. **Generate integration tests:**
```
Use integration-test-generator to create Jest tests for all endpoints
```

5. **Security scan:**
```
Use security-auditor to scan for vulnerabilities
```

6. **Update dependencies:**
```
Use dependency-updater to check for and update outdated packages
```

7. **Generate README:**
```
Use readme-generator to create comprehensive documentation
```

### Existing Project Workflow

1. **Security audit:**
```
Use security-auditor to scan this project
```

2. **Generate missing docs:**
```
Use api-doc-generator to create OpenAPI spec for our Express API
```

3. **Add test coverage:**
```
Use integration-test-generator to create tests for uncovered endpoints
```

4. **Check dependencies:**
```
Use dependency-updater to find outdated packages
```

## Advanced Configuration

### Environment Variables

Use environment variables in `.mcp.json`:

```json
{
  "mcpServers": {
    "api-doc-generator": {
      "type": "stdio",
      "command": "node",
      "args": ["${SDK_PATH}/servers/api-doc-generator/build/index.js"],
      "env": {
        "NODE_ENV": "production",
        "LOG_LEVEL": "${LOG_LEVEL:-info}"
      }
    }
  }
}
```

Then set the environment variables:

```bash
export SDK_PATH=/mnt/d/Dev2/claude-agent-sdk
export LOG_LEVEL=debug
```

### Windows Paths

For Windows, use proper path formatting:

```json
{
  "mcpServers": {
    "api-doc-generator": {
      "type": "stdio",
      "command": "node",
      "args": ["D:\\Dev2\\claude-agent-sdk\\servers\\api-doc-generator\\build\\index.js"]
    }
  }
}
```

Or use environment variables:

```json
{
  "mcpServers": {
    "api-doc-generator": {
      "type": "stdio",
      "command": "node",
      "args": ["${USERPROFILE}\\claude-agent-sdk\\servers\\api-doc-generator\\build\\index.js"]
    }
  }
}
```

### Enterprise Deployment

For enterprise-wide deployment, create managed configurations:

**macOS:** `/Library/Application Support/ClaudeCode/managed-mcp.json`

**Windows:** `C:\ProgramData\ClaudeCode\managed-mcp.json`

**Linux:** `/etc/claude-code/managed-mcp.json`

```json
{
  "mcpServers": {
    "api-doc-generator": {
      "type": "stdio",
      "command": "node",
      "args": ["/opt/claude-agent-sdk/servers/api-doc-generator/build/index.js"]
    },
    "security-auditor": {
      "type": "stdio",
      "command": "node",
      "args": ["/opt/claude-agent-sdk/servers/security-auditor/build/index.js"]
    }
  }
}
```

## Troubleshooting

### Server Not Connecting

1. **Check server is built:**
```bash
ls /mnt/d/Dev2/claude-agent-sdk/servers/api-doc-generator/build/index.js
```

2. **Test server manually:**
```bash
node /mnt/d/Dev2/claude-agent-sdk/servers/api-doc-generator/build/index.js
```

3. **Check MCP status in Claude Code:**
```
/mcp
```

4. **View Claude Code logs** for error messages

### Tools Not Showing Up

1. **Restart Claude Code** after adding servers
2. **Verify configuration:**
```bash
claude mcp list
```

3. **Check for typos** in server names or paths

### Permission Issues

Make sure Node.js and the built files have execute permissions:

```bash
chmod +x /mnt/d/Dev2/claude-agent-sdk/servers/*/build/index.js
```

## Best Practices

1. **Use project-level `.mcp.json`** for team collaboration
2. **Use environment variables** for sensitive data and paths
3. **Commit `.mcp.json`** to version control
4. **Document custom servers** in project README
5. **Keep servers updated** - rebuild after pulling changes:
   ```bash
   cd /mnt/d/Dev2/claude-agent-sdk
   git pull
   npm run build
   ```

## Available Tools by Server

### API Documentation Generator
- `extract_endpoints` - Discover API endpoints
- `generate_openapi` - Create OpenAPI 3.0 spec
- `generate_markdown_docs` - Create Markdown docs
- `document_api` - Complete workflow (recommended)

### Integration Test Generator
- `preview_test_plan` - See test plan summary
- `analyze_api` - Get detailed test cases
- `generate_integration_tests` - Generate tests for one framework
- `generate_all_test_frameworks` - Generate tests for all frameworks

### Security Auditor
- `scan_project` - Scan entire project
- `scan_file` - Scan specific file
- `scan_directory` - Scan specific directory
- `check_vulnerability_type` - Check specific vulnerability

### Project Scaffolder
- `list_templates` - Show available templates
- `scaffold_project` - Create new project
- `get_template_info` - Get template details

### README Generator
- `analyze_project` - Analyze project structure
- `generate_readme` - Create README.md
- `update_readme_section` - Update specific section

### Dependency Updater
- `check_dependencies` - List outdated dependencies
- `update_dependencies` - Update dependencies
- `get_security_advisories` - Check for security issues

## Next Steps

1. **Build the servers** you need
2. **Add them to Claude Code** using CLI or `.mcp.json`
3. **Start using them** in your development workflow
4. **Share `.mcp.json`** with your team

For more information, see individual server README files:
- [API Documentation Generator](servers/api-doc-generator/README.md)
- [Integration Test Generator](servers/integration-test-generator/README.md)
- [Security Auditor](servers/security-auditor/README.md)
- [Project Scaffolder](servers/project-scaffolder/README.md)
- [README Generator](servers/readme-generator/README.md)
- [Dependency Updater](servers/dependency-updater/README.md)
