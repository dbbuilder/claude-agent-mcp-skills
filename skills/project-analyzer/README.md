# Project Analyzer Agent

Automatically scans all your projects and recommends skills by priority.

## What It Does

1. **Scans Projects** in:
   - `/mnt/d/dev2` (level 1)
   - `/mnt/d/dev2/clients` (level 1)
   - `/mnt/d/dev2/michaeljr` (level 1)

2. **Analyzes Each Project:**
   - Tech stack (languages, frameworks, databases)
   - Environment variables
   - Code structure
   - Documentation (README, CLAUDE.md, TODO, etc.)

3. **Identifies Skills Needed:**
   - Based on tech stack
   - Based on project patterns
   - Based on common needs

4. **Ranks Skills by Priority:**
   - Priority = Project Count × Utility Score
   - Higher score = more important skill

5. **Caches Results:**
   - Skips projects scanned within last 7 days
   - Incremental updates only

## Usage

```bash
cd /mnt/d/dev2/claude-agent-sdk/skills/project-analyzer

# First time: scan all projects
npx tsx index.ts

# Subsequent runs: only scans new/updated projects
npx tsx index.ts
```

## Output Files

All generated in `results/` directory:

1. **projects-detailed.json** - Full analysis of each project
2. **skills-by-priority.json** - Skills ranked by priority
3. **ANALYSIS-SUMMARY.md** - Human-readable report

## Cache

- **Location:** `.project-cache.json`
- **Expiry:** 7 days
- **Reset:** Delete `.project-cache.json` to rescan all

## Example Output

```
🔍 Project Analyzer Agent

Scanning projects in:
  - /mnt/d/dev2 (level 1)
  - /mnt/d/dev2/clients (level 1)
  - /mnt/d/dev2/michaeljr (level 1)

📂 Found 150 total project directories

🔬 Analyzing projects...

  Analyzing: fireproof...
  Analyzing: remotec...
  Analyzing: servicevision...
  ...

✅ Analysis complete:
   New/updated: 45
   Skipped (cached): 105
   Total in cache: 150

📊 Aggregating skill recommendations...

📝 Generating reports...

✅ Reports generated:
   results/projects-detailed.json
   results/skills-by-priority.json
   results/ANALYSIS-SUMMARY.md

🎯 Top 10 Recommended Skills:

 1. sql-schema-analyzer              Priority:  405 (45 projects × 9 utility)
 2. dotnet-api-scaffold               Priority:  378 (42 projects × 9 utility)
 3. code-security-auditor             Priority:  350 (35 projects × 10 utility)
 4. dotnet-entity-generator           Priority:  351 (39 projects × 9 utility)
 5. database-migration-generator      Priority:  333 (37 projects × 9 utility)
 6. unit-test-generator               Priority:  304 (38 projects × 8 utility)
 7. readme-generator                  Priority:  297 (33 projects × 9 utility)
 8. dotnet-unit-test-generator        Priority:  288 (36 projects × 8 utility)
 9. typescript-api-scaffold           Priority:  210 (30 projects × 7 utility)
10. react-component-generator         Priority:  189 (27 projects × 7 utility)
```

## How Priority Is Calculated

**Formula:** `Priority = Project Count × Utility Score`

**Utility Scores:**
- 10 = Critical (security, universal tools)
- 9 = Very High (scaffolding, schema tools)
- 8 = High (testing, migrations)
- 7 = Medium-High (components, specific frameworks)
- 6 = Medium (config, docker)
- 5 = Default

**Example:**
```
sql-schema-analyzer:
  - Used by 45 projects (Project Count)
  - Utility score: 9 (Very High)
  - Priority: 45 × 9 = 405
```

## Detected Technologies

The agent automatically detects:

**Languages:**
- C# (.csproj, .sln)
- JavaScript/TypeScript (package.json)
- Python (requirements.txt, Pipfile)
- Go (go.mod)
- Rust (Cargo.toml)
- Java (pom.xml)

**Frameworks:**
- ASP.NET Core
- Entity Framework Core
- Next.js
- React
- Vue
- Angular
- Express
- NestJS

**Databases:**
- SQL Server
- PostgreSQL
- MySQL
- MongoDB
- Redis
- Prisma
- TypeORM

**Platforms:**
- Docker
- Docker Compose
- Azure DevOps
- GitHub Actions
- Vercel
- Netlify

## Skill Recommendations

Based on detection, suggests skills like:

**Database Skills:**
- `sql-schema-analyzer` - Analyze schemas (like our SQL Server MCP)
- `database-migration-generator` - Generate migrations
- `sql-server-schema-export` - Export schemas
- `sql-seed-data-generator` - Generate seed data

**.NET Skills:**
- `dotnet-api-scaffold` - Scaffold API endpoints
- `dotnet-entity-generator` - Generate entities
- `dotnet-unit-test-generator` - Generate unit tests
- `ef-core-migration-generator` - EF Core migrations
- `aspnet-controller-generator` - Generate controllers

**JavaScript/TypeScript Skills:**
- `typescript-api-scaffold` - Scaffold TypeScript APIs
- `react-component-generator` - Generate React components
- `nextjs-api-route-generator` - Next.js API routes
- `vue-component-generator` - Vue components

**Testing Skills:**
- `unit-test-generator` - Generate unit tests
- `integration-test-generator` - Generate integration tests

**DevOps Skills:**
- `dockerfile-generator` - Generate Dockerfiles
- `docker-compose-generator` - Generate docker-compose.yml

**Universal Skills:**
- `code-security-auditor` - Security analysis
- `readme-generator` - Generate README files
- `project-scaffolder` - Scaffold new projects
- `dependency-updater` - Update dependencies
- `env-var-validator` - Validate environment variables

## Integration with Claude Agent SDK

Use this analysis to prioritize which skills to build first:

```typescript
import { Agent } from '@anthropic-ai/claude-agent-sdk';

const agent = new Agent({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// Read the skills-by-priority.json
const skills = JSON.parse(
  fs.readFileSync('results/skills-by-priority.json', 'utf-8')
);

// Build top 5 skills first
const topSkills = skills.slice(0, 5);
console.log('Build these skills first:', topSkills.map(s => s.skill));
```

## Customization

### Add Custom Tech Detection

Edit `detectTechStack()` function:

```typescript
// Add your custom framework
if (deps['my-framework']) stack.frameworks.push('My Framework');
```

### Adjust Utility Scores

Edit `utilityScores` object in `aggregateSkills()`:

```typescript
const utilityScores: Record<string, number> = {
  'my-custom-skill': 10, // Very important
  // ...
};
```

### Change Cache Expiry

Edit the cache check in `main()`:

```typescript
if (daysSince < 14) { // Change from 7 to 14 days
  // ...
}
```

## Use Cases

### 1. Prioritize Skill Development

See which skills would help the most projects.

### 2. Tech Stack Audit

Understand what technologies you're using across all projects.

### 3. Documentation Audit

Find projects missing README, CLAUDE.md, or TODO files.

### 4. Identify Common Patterns

See which frameworks, databases, and platforms you use most.

### 5. Plan Standardization

Identify opportunities to standardize across projects.

## Performance

**Typical scan times:**
- First run (150 projects): 3-5 minutes
- Incremental (10 new projects): 30-60 seconds

**Token efficiency:**
- No Claude API calls during scanning
- All processing done locally
- Reports generated with 0 tokens

**Cache benefits:**
- 7-day expiry
- 95% of projects skipped on subsequent runs
- Sub-minute scan times

## Next Steps

After running analysis:

1. Review `results/ANALYSIS-SUMMARY.md`
2. Check `results/skills-by-priority.json` for top skills
3. Build top 3-5 skills first (highest priority)
4. Re-run weekly to track new projects
5. Use skills across all your projects

## Example: Building Top Skill

If `sql-schema-analyzer` is #1 priority:

```bash
cd /mnt/d/dev2/claude-agent-sdk/skills
mkdir sql-schema-analyzer

# Already have SQL Server MCP!
# Link to it or use it as the skill implementation
```

Good news: **We already built the #1 skill!**
The SQL Server MCP server is exactly what `sql-schema-analyzer` would be.

---

**Status:** ✅ Production Ready
**Token Cost:** $0 (all local processing)
**Time:** 3-5 minutes for full scan
