# Project Scaffolder MCP Server

**Priority:** 1800 (High)
**ROI:** $42,000/year
**Status:** Week 2 Development

## Overview

Template-based project scaffolding for TypeScript, .NET, and Python projects. Accelerates new project setup with pre-configured best practices.

## Features

### Supported Project Types

1. **TypeScript Express API** - REST API with TypeScript + Express
2. **TypeScript Next.js** - Full-stack Next.js application
3. **.NET Web API** - ASP.NET Core Web API with Entity Framework
4. **Python FastAPI** - FastAPI REST API with SQLAlchemy
5. **Vue 3 Frontend** - Vue 3 + TypeScript + Vite
6. **React Frontend** - React + TypeScript + Vite

### Included in All Templates

- ✅ `.gitignore` - Language-specific ignore patterns
- ✅ `README.md` - Project documentation template
- ✅ `LICENSE` - MIT license
- ✅ `.env.template` - Environment variable template
- ✅ `docker-compose.yml` - Local development setup
- ✅ `Dockerfile` - Production-ready container
- ✅ CI/CD configuration - GitHub Actions workflows
- ✅ Linting & formatting - ESLint/Prettier or Ruff/Black
- ✅ Testing setup - Jest/Vitest or Pytest
- ✅ Security scanning - Dependency audit scripts

## MCP Tools

### `scaffold_project`

Creates a new project from a template.

**Parameters:**
- `projectName` (string) - Name of the project
- `template` (enum) - Project template to use
- `outputPath` (string) - Directory where project will be created
- `options` (object, optional) - Template-specific options

**Returns:**
- Project path
- Files created
- Next steps for the user

**Example:**
```typescript
await scaffoldProject({
  projectName: 'my-api',
  template: 'typescript-express',
  outputPath: '/path/to/projects',
  options: {
    database: 'postgresql',
    authentication: 'jwt',
    includeDocker: true,
  },
});
```

### `list_templates`

Lists all available project templates with descriptions.

**Returns:**
- Array of templates with metadata

### `customize_template`

Allows custom template variables to be set.

**Parameters:**
- `template` (string) - Template name
- `variables` (object) - Key-value pairs for template customization

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

## Template Structure

Each template follows this structure:

```
templates/
├── typescript-express/
│   ├── template.json         # Template metadata
│   ├── files/                # Template files
│   │   ├── src/
│   │   ├── tests/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── .gitignore
│   │   ├── README.md
│   │   ├── Dockerfile
│   │   └── docker-compose.yml
│   └── prompts.json          # Interactive prompts for options
```

## Template Variables

Templates support variable substitution using `{{variableName}}`:

```json
{
  "name": "{{projectName}}",
  "version": "1.0.0",
  "description": "{{projectDescription}}",
  "author": "{{authorName}}"
}
```

## Adding New Templates

1. Create directory in `src/templates/[template-name]/`
2. Add `template.json` with metadata
3. Add template files in `files/` subdirectory
4. Register template in `src/templates/index.ts`
5. Add tests in `tests/templates/[template-name].test.ts`

## Token Efficiency

**Traditional Approach:**
- Agent reads all template files (10-15 files × 100-500 lines)
- Token cost: 50K-100K tokens
- Manual file creation and git initialization

**Code Execution Approach:**
- Agent calls `scaffold_project` tool (single function call)
- Token cost: 500-1000 tokens
- **Savings: 98-99% token reduction**

## Integration with Claude Code

```typescript
// Claude Code workflow
import { scaffoldProject } from './servers/project-scaffolder';

// User: "Create a new Express API called user-service"
const result = await scaffoldProject({
  projectName: 'user-service',
  template: 'typescript-express',
  outputPath: process.cwd(),
  options: {
    database: 'postgresql',
    authentication: 'jwt',
  },
});

console.log(`Created project at: ${result.projectPath}`);
console.log(`Next steps:\n${result.nextSteps.join('\n')}`);
```

## License

MIT
