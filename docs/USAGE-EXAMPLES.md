# Usage Examples

Comprehensive examples for all 10 MCP servers in the Claude Agent SDK.

---

## Table of Contents

1. [API Documentation Generator](#api-documentation-generator)
2. [Integration Test Generator](#integration-test-generator)
3. [Security Auditor](#security-auditor)
4. [Project Scaffolder](#project-scaffolder)
5. [README Generator](#readme-generator)
6. [Dependency Updater](#dependency-updater)
7. [Docker Config Generator](#docker-config-generator)
8. [Config Template Generator](#config-template-generator)
9. [Performance Profiler](#performance-profiler)
10. [Code Migration Assistant](#code-migration-assistant)

---

## API Documentation Generator

Generate OpenAPI specifications and Markdown documentation from your API endpoints.

### Basic Usage

```bash
# In Claude Code
Use the api-doc-generator to create documentation for /path/to/my-api

# Direct invocation
node servers/api-doc-generator/build/index.js
```

### Available Tools

#### `generate_api_docs`

Generate OpenAPI spec and Markdown documentation.

```json
{
  "projectPath": "/path/to/project",
  "outputDir": "./docs/api",
  "format": "both",
  "framework": "auto"
}
```

**Supported Frameworks:**
- Express.js
- Fastify
- Koa
- NestJS
- ASP.NET Core
- FastAPI
- Flask
- Django REST

### Example Output

```markdown
# API Documentation

## Endpoints

### GET /api/users
Get all users with optional filtering.

**Query Parameters:**
- `page` (number): Page number for pagination
- `limit` (number): Items per page

**Response:** 200 OK
```json
{
  "users": [...],
  "total": 100
}
```
```

### Real-World Scenario

```
Generate API docs for my Express API at /home/user/ecommerce-api.
Include all routes from the /routes folder and output OpenAPI and Markdown.
```

---

## Integration Test Generator

Generate comprehensive test suites for APIs and services.

### Basic Usage

```bash
# In Claude Code
Generate integration tests for the API at /path/to/my-api

# With specific framework
Generate Jest tests for my Express API in /path/to/project
```

### Available Tools

#### `generate_tests`

Generate test files for API endpoints.

```json
{
  "projectPath": "/path/to/project",
  "outputDir": "./tests/integration",
  "framework": "jest",
  "testFramework": "supertest"
}
```

**Supported Test Frameworks:**
- Jest (JavaScript/TypeScript)
- Mocha
- Pytest (Python)
- xUnit (.NET)

### Example Output

```typescript
// tests/integration/users.test.ts
import request from 'supertest';
import { app } from '../src/app';

describe('GET /api/users', () => {
  it('should return paginated users', async () => {
    const response = await request(app)
      .get('/api/users')
      .query({ page: 1, limit: 10 })
      .expect(200);

    expect(response.body.users).toBeDefined();
    expect(Array.isArray(response.body.users)).toBe(true);
  });

  it('should return 401 without authentication', async () => {
    await request(app)
      .get('/api/users')
      .expect(401);
  });
});
```

### Real-World Scenario

```
Create integration tests for my NestJS API. Generate tests for all
controllers in src/controllers/. Use Jest with supertest and include
authentication test cases.
```

---

## Security Auditor

Scan code for OWASP Top 10 vulnerabilities and security issues.

### Basic Usage

```bash
# In Claude Code
Scan /path/to/my-project for security vulnerabilities

# With specific checks
Run OWASP Top 10 security audit on my Node.js project
```

### Available Tools

#### `audit_security`

Perform comprehensive security audit.

```json
{
  "projectPath": "/path/to/project",
  "checks": ["sql-injection", "xss", "secrets", "auth"],
  "severity": "medium",
  "outputFormat": "sarif"
}
```

**Security Checks:**
- SQL Injection
- Cross-Site Scripting (XSS)
- Hardcoded Secrets
- Insecure Cryptography
- Authentication Issues
- Path Traversal
- Command Injection
- Insecure Deserialization

### Example Output

```json
{
  "summary": {
    "filesScanned": 150,
    "issuesFound": 12,
    "critical": 2,
    "high": 4,
    "medium": 6
  },
  "issues": [
    {
      "severity": "critical",
      "type": "sql-injection",
      "file": "src/db/users.ts",
      "line": 45,
      "code": "db.query(`SELECT * FROM users WHERE id = ${userId}`)",
      "suggestion": "Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [userId])"
    }
  ]
}
```

### Real-World Scenario

```
Perform a security audit on my e-commerce application at /home/user/shop-api.
Focus on SQL injection, XSS, and hardcoded secrets. Generate a SARIF
report for CI/CD integration.
```

---

## Project Scaffolder

Generate new projects from templates with best practices.

### Basic Usage

```bash
# In Claude Code
Scaffold a new Express API project called my-api

# With specific template
Create a new Next.js project with TypeScript and Tailwind
```

### Available Tools

#### `scaffold_project`

Create new project from template.

```json
{
  "projectName": "my-api",
  "template": "express-typescript",
  "outputPath": "/home/user/projects",
  "options": {
    "database": "postgresql",
    "auth": "jwt",
    "testing": "jest"
  }
}
```

**Available Templates:**
- `express-typescript` - Express API with TypeScript
- `nextjs-full` - Next.js with App Router
- `fastapi-python` - FastAPI with SQLAlchemy
- `nestjs-graphql` - NestJS with GraphQL
- `react-vite` - React with Vite and TypeScript

### Example Output

```
my-api/
├── src/
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   └── index.ts
├── tests/
├── docker-compose.yml
├── Dockerfile
├── package.json
├── tsconfig.json
└── README.md
```

### Real-World Scenario

```
Scaffold a new NestJS project called 'inventory-service' with:
- PostgreSQL database connection
- JWT authentication
- Swagger documentation
- Docker configuration
- Jest testing setup
```

---

## README Generator

Automatically generate comprehensive README documentation.

### Basic Usage

```bash
# In Claude Code
Generate a README for my project at /path/to/project

# With badges and sections
Create a detailed README with badges, installation, and API docs
```

### Available Tools

#### `generate_readme`

Generate README from project analysis.

```json
{
  "projectPath": "/path/to/project",
  "sections": ["installation", "usage", "api", "contributing"],
  "badges": ["license", "version", "tests"],
  "outputPath": "./README.md"
}
```

**Available Sections:**
- Title & Description
- Badges
- Installation
- Quick Start
- Usage Examples
- API Reference
- Configuration
- Contributing
- License

### Example Output

```markdown
# My Awesome API

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![npm version](https://badge.fury.io/js/my-api.svg)](https://www.npmjs.com/package/my-api)
[![Tests](https://github.com/user/my-api/workflows/Tests/badge.svg)](https://github.com/user/my-api/actions)

> A high-performance REST API for managing user data

## Installation

```bash
npm install my-api
```

## Quick Start

```typescript
import { createServer } from 'my-api';

const server = createServer({
  port: 3000,
  database: 'postgresql://localhost/mydb'
});

server.listen();
```

## API Reference

### `GET /api/users`
...
```

### Real-World Scenario

```
Generate a comprehensive README for my open-source library at
/home/user/auth-toolkit. Include installation for npm/yarn/pnpm,
usage examples, API documentation, and contribution guidelines.
```

---

## Dependency Updater

Analyze and update project dependencies safely.

### Basic Usage

```bash
# In Claude Code
Check for outdated dependencies in /path/to/project

# Update with testing
Update all dependencies and run tests after each update
```

### Available Tools

#### `check_updates`

Check for available dependency updates.

```json
{
  "projectPath": "/path/to/project",
  "includeDevDependencies": true,
  "checkVulnerabilities": true
}
```

#### `apply_updates`

Apply dependency updates with safety checks.

```json
{
  "projectPath": "/path/to/project",
  "updates": ["lodash", "express"],
  "updateType": "minor",
  "runTests": true,
  "createBackup": true
}
```

### Example Output

```json
{
  "outdated": [
    {
      "name": "lodash",
      "current": "4.17.20",
      "latest": "4.17.21",
      "type": "patch",
      "vulnerable": true
    },
    {
      "name": "express",
      "current": "4.17.0",
      "latest": "4.18.2",
      "type": "minor",
      "breaking": false
    }
  ],
  "vulnerabilities": 3,
  "recommendations": [
    "Update lodash immediately to fix CVE-2021-23337"
  ]
}
```

### Real-World Scenario

```
Check all dependencies in my Node.js project for updates.
Update patch versions automatically, but list minor/major
updates for manual review. Check for security vulnerabilities
and prioritize those updates.
```

---

## Docker Config Generator

Generate Dockerfile and docker-compose configurations.

### Basic Usage

```bash
# In Claude Code
Generate Docker configuration for my Node.js project

# With specific services
Create docker-compose with PostgreSQL and Redis
```

### Available Tools

#### `generate_dockerfile`

Generate optimized Dockerfile.

```json
{
  "projectPath": "/path/to/project",
  "baseImage": "node:20-alpine",
  "multiStage": true,
  "optimize": true
}
```

#### `generate_compose`

Generate docker-compose.yml.

```json
{
  "projectPath": "/path/to/project",
  "services": ["app", "postgres", "redis"],
  "networks": true,
  "volumes": true
}
```

### Example Output

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
USER node
CMD ["node", "build/index.js"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://postgres:postgres@db:5432/app
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: app
      POSTGRES_PASSWORD: postgres

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

### Real-World Scenario

```
Generate Docker configuration for my Python FastAPI application.
Include:
- Multi-stage Dockerfile with Poetry for dependencies
- docker-compose with PostgreSQL, Redis, and Nginx
- Health checks for all services
- Production-ready security settings
```

---

## Config Template Generator

Generate environment templates and configuration files.

### Basic Usage

```bash
# In Claude Code
Generate .env template for my project

# With documentation
Create config template with descriptions for all variables
```

### Available Tools

#### `generate_config_template`

Generate configuration templates.

```json
{
  "projectPath": "/path/to/project",
  "format": "env",
  "includeDescriptions": true,
  "categorize": true
}
```

**Output Formats:**
- `.env` - Environment variables
- `.json` - JSON configuration
- `.yaml` - YAML configuration
- `.toml` - TOML configuration

### Example Output

```bash
# .env.template

# ===================
# Database
# ===================
# PostgreSQL connection string
DATABASE_URL=postgresql://user:password@localhost:5432/dbname
# Maximum connections in pool
DATABASE_POOL_SIZE=10

# ===================
# Authentication
# ===================
# JWT secret key (min 32 characters)
JWT_SECRET=your-secret-key-here
# Token expiration in seconds
JWT_EXPIRATION=3600

# ===================
# External Services
# ===================
# Stripe API key for payments
STRIPE_API_KEY=sk_test_xxx
# SendGrid API key for emails
SENDGRID_API_KEY=SG.xxx

# ===================
# Application
# ===================
# Server port (default: 3000)
PORT=3000
# Node environment
NODE_ENV=development
```

### Real-World Scenario

```
Analyze my Express application and generate a complete .env.template file.
Discover all environment variables used across the codebase, categorize them
(database, auth, services, etc.), and add descriptions explaining each one.
```

---

## Performance Profiler

Analyze code for performance issues and optimization opportunities.

### Basic Usage

```bash
# In Claude Code
Analyze performance issues in my project at /path/to/project

# Generate report
Create a performance report for my Node.js application
```

### Available Tools

#### `analyze_performance`

Scan code for performance anti-patterns.

```json
{
  "projectPath": "/path/to/project",
  "fileTypes": ["ts", "js", "tsx", "jsx"],
  "includeTests": false,
  "maxFiles": 500
}
```

#### `generate_performance_report`

Generate detailed performance report.

```json
{
  "projectPath": "/path/to/project",
  "format": "markdown",
  "outputPath": "./performance-report.md"
}
```

**Detected Issues:**
- N+1 Query Patterns
- Synchronous I/O Operations
- Memory Leaks (event listeners, globals)
- Inefficient Regex
- Missing Caching
- Blocking Calls
- Large Payload Responses
- Unnecessary React Re-renders

### Example Output

```markdown
# Performance Analysis Report

## Summary
- **Files Analyzed**: 150
- **Issues Found**: 23

### By Severity
- critical: 2
- high: 8
- medium: 10
- low: 3

## Recommendations
- Consider refactoring synchronous I/O operations to use async/await
- Review database queries for N+1 patterns; use batch queries
- Use React.memo, useMemo, and useCallback to optimize rendering

## Issues

### High Severity

#### sync-io
**File**: `src/utils/config.ts:45`
**Code**: `const config = fs.readFileSync('./config.json', 'utf-8')`
**Suggestion**: Use async version (readFile with await) to avoid blocking
**Impact**: Blocking operations can cause latency spikes
```

### Real-World Scenario

```
Analyze my React application for performance issues. Check for unnecessary
re-renders, inline functions in JSX, and missing memoization. Also check
the Node.js backend for N+1 queries and sync I/O. Generate an HTML report
for the team.
```

---

## Code Migration Assistant

Help migrate code between framework versions with auto-fixes.

### Basic Usage

```bash
# In Claude Code
Analyze my React project for migration to React 18

# Apply fixes
Migrate my Next.js app from version 12 to 14
```

### Available Tools

#### `analyze_migration`

Analyze project for migration issues.

```json
{
  "projectPath": "/path/to/project",
  "framework": "react",
  "fromVersion": "17.0.0",
  "toVersion": "18.0.0"
}
```

#### `generate_migration_report`

Generate detailed migration report.

```json
{
  "projectPath": "/path/to/project",
  "toVersion": "18.0.0",
  "format": "markdown",
  "outputPath": "./migration-report.md"
}
```

#### `apply_migration_fixes`

Apply auto-fixable migration changes.

```json
{
  "projectPath": "/path/to/project",
  "dryRun": true,
  "backup": true
}
```

**Supported Frameworks:**
- React (16 → 17 → 18)
- Next.js (12 → 13 → 14)
- Vue (2 → 3)
- Angular (version migrations)
- TypeScript (version migrations)

### Example Output

```markdown
# Migration Analysis Report

**Migration**: react 17.0.0 → 18.0.0

## Summary
- **Files Analyzed**: 200
- **Issues Found**: 15
- **Auto-fixable**: 8

### By Severity
- 🔴 breaking: 5
- 🟠 error: 3
- 🟡 warning: 7

## Recommendations
- Address 5 breaking changes before upgrading
- 8 issues can be auto-fixed

## Issues

### Breaking

#### breaking-change
**File**: `src/index.tsx:12`
**Description**: ReactDOM.render is deprecated in React 18
**Code**: `ReactDOM.render(<App />, document.getElementById('root'))`
**Suggestion**: Use createRoot from react-dom/client instead

---

#### deprecated-api
**File**: `src/components/User.tsx:45`
**Description**: String refs are deprecated
**Code**: `ref="userInput"`
**Suggestion**: Use callback refs or useRef hook
```

### Real-World Scenario

```
I need to migrate my Next.js 12 application to Next.js 14. Analyze the
codebase for breaking changes, especially:
- Page Router to App Router migration
- Image component changes
- Link component updates
- Data fetching method changes

Generate a report and apply any auto-fixable changes with backup.
```

---

## CLI Usage

All servers can be accessed via the CLI:

```bash
# List all available servers
npx claude-agent-sdk list

# Get info about a specific server
npx claude-agent-sdk info api-doc-generator

# Run a server directly
npx claude-agent-sdk run api-doc-generator

# Check server status
npx claude-agent-sdk status
```

## Troubleshooting

### Common Issues

#### Server Not Found
```bash
# Ensure the server is built
cd servers/api-doc-generator
npm run build
```

#### Permission Denied
```bash
# Make the CLI executable
chmod +x cli/build/index.js
```

#### Module Not Found
```bash
# Install dependencies
npm install
npm run build
```

### Debug Mode

Enable verbose logging:
```bash
DEBUG=mcp:* node servers/api-doc-generator/build/index.js
```

### Getting Help

- Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed solutions
- Open an issue on [GitHub](https://github.com/dbbuilder/claude-agent-sdk/issues)
- Join the discussion in [GitHub Discussions](https://github.com/dbbuilder/claude-agent-sdk/discussions)

---

## Next Steps

1. **Try the examples** - Start with the server that matches your immediate needs
2. **Check the API** - Each server has detailed tool schemas for all options
3. **Contribute** - Found a bug or have an improvement? PRs welcome!

---

*Last updated: 2025-11-18*
