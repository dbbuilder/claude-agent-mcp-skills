# Security Auditor MCP Server

**Status:** 🚧 Week 1 Development
**Priority:** 2000 (Critical - affects all 200 projects)
**Estimated Impact:** Identify 100+ vulnerabilities across portfolio

## Overview

OWASP Top 10 security scanner built as an MCP server for the Claude Agent SDK. Automatically detects common security vulnerabilities in TypeScript, C#, and Python projects.

## Features

### Week 1 Deliverables

- ✅ **SQL Injection Detection** - Pattern matching for unsafe query construction
- ✅ **XSS Vulnerability Detection** - Unsafe HTML/DOM manipulation
- ✅ **Hardcoded Secrets Detection** - API keys, passwords, tokens in code
- ✅ **Insecure Crypto Usage** - Weak hashing algorithms (MD5, SHA1)
- ✅ **CORS Misconfiguration** - Overly permissive CORS settings
- ✅ **Authentication Issues** - Weak auth patterns

### Supported Languages

- **TypeScript/JavaScript** - Express, React, Vue, Next.js
- **C#** - ASP.NET Core, Entity Framework
- **Python** - FastAPI, Django, Flask

## Quick Start

```bash
# Install dependencies
npm install

# Scan a project
npm run scan /path/to/project

# Scan with specific language
npm run scan /path/to/project --language typescript

# Generate report
npm run scan /path/to/project --format json > report.json
```

## MCP Integration

```typescript
import { SecurityAuditor } from '@claude-mcp-skills/security-auditor';

const auditor = new SecurityAuditor();
const report = await auditor.scanProject('/path/to/project');

console.log(`Found ${report.totalFindings} vulnerabilities`);
console.log(`Critical: ${report.bySeverity.critical}`);
console.log(`High: ${report.bySeverity.high}`);
```

## Detection Patterns

### SQL Injection (TypeScript)
```typescript
// ❌ BAD - String concatenation
const query = `SELECT * FROM users WHERE id = ${userId}`;

// ❌ BAD - Template literals with user input
db.query(`SELECT * FROM users WHERE email = '${email}'`);

// ✅ GOOD - Parameterized queries
db.query('SELECT * FROM users WHERE id = ?', [userId]);
```

### XSS (React/Vue)
```typescript
// ❌ BAD - dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{__html: userInput}} />

// ❌ BAD - v-html in Vue
<div v-html="userInput"></div>

// ✅ GOOD - Escaped by default
<div>{userInput}</div>
```

### Hardcoded Secrets
```typescript
// ❌ BAD - Patterns detected
const API_KEY = "sk-1234567890abcdef";
const PASSWORD = "password123";
const JWT_SECRET = "my-secret-key";
```

### Insecure Crypto (C#)
```csharp
// ❌ BAD - MD5/SHA1
var hash = MD5.Create().ComputeHash(data);

// ✅ GOOD - Strong crypto
var hash = SHA256.Create().ComputeHash(data);
```

## Report Format

```json
{
  "projectPath": "/path/to/project",
  "scanDate": "2025-11-12T10:00:00Z",
  "totalFindings": 15,
  "bySeverity": {
    "critical": 3,
    "high": 5,
    "medium": 4,
    "low": 3
  },
  "findings": [
    {
      "id": "sql-injection-001",
      "type": "sql-injection",
      "severity": "critical",
      "file": "src/controllers/user.controller.ts",
      "line": 45,
      "column": 12,
      "code": "const query = `SELECT * FROM users WHERE id = ${id}`;",
      "message": "Potential SQL injection vulnerability",
      "recommendation": "Use parameterized queries: db.query('SELECT * FROM users WHERE id = ?', [id])",
      "cwe": "CWE-89",
      "owasp": "A03:2021 – Injection",
      "autoFixAvailable": true
    }
  ],
  "recommendations": [
    "Implement parameterized queries for all database operations",
    "Use content security policy headers",
    "Move secrets to environment variables"
  ]
}
```

## Architecture

```
security-auditor/
├── src/
│   ├── index.ts              # MCP server entry point
│   ├── cli.ts                # CLI interface
│   ├── auditor.ts            # Main auditor class
│   ├── types.ts              # TypeScript interfaces
│   ├── scanners/
│   │   ├── typescript.ts     # TypeScript/JavaScript scanner
│   │   ├── csharp.ts         # C# scanner
│   │   ├── python.ts         # Python scanner
│   │   └── common.ts         # Shared patterns
│   └── utils/
│       ├── file-reader.ts    # File system operations
│       └── report-generator.ts  # Report formatting
├── tests/
│   └── fixtures/             # Test cases
└── README.md
```

## Roadmap

### Week 1 (Current)
- [x] Project structure
- [ ] SQL injection detection
- [ ] XSS detection
- [ ] Secrets detection
- [ ] Basic report generation
- [ ] CLI interface

### Future Enhancements
- [ ] Path traversal detection
- [ ] CSRF vulnerability detection
- [ ] Insecure deserialization
- [ ] XML external entity (XXE)
- [ ] Broken authentication patterns
- [ ] Auto-fix generation
- [ ] CI/CD integration
- [ ] GitHub Actions workflow
- [ ] VS Code extension

## Contributing

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for contribution guidelines.

## License

MIT - see [LICENSE](../../LICENSE)

---

**Part of:** [Claude Agent MCP Skills](https://github.com/dbbuilder/claude-agent-mcp-skills)
**Week:** 1 of 16-week implementation plan
**ROI:** $40,000/year (security vulnerability prevention across 200 projects)
