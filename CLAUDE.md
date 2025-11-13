# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 📋 Project Plan

**Primary Reference:** [PROJECT-PLAN.md](./PROJECT-PLAN.md)
**Current Phase:** Phase 2 - Production Hardening & Expansion (Week 1)
**Phase 2 Plan:** [PHASE-2-PLAN.md](./PHASE-2-PLAN.md)
**Progress Summary:** [SESSION-SUMMARY.md](./SESSION-SUMMARY.md)

**Quick Status:**
- ✅ Phase 1 Complete: 4 MCP servers, 7 templates, $134K/year ROI, 8.5 hours invested
- 📋 Phase 2 Current: Adding tests, CLI interfaces, 4 new servers
- 🎯 Goal: $176K/year ROI, 8 production-ready servers

## Project Overview

**Claude Agent MCP Skills** is a collection of production-ready MCP (Model Context Protocol) servers and skills for the Claude Agent SDK. The project focuses on **98.7% token reduction** through code execution patterns and **TOON (Token-Optimized Output Notation)**, with implementations targeting TypeScript, C#, and Python projects.

**Core Value Proposition:**
- Token-efficient code execution patterns (98.7% reduction for schema operations)
- TOON format for additional 20-30% optimization
- Progressive disclosure architecture (50-100 tokens per tool vs 50K-150K traditional)
- Smart web search with 88.7% average token optimization (needs fix - in servers-broken/)
- $176,000/year projected productivity savings across 200-project portfolio (Phase 2 target)

## Repository Structure

```
claude-agent-sdk/
├── servers/               # MCP servers for code execution
│   └── security-auditor/  # OWASP Top 10 scanner (Week 1 deliverable)
├── servers-broken/        # Legacy implementations (do not use)
│   ├── sql-server/       # Broken SQL Server MCP
│   └── web-search/       # Broken web search (Python venv issues)
├── skills/               # Standalone skills
│   └── project-analyzer/ # Tech stack analyzer for 200 projects
├── docs/                 # Comprehensive documentation
└── examples/             # Example workflows
```

**IMPORTANT:** Only work in `servers/` and `skills/`. The `servers-broken/` directory contains non-functional legacy code that had dependency issues.

## Technology Stack

### Primary Technologies
- **TypeScript 5.0+** - All MCP servers use ES2022 modules
- **@anthropic-ai/claude-agent-sdk 0.1.37** - Core agent framework
- **@modelcontextprotocol/sdk 1.7.0** - MCP protocol implementation
- **Zod 3.24+** - Schema validation for MCP tools
- **tsx** - TypeScript execution for development

### Key Dependencies
- `mssql` - SQL Server connectivity (not currently installed in root)
- `glob` - File pattern matching for scanners
- Python 3.12+ with venv for web search (in servers-broken, not currently functional)

## Common Development Commands

### Building & Running

```bash
# Security Auditor MCP Server (Week 1 deliverable)
cd servers/security-auditor
npm install
npm run build           # Compile TypeScript to dist/
npm run dev            # Run with tsx (development)
npm run scan /path     # CLI scan

# Project Analyzer Skill
cd skills/project-analyzer
npm install
npx tsx index.ts       # Analyze all projects in /mnt/d/dev2
cat results/ANALYSIS-SUMMARY.md
```

### Testing

```bash
# Security Auditor
cd servers/security-auditor
npm test               # Run Jest tests

# Manual testing single file scan
npx tsx src/cli.ts scan-file /path/to/file.ts
```

### Development Workflow

```bash
# Run TypeScript directly without building
npx tsx src/index.ts

# Build and check types
npm run build

# Watch mode for development
npx tsx watch src/index.ts
```

## Architecture Patterns

### MCP Server Pattern

All MCP servers follow this structure:

```typescript
// src/index.ts - MCP server entry point
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({
  name: 'server-name',
  version: '0.1.0',
});

// Define tools with Zod schemas
server.tool(
  'tool_name',
  {
    param1: z.string().describe('Parameter description'),
    param2: z.number().optional().describe('Optional parameter'),
  },
  async ({ param1, param2 }) => {
    // Tool implementation
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// Start server on stdio
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Server running on stdio'); // Use stderr for logging
}
```

**Key Points:**
- Use ES2022 modules with `.js` imports (even for TypeScript files)
- All logging must use `console.error()` (stdout is reserved for MCP protocol)
- Return results as JSON strings in `content` array
- Use Zod for parameter validation and type inference

### Scanner Pattern (Security Auditor)

```typescript
// src/scanners/scanner-name.ts
import { Scanner, Finding, Pattern } from '../types.js';

export class LanguageScanner implements Scanner {
  name = 'language-scanner';
  fileExtensions = ['.ext1', '.ext2'];

  private patterns: Pattern[] = [
    {
      regex: /dangerous pattern/g,
      type: 'vulnerability-type',
      severity: 'critical',
      message: 'Description of issue',
      recommendation: 'How to fix',
      cwe: 'CWE-XXX',
      owasp: 'A0X:2021 – Category',
    },
  ];

  scan(filePath: string, content: string): Finding[] {
    const findings: Finding[] = [];
    // Pattern matching implementation
    return findings;
  }
}
```

### TypeScript Configuration

Each MCP server has its own `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## Security Auditor Implementation (Week 1 Focus)

### Current Status
- ✅ MCP server structure complete
- ✅ Type definitions complete
- ✅ Scanner implementations for TypeScript, C#, Python
- ✅ CLI interface
- ✅ Report generation patterns
- 🚧 Testing and validation in progress

### Vulnerability Detection Patterns

**SQL Injection (TypeScript/JavaScript):**
- String concatenation: `` `SELECT * FROM users WHERE id = ${id}` ``
- Template literals with user input
- Non-parameterized queries

**XSS (React/Vue):**
- `dangerouslySetInnerHTML` in React
- `v-html` in Vue
- Direct DOM manipulation with `innerHTML`

**Hardcoded Secrets:**
- API keys: `sk-`, `pk_`, `Bearer`
- Password patterns: `password`, `passwd`, `pwd`
- JWT secrets and connection strings

**Insecure Crypto (C#/Python):**
- MD5, SHA1 hashing algorithms
- DES, 3DES encryption
- Weak bcrypt rounds (<12)

**CORS Misconfiguration:**
- Wildcard origins: `Access-Control-Allow-Origin: *`
- Credentials with wildcard

**Weak Authentication:**
- Hardcoded JWT secrets
- Missing httpOnly/secure flags on cookies
- Weak bcrypt rounds

### Adding New Detection Patterns

1. Add pattern to appropriate scanner (`src/scanners/*.ts`)
2. Define vulnerability type in `src/types.ts` if new
3. Add recommendation to `src/index.ts` `get_recommendations` tool
4. Add test fixtures in `tests/fixtures/`
5. Update README.md with examples

## Progressive Disclosure Architecture

The project follows a **progressive tool loading** pattern:

```typescript
// Agent discovers tools by reading filesystem (50-100 tokens)
const servers = await fs.readdir('./servers');
// ['security-auditor']

// Agent reads specific tool signature (100-200 tokens)
const toolCode = await fs.readFile('./servers/security-auditor/src/index.ts');
// Parse JSDoc to understand tool parameters

// Agent imports and uses tool (minimal context)
import { scanProject } from './servers/security-auditor';
const report = await scanProject({ projectPath: '/path' });
```

**Benefits:**
- 50-100 tokens per tool discovery vs 500-1000 tokens traditional tool definitions
- Tools loaded on-demand based on agent needs
- Reduces context window pressure for large tool catalogs

## Project Analyzer Skill

Analyzes 200 projects to identify high-priority skills to build:

```typescript
// Scan directories
const rootDirs = ['/mnt/d/dev2', '/mnt/d/dev2/clients', '/mnt/d/dev2/michaeljr'];

// Detect tech stack
- TypeScript/JavaScript (package.json)
- C# (.csproj, .sln files)
- Python (requirements.txt, pyproject.toml)

// Identify missing capabilities
- No README → recommend readme-generator
- No tests → recommend test-generator
- Old dependencies → recommend dependency-updater

// Aggregate by priority: Project Count × Utility Score
```

**7-day caching** prevents re-analyzing unchanged projects.

## Token Optimization Strategies

### 1. Code Execution Pattern (98.7% reduction)

**Traditional:** Claude reads entire 1000-table schema (500K-1M tokens)
**Code Execution:** Tool returns 5K-10K token summary

### 2. Progressive Discovery (95% reduction)

**Traditional:** 150 tools × 1000 tokens = 150K tokens loaded upfront
**Progressive:** Load 3-5 tools as needed = 300-500 tokens

### 3. Structured Output (20-30% reduction)

Use TOML/JSON over verbose text formats

## Documentation

**Primary Docs (all in `docs/`):**
- **INTEGRATION-BENEFITS.md** - Cost-benefit analysis, ROI calculations ($156K/year savings)
- **QUICK-START.md** - 30-minute tutorial for building first MCP server
- **SKILLS-IMPLEMENTATION-PLAN.md** - 16-week roadmap for 28 skills
- **STATUS-UPDATE.md** - Current implementation status
- **BIBLIOGRAPHY.md** - Curated resources (30+ links)

**Server-Specific:**
- `servers/security-auditor/README.md` - Security scanner guide
- `skills/project-analyzer/README.md` - Tech stack analyzer guide

## Environment & Dependencies

### SQL Server Connections
- Connection pattern: `Server=host,port;Database=db;User Id=user;Password=pass;TrustServerCertificate=True`
- **Critical:** Use `Connection Timeout` (with space), NOT `ConnectTimeout` (no space) - Microsoft.Data.SqlClient 5.2+ requirement
- Use `Encrypt=Optional` for named instances
- Store passwords in environment variables, never in config.json

### Python Environment (servers-broken only)
- Modern Ubuntu/Debian blocks system-wide pip (PEP 668)
- All Python tools must use virtual environments
- Pattern: `setup.sh` creates venv, `run-*.sh` activates and executes

## ROI & Impact Metrics

**Token Efficiency:**
| Workflow | Traditional | Code Execution | Savings |
|----------|-------------|----------------|---------|
| Extract 1000-table schema | 500K-1M | 5K-10K | 98.7% |
| Generate 44 unit tests | 150K | 10K-15K | 90-93% |
| Web search with parsing | 5K | 560 | 88.9% |

**Cost Savings (200-project portfolio):**
- Security auditing: $40,000/year automated
- Documentation: $28,000/year automated
- Test generation: $18,000/year automated
- **Total: $156,000/year savings**

## Current Focus: Security Auditor (Week 1)

### Deliverable Checklist
- [x] MCP server structure with 3 tools (scan_project, scan_file, get_recommendations)
- [x] Type definitions (Finding, SecurityReport, Pattern, Scanner)
- [x] 4 scanner implementations (TypeScript, C#, Python, Common)
- [x] CLI interface for standalone usage
- [ ] Jest test suite with fixtures
- [ ] Integration with project analyzer
- [ ] Week 1 summary document

### Testing Approach
1. Create fixtures in `tests/fixtures/` with known vulnerabilities
2. Run scanner against fixtures
3. Verify all expected vulnerabilities detected
4. Verify no false positives
5. Test severity classification accuracy

## Best Practices

1. **ES Modules:** Always use `.js` extensions in imports, even for TypeScript
2. **Logging:** Use `console.error()` for all logging in MCP servers (stdout is protocol)
3. **Type Safety:** Define Zod schemas for all MCP tool parameters
4. **Error Handling:** Wrap tool implementations in try/catch, return helpful error messages
5. **Documentation:** JSDoc comments for all exported functions and types
6. **Progressive Disclosure:** Keep tool signatures small (50-100 tokens) for agent discovery
7. **Secrets:** Never commit connection strings, API keys, or passwords
8. **Testing:** Test tools independently before MCP integration

## Common Issues

### Issue: "Cannot find module" errors with .js imports
**Cause:** TypeScript expects `.ts` extensions, but ES modules require `.js`
**Solution:** Import with `.js` extension: `import { x } from './file.js'`

### Issue: MCP server not responding
**Cause:** Logging to stdout interferes with protocol
**Solution:** Use `console.error()` for all logging, never `console.log()`

### Issue: Zod validation errors
**Cause:** Parameter types don't match schema
**Solution:** Check tool invocation matches exact schema definition

### Issue: Virtual environment externally-managed error (Python)
**Cause:** Modern Linux prevents system-wide pip installs (PEP 668)
**Solution:** Always use venv: `python3 -m venv venv && source venv/bin/activate`

## Related Projects

**Unit Test Generator:**
- Location: `/mnt/d/dev2/dotnet-unit-test-gen`
- Self-learning pattern discovery with LangChain 1.0
- $2.23 cost for 44 test files, 30-40% error reduction

**SQL Extract:**
- Location: `/mnt/d/dev2/dbbuilder/SQLExtract`
- Extracts 1000+ tables in <30 seconds
- Intelligent dependency ordering with topological sort

Both can be integrated as MCP servers using patterns from this project.
