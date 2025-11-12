# Quick Start Guide: Claude Agent SDK + MCP Code Execution

Get started with your first AI agent in under 30 minutes.

## Prerequisites

✅ Already completed:
- Node.js installed
- `@anthropic-ai/claude-agent-sdk@0.1.37` installed
- Project structure created at `/mnt/d/dev2/claude-agent-sdk`

## Step 1: Set Up Environment (5 minutes)

### Add API Key

```bash
# Add to ~/.bashrc (or ~/.zshrc if using zsh)
export ANTHROPIC_API_KEY="your-api-key-here"

# Reload shell
source ~/.bashrc
```

### Verify Installation

```bash
cd /mnt/d/dev2/claude-agent-sdk
npm list @anthropic-ai/claude-agent-sdk
# Should show: @anthropic-ai/claude-agent-sdk@0.1.37
```

## Step 2: Create Your First Agent (10 minutes)

### Basic Agent Example

Create `test-agent.ts`:

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

async function main() {
  const agent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  console.log('Querying agent...');

  const result = await agent.query(
    'List all TypeScript files in the current directory and count them'
  );

  // The agent will use file system tools automatically
  for await (const message of result) {
    if (message.type === 'text') {
      console.log(message.content);
    }
  }
}

main().catch(console.error);
```

### Install TypeScript Execution

```bash
npm install -D tsx typescript
```

### Run Your First Agent

```bash
npx tsx test-agent.ts
```

Expected output:
```
Querying agent...
I found X TypeScript files in the current directory:
- test-agent.ts
- (any other .ts files)

Total: X files
```

## Step 3: Create a Reusable Skill (10 minutes)

### Skill: Scan TODO Comments

Create `skills/scan-todos.ts`:

```typescript
/**
 * SKILL: Scan TODO Comments
 * Searches a project for TODO comments and categorizes them
 */

import { readFile } from 'fs/promises';
import { glob } from 'glob';

export interface TodoItem {
  file: string;
  line: number;
  text: string;
  priority: 'high' | 'medium' | 'low';
}

export async function scanTodos(projectPath: string): Promise<{
  total: number;
  byPriority: Record<string, TodoItem[]>;
  files: string[];
}> {
  // Find all source files
  const patterns = [
    '**/*.ts',
    '**/*.tsx',
    '**/*.js',
    '**/*.jsx',
    '**/*.cs',
    '**/*.sql'
  ];

  const files: string[] = [];
  for (const pattern of patterns) {
    const matches = await glob(`${projectPath}/${pattern}`, {
      ignore: ['**/node_modules/**', '**/bin/**', '**/obj/**']
    });
    files.push(...matches);
  }

  const todos: TodoItem[] = [];

  // Scan each file
  for (const file of files) {
    const content = await readFile(file, 'utf-8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (line.includes('TODO')) {
        const priority = determinePriority(line);
        todos.push({
          file,
          line: index + 1,
          text: line.trim(),
          priority
        });
      }
    });
  }

  // Categorize by priority
  const byPriority = {
    high: todos.filter(t => t.priority === 'high'),
    medium: todos.filter(t => t.priority === 'medium'),
    low: todos.filter(t => t.priority === 'low')
  };

  return {
    total: todos.length,
    byPriority,
    files: [...new Set(todos.map(t => t.file))]
  };
}

function determinePriority(line: string): 'high' | 'medium' | 'low' {
  const text = line.toLowerCase();
  if (text.includes('urgent') || text.includes('critical') || text.includes('!!!')) {
    return 'high';
  }
  if (text.includes('important') || text.includes('!!')) {
    return 'medium';
  }
  return 'low';
}
```

### Install Required Dependencies

```bash
npm install glob
npm install -D @types/glob
```

### Test the Skill

Create `test-skill.ts`:

```typescript
import { scanTodos } from './skills/scan-todos';

async function main() {
  const result = await scanTodos('/mnt/d/dev2/fireproof');

  console.log(`Found ${result.total} TODOs across ${result.files.length} files`);
  console.log(`\nBy priority:`);
  console.log(`  High: ${result.byPriority.high.length}`);
  console.log(`  Medium: ${result.byPriority.medium.length}`);
  console.log(`  Low: ${result.byPriority.low.length}`);

  console.log(`\nHigh priority TODOs:`);
  result.byPriority.high.slice(0, 5).forEach(todo => {
    console.log(`  ${todo.file}:${todo.line}`);
    console.log(`    ${todo.text}`);
  });
}

main().catch(console.error);
```

```bash
npx tsx test-skill.ts
```

## Step 4: Use the Skill with an Agent (5 minutes)

Create `agent-with-skill.ts`:

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';
import { scanTodos } from './skills/scan-todos';

async function main() {
  const agent = new Agent({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // First, use the skill directly (code execution)
  console.log('Scanning FireProof project for TODOs...');
  const todos = await scanTodos('/mnt/d/dev2/fireproof');

  // Then, let the agent analyze the results
  console.log('\nAsking agent to prioritize TODOs...');

  const result = await agent.query(`
    I have scanned a project and found ${todos.total} TODO items.
    Here are the high-priority ones:

    ${JSON.stringify(todos.byPriority.high.slice(0, 10), null, 2)}

    Please:
    1. Analyze these TODOs
    2. Suggest which should be tackled first
    3. Group related TODOs together
  `);

  for await (const message of result) {
    if (message.type === 'text') {
      console.log(message.content);
    }
  }
}

main().catch(console.error);
```

Run it:
```bash
npx tsx agent-with-skill.ts
```

**Key Insight:** The skill processes all files locally (no tokens used), then only the summary goes to the agent for analysis. This is the power of code execution!

## Step 5: Create Your First Project-Specific Skill

### Example: FireProof Entity Scaffold

Create `skills/fireproof/scaffold-entity.ts`:

```typescript
/**
 * SKILL: FireProof Entity Scaffold
 * Generates a complete entity with repository, service, and controller
 * Includes TenantId for multi-tenancy
 */

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';

export interface EntityScaffoldParams {
  entityName: string;
  properties: {
    name: string;
    type: string;
    nullable?: boolean;
  }[];
  projectPath: string;
}

export async function scaffoldFireProofEntity(params: EntityScaffoldParams) {
  const { entityName, properties, projectPath } = params;

  // Generate entity class
  const entityCode = generateEntityClass(entityName, properties);

  // Generate repository interface
  const repositoryInterface = generateRepositoryInterface(entityName);

  // Generate repository implementation
  const repositoryClass = generateRepositoryClass(entityName, properties);

  // Generate service interface
  const serviceInterface = generateServiceInterface(entityName);

  // Generate service class
  const serviceClass = generateServiceClass(entityName);

  // Generate controller
  const controller = generateController(entityName);

  // Write files
  await mkdir(join(projectPath, 'Entities'), { recursive: true });
  await mkdir(join(projectPath, 'Repositories'), { recursive: true });
  await mkdir(join(projectPath, 'Services'), { recursive: true });
  await mkdir(join(projectPath, 'Controllers'), { recursive: true });

  await writeFile(
    join(projectPath, 'Entities', `${entityName}.cs`),
    entityCode
  );

  await writeFile(
    join(projectPath, 'Repositories', `I${entityName}Repository.cs`),
    repositoryInterface
  );

  await writeFile(
    join(projectPath, 'Repositories', `${entityName}Repository.cs`),
    repositoryClass
  );

  await writeFile(
    join(projectPath, 'Services', `I${entityName}Service.cs`),
    serviceInterface
  );

  await writeFile(
    join(projectPath, 'Services', `${entityName}Service.cs`),
    serviceClass
  );

  await writeFile(
    join(projectPath, 'Controllers', `${entityName}Controller.cs`),
    controller
  );

  return {
    filesCreated: 6,
    entity: entityName,
    files: [
      `Entities/${entityName}.cs`,
      `Repositories/I${entityName}Repository.cs`,
      `Repositories/${entityName}Repository.cs`,
      `Services/I${entityName}Service.cs`,
      `Services/${entityName}Service.cs`,
      `Controllers/${entityName}Controller.cs`
    ]
  };
}

function generateEntityClass(entityName: string, properties: any[]): string {
  return `using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace FireProof.Entities
{
    [Table("${entityName}s")]
    public class ${entityName}
    {
        [Key]
        public Guid ${entityName}Id { get; set; }

        [Required]
        public Guid TenantId { get; set; }

        ${properties.map(p => `
        ${p.nullable ? '' : '[Required]'}
        public ${p.type}${p.nullable ? '?' : ''} ${p.name} { get; set; }`).join('\n')}

        [Required]
        public bool IsActive { get; set; } = true;

        [Required]
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

        [Required]
        public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    }
}`;
}

function generateRepositoryInterface(entityName: string): string {
  return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FireProof.Entities;

namespace FireProof.Repositories
{
    public interface I${entityName}Repository
    {
        Task<IEnumerable<${entityName}>> GetAllAsync(Guid tenantId);
        Task<${entityName}?> GetByIdAsync(Guid id, Guid tenantId);
        Task<${entityName}> CreateAsync(${entityName} entity);
        Task<${entityName}> UpdateAsync(${entityName} entity);
        Task<bool> DeleteAsync(Guid id, Guid tenantId);
    }
}`;
}

function generateRepositoryClass(entityName: string, properties: any[]): string {
  return `using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using FireProof.Data;
using FireProof.Entities;

namespace FireProof.Repositories
{
    public class ${entityName}Repository : I${entityName}Repository
    {
        private readonly ApplicationDbContext _context;

        public ${entityName}Repository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<${entityName}>> GetAllAsync(Guid tenantId)
        {
            return await _context.${entityName}s
                .Where(e => e.TenantId == tenantId && e.IsActive)
                .ToListAsync();
        }

        public async Task<${entityName}?> GetByIdAsync(Guid id, Guid tenantId)
        {
            return await _context.${entityName}s
                .FirstOrDefaultAsync(e =>
                    e.${entityName}Id == id &&
                    e.TenantId == tenantId &&
                    e.IsActive);
        }

        public async Task<${entityName}> CreateAsync(${entityName} entity)
        {
            entity.CreatedAt = DateTime.UtcNow;
            entity.UpdatedAt = DateTime.UtcNow;
            _context.${entityName}s.Add(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<${entityName}> UpdateAsync(${entityName} entity)
        {
            entity.UpdatedAt = DateTime.UtcNow;
            _context.${entityName}s.Update(entity);
            await _context.SaveChangesAsync();
            return entity;
        }

        public async Task<bool> DeleteAsync(Guid id, Guid tenantId)
        {
            var entity = await GetByIdAsync(id, tenantId);
            if (entity == null) return false;

            entity.IsActive = false;
            entity.UpdatedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}`;
}

function generateServiceInterface(entityName: string): string {
  // Similar pattern...
  return `// Service interface code...`;
}

function generateServiceClass(entityName: string): string {
  // Similar pattern...
  return `// Service class code...`;
}

function generateController(entityName: string): string {
  // Similar pattern...
  return `// Controller code...`;
}
```

### Use It

```typescript
import { scaffoldFireProofEntity } from './skills/fireproof/scaffold-entity';

await scaffoldFireProofEntity({
  entityName: 'Product',
  properties: [
    { name: 'Name', type: 'string' },
    { name: 'Description', type: 'string', nullable: true },
    { name: 'Price', type: 'decimal' },
    { name: 'SKU', type: 'string' }
  ],
  projectPath: '/mnt/d/dev2/fireproof/backend/FireProof.API'
});
```

**Result:** 6 files created with complete CRUD operations, all multi-tenant aware!

## Next Steps

### 1. Build More Skills

Create skills for tasks you do frequently:
- Database migrations
- Unit test generation
- API client generation
- Deployment automation

### 2. Integrate with Your Tools

Wrap your existing tools as skills:
- SQLExtract → `skills/sql-extract.ts`
- Universal TODO Scanner → `skills/scan-todos.ts`
- .NET Unit Test Generator → `skills/generate-tests.ts`

### 3. Create MCP Server Integrations

Set up MCP servers for external tools:
- GitHub (for repository operations)
- SQL Server (for database queries)
- Azure (for cloud deployments)

See `mcp-code-execution/servers/README.md` for templates.

### 4. Build Project-Specific Agents

Create specialized agents for your projects:
- FireProof deployment agent
- RemoteC diagnostics agent
- ServiceVision auth validator

### 5. Explore Advanced Patterns

- Multi-agent orchestration
- Long-term memory
- State persistence
- Privacy-preserving operations

See `INTEGRATION-BENEFITS.md` for detailed examples.

## Resources

- **Bibliography**: `BIBLIOGRAPHY.md` - Complete resource list
- **Integration Benefits**: `INTEGRATION-BENEFITS.md` - Detailed analysis
- **MCP Library**: `mcp-code-execution/` - Code execution patterns
- **Official Docs**: https://docs.claude.com/en/docs/agent-sdk/overview

## Common Issues

### "Module not found" errors
```bash
npm install <missing-module>
npm install -D @types/<missing-module>
```

### API key not found
```bash
echo $ANTHROPIC_API_KEY  # Should output your key
# If empty, add to ~/.bashrc and reload
```

### TypeScript errors
```bash
npm install -D typescript @types/node
npx tsc --init
```

## Get Help

- GitHub Issues: https://github.com/anthropics/claude-agent-sdk-typescript/issues
- Documentation: https://docs.claude.com/en/docs/agent-sdk
- Examples: `examples/` directory in this project

---

**You're ready to build your first production agent!**

Start with a simple skill for a task you do weekly, test it thoroughly, then expand from there. The key is to start small and build incrementally.

*Happy coding! 🚀*
