# Project Analyzer - Quick Start

## One Command

```bash
cd /mnt/d/dev2/claude-agent-sdk/skills/project-analyzer && npx tsx index.ts
```

## What Happens

1. Scans ~150 projects in /mnt/d/dev2
2. Analyzes tech stack, env vars, structure
3. Identifies needed skills
4. Ranks by priority
5. Generates 3 reports

## Time

- **First run:** 3-5 minutes (scans all projects)
- **Subsequent runs:** 30-60 seconds (only new projects)

## Output

Check `results/` folder:

1. **ANALYSIS-SUMMARY.md** - Read this first!
2. **skills-by-priority.json** - Top skills to build
3. **projects-detailed.json** - Full project data

## Top 3 Actions

After running:

1. **Open** `results/ANALYSIS-SUMMARY.md`
2. **Review** top 10 recommended skills
3. **Build** the top 3 skills first

## Reset Cache

To rescan everything:

```bash
rm .project-cache.json
npx tsx index.ts
```

## Expected Top Skills

Based on your projects (C#, SQL Server, TypeScript):

1. `sql-schema-analyzer` ← **Already built!** (SQL Server MCP)
2. `dotnet-api-scaffold` ← High priority
3. `dotnet-entity-generator` ← High priority
4. `code-security-auditor` ← Universal
5. `database-migration-generator` ← High ROI

## Next Steps

```bash
# 1. Run analyzer
npx tsx index.ts

# 2. Read summary
cat results/ANALYSIS-SUMMARY.md

# 3. Check top skills
cat results/skills-by-priority.json | head -50

# 4. Build top skill (we already did this!)
# SQL Server MCP = sql-schema-analyzer skill
```

---

**Status:** Ready to run!
**Cost:** $0 (no API calls)
**Time:** 3-5 minutes
