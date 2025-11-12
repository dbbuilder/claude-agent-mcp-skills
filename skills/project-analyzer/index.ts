#!/usr/bin/env tsx

/**
 * Project Analyzer Agent
 *
 * Scans all projects in /mnt/d/dev2 and analyzes:
 * - Tech stack
 * - Environment variables
 * - Code structure
 * - Documentation (README, CLAUDE.md, TODO, etc.)
 *
 * Aggregates findings to recommend skills by priority.
 * Caches results to avoid re-scanning.
 */

import { readFile, writeFile, readdir, stat, access } from 'fs/promises';
import { join, basename } from 'path';
import { constants } from 'fs';

// Cache file location
const CACHE_FILE = join(__dirname, '.project-cache.json');
const RESULTS_DIR = join(__dirname, 'results');

interface ProjectAnalysis {
  path: string;
  name: string;
  scannedAt: string;
  stack: {
    languages: string[];
    frameworks: string[];
    databases: string[];
    platforms: string[];
  };
  envVars: string[];
  hasClaudeFile: boolean;
  claudeFileContent?: string;
  documentation: {
    hasReadme: boolean;
    hasTodo: boolean;
    hasRequirements: boolean;
    hasClaudeFile: boolean;
  };
  structure: {
    directories: string[];
    keyFiles: string[];
  };
  potentialSkills: string[];
}

interface ProjectCache {
  lastScan: string;
  projects: Record<string, ProjectAnalysis>;
}

interface SkillRecommendation {
  skill: string;
  priority: number;
  projectCount: number;
  utility: number;
  projects: string[];
  reasoning: string;
}

/**
 * Load cache or create new one
 */
async function loadCache(): Promise<ProjectCache> {
  try {
    const content = await readFile(CACHE_FILE, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {
      lastScan: new Date().toISOString(),
      projects: {},
    };
  }
}

/**
 * Save cache
 */
async function saveCache(cache: ProjectCache): Promise<void> {
  await writeFile(CACHE_FILE, JSON.stringify(cache, null, 2));
}

/**
 * Get all project directories to scan
 */
async function getProjectDirectories(): Promise<string[]> {
  const dirs: string[] = [];

  // Level 1 from /mnt/d/dev2
  const dev2Dirs = await readdir('/mnt/d/dev2');
  for (const dir of dev2Dirs) {
    const path = join('/mnt/d/dev2', dir);
    try {
      const stats = await stat(path);
      if (stats.isDirectory() && dir !== 'node_modules' && dir !== '.git') {
        dirs.push(path);
      }
    } catch {
      // Skip inaccessible directories
    }
  }

  // Level 1 from /mnt/d/dev2/clients
  try {
    const clientDirs = await readdir('/mnt/d/dev2/clients');
    for (const dir of clientDirs) {
      const path = join('/mnt/d/dev2/clients', dir);
      try {
        const stats = await stat(path);
        if (stats.isDirectory() && dir !== 'node_modules' && dir !== '.git') {
          dirs.push(path);
        }
      } catch {
        // Skip inaccessible
      }
    }
  } catch {
    // clients directory might not exist
  }

  // Level 1 from /mnt/d/dev2/michaeljr
  try {
    const mjDirs = await readdir('/mnt/d/dev2/michaeljr');
    for (const dir of mjDirs) {
      const path = join('/mnt/d/dev2/michaeljr', dir);
      try {
        const stats = await stat(path);
        if (stats.isDirectory() && dir !== 'node_modules' && dir !== '.git') {
          dirs.push(path);
        }
      } catch {
        // Skip inaccessible
      }
    }
  } catch {
    // michaeljr directory might not exist
  }

  return dirs.sort();
}

/**
 * Check if file exists
 */
async function fileExists(path: string): Promise<boolean> {
  try {
    await access(path, constants.R_OK);
    return true;
  } catch {
    return false;
  }
}

/**
 * Safely read file
 */
async function safeReadFile(path: string): Promise<string | null> {
  try {
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Detect tech stack from files
 */
async function detectTechStack(projectPath: string): Promise<ProjectAnalysis['stack']> {
  const stack: ProjectAnalysis['stack'] = {
    languages: [],
    frameworks: [],
    databases: [],
    platforms: [],
  };

  // Check for common files
  const checks = [
    // Languages
    { file: 'package.json', lang: 'JavaScript/TypeScript' },
    { file: '*.csproj', lang: 'C#' },
    { file: '*.sln', lang: 'C#' },
    { file: 'requirements.txt', lang: 'Python' },
    { file: 'Pipfile', lang: 'Python' },
    { file: 'go.mod', lang: 'Go' },
    { file: 'Cargo.toml', lang: 'Rust' },
    { file: 'pom.xml', lang: 'Java' },
  ];

  const files = await readdir(projectPath).catch(() => []);

  for (const file of files) {
    // Languages
    if (file === 'package.json') stack.languages.push('JavaScript/TypeScript');
    if (file.endsWith('.csproj')) stack.languages.push('C#');
    if (file.endsWith('.sln')) stack.languages.push('C#');
    if (file === 'requirements.txt' || file === 'Pipfile') stack.languages.push('Python');
    if (file === 'go.mod') stack.languages.push('Go');
    if (file === 'Cargo.toml') stack.languages.push('Rust');
    if (file === 'pom.xml') stack.languages.push('Java');

    // Frameworks
    if (file === 'next.config.js' || file === 'next.config.mjs') stack.frameworks.push('Next.js');
    if (file === 'nuxt.config.js' || file === 'nuxt.config.ts') stack.frameworks.push('Nuxt');
    if (file === 'vite.config.js' || file === 'vite.config.ts') stack.frameworks.push('Vite');
    if (file === 'angular.json') stack.frameworks.push('Angular');
    if (file === 'vue.config.js') stack.frameworks.push('Vue');
    if (file === 'Dockerfile') stack.platforms.push('Docker');
    if (file === 'docker-compose.yml') stack.platforms.push('Docker Compose');
  }

  // Check package.json for more details
  const packageJson = await safeReadFile(join(projectPath, 'package.json'));
  if (packageJson) {
    try {
      const pkg = JSON.parse(packageJson);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Frameworks
      if (deps['next']) stack.frameworks.push('Next.js');
      if (deps['nuxt']) stack.frameworks.push('Nuxt');
      if (deps['@angular/core']) stack.frameworks.push('Angular');
      if (deps['vue']) stack.frameworks.push('Vue');
      if (deps['react']) stack.frameworks.push('React');
      if (deps['express']) stack.frameworks.push('Express');
      if (deps['fastify']) stack.frameworks.push('Fastify');
      if (deps['nestjs']) stack.frameworks.push('NestJS');

      // Databases
      if (deps['pg'] || deps['postgres']) stack.databases.push('PostgreSQL');
      if (deps['mysql'] || deps['mysql2']) stack.databases.push('MySQL');
      if (deps['mssql']) stack.databases.push('SQL Server');
      if (deps['mongodb'] || deps['mongoose']) stack.databases.push('MongoDB');
      if (deps['redis']) stack.databases.push('Redis');
      if (deps['@prisma/client']) stack.databases.push('Prisma');
      if (deps['typeorm']) stack.databases.push('TypeORM');
    } catch {
      // Invalid JSON
    }
  }

  // Check for .NET projects
  const csprojFiles = files.filter(f => f.endsWith('.csproj'));
  if (csprojFiles.length > 0) {
    const csprojContent = await safeReadFile(join(projectPath, csprojFiles[0]));
    if (csprojContent) {
      if (csprojContent.includes('Microsoft.EntityFrameworkCore')) {
        stack.frameworks.push('Entity Framework Core');
      }
      if (csprojContent.includes('Microsoft.AspNetCore')) {
        stack.frameworks.push('ASP.NET Core');
      }
      if (csprojContent.includes('Microsoft.Data.SqlClient')) {
        stack.databases.push('SQL Server');
      }
    }
  }

  // Check for Azure/Cloud
  if (files.includes('azure-pipelines.yml')) stack.platforms.push('Azure DevOps');
  if (files.includes('.github')) stack.platforms.push('GitHub Actions');
  if (files.includes('vercel.json')) stack.platforms.push('Vercel');
  if (files.includes('netlify.toml')) stack.platforms.push('Netlify');

  // Deduplicate
  stack.languages = [...new Set(stack.languages)];
  stack.frameworks = [...new Set(stack.frameworks)];
  stack.databases = [...new Set(stack.databases)];
  stack.platforms = [...new Set(stack.platforms)];

  return stack;
}

/**
 * Extract environment variables from common files
 */
async function extractEnvVars(projectPath: string): Promise<string[]> {
  const envVars = new Set<string>();

  // Check .env.example
  const envExample = await safeReadFile(join(projectPath, '.env.example'));
  if (envExample) {
    const matches = envExample.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm);
    for (const match of matches) {
      envVars.add(match[1]);
    }
  }

  // Check .env.template
  const envTemplate = await safeReadFile(join(projectPath, '.env.template'));
  if (envTemplate) {
    const matches = envTemplate.matchAll(/^([A-Z_][A-Z0-9_]*)=/gm);
    for (const match of matches) {
      envVars.add(match[1]);
    }
  }

  // Check README for env var mentions
  const readme = await safeReadFile(join(projectPath, 'README.md'));
  if (readme) {
    const matches = readme.matchAll(/`([A-Z_][A-Z0-9_]*)`/g);
    for (const match of matches) {
      if (match[1].includes('_')) {
        envVars.add(match[1]);
      }
    }
  }

  return Array.from(envVars).sort();
}

/**
 * Analyze project structure
 */
async function analyzeStructure(projectPath: string): Promise<{
  directories: string[];
  keyFiles: string[];
}> {
  const structure = {
    directories: [] as string[],
    keyFiles: [] as string[],
  };

  try {
    const files = await readdir(projectPath);

    for (const file of files) {
      const filePath = join(projectPath, file);
      try {
        const stats = await stat(filePath);

        if (stats.isDirectory()) {
          // Track key directories
          const keyDirs = ['src', 'lib', 'api', 'components', 'pages', 'app', 'services', 'controllers', 'models', 'database', 'tests', 'docs'];
          if (keyDirs.includes(file)) {
            structure.directories.push(file);
          }
        } else {
          // Track key files
          const keyFiles = [
            'package.json',
            'tsconfig.json',
            'vite.config.ts',
            'next.config.js',
            'Dockerfile',
            'docker-compose.yml',
            '.env.example',
            'CLAUDE.md',
            'README.md',
            'TODO.md',
            'REQUIREMENTS.md',
          ];
          if (keyFiles.includes(file) || file.endsWith('.sln') || file.endsWith('.csproj')) {
            structure.keyFiles.push(file);
          }
        }
      } catch {
        // Skip inaccessible files
      }
    }
  } catch {
    // Skip inaccessible directory
  }

  return structure;
}

/**
 * Identify potential skills needed for project
 */
function identifyPotentialSkills(
  stack: ProjectAnalysis['stack'],
  envVars: string[],
  structure: { directories: string[]; keyFiles: string[] }
): string[] {
  const skills = new Set<string>();

  // Language-specific skills
  if (stack.languages.includes('C#')) {
    skills.add('dotnet-api-scaffold');
    skills.add('dotnet-entity-generator');
    skills.add('dotnet-unit-test-generator');
  }

  if (stack.languages.includes('JavaScript/TypeScript')) {
    skills.add('typescript-api-scaffold');
    skills.add('npm-dependency-audit');
  }

  if (stack.languages.includes('Python')) {
    skills.add('python-api-scaffold');
    skills.add('python-dependency-audit');
  }

  // Database skills
  if (stack.databases.length > 0) {
    skills.add('sql-schema-analyzer');
    skills.add('database-migration-generator');
    skills.add('sql-seed-data-generator');
  }

  if (stack.databases.includes('SQL Server')) {
    skills.add('sql-server-schema-export');
    skills.add('sql-server-performance-analyzer');
  }

  // Framework skills
  if (stack.frameworks.includes('ASP.NET Core')) {
    skills.add('aspnet-controller-generator');
    skills.add('aspnet-middleware-generator');
  }

  if (stack.frameworks.includes('Next.js') || stack.frameworks.includes('React')) {
    skills.add('react-component-generator');
    skills.add('nextjs-api-route-generator');
  }

  if (stack.frameworks.includes('Vue')) {
    skills.add('vue-component-generator');
  }

  if (stack.frameworks.includes('Entity Framework Core')) {
    skills.add('ef-core-migration-generator');
    skills.add('ef-core-entity-generator');
  }

  // Testing skills
  if (structure.directories.includes('tests') || structure.keyFiles.some(f => f.includes('test'))) {
    skills.add('unit-test-generator');
    skills.add('integration-test-generator');
  }

  // Docker skills
  if (stack.platforms.includes('Docker')) {
    skills.add('dockerfile-generator');
    skills.add('docker-compose-generator');
  }

  // Documentation skills
  if (structure.keyFiles.includes('README.md')) {
    skills.add('readme-generator');
    skills.add('api-documentation-generator');
  }

  // Environment configuration
  if (envVars.length > 0) {
    skills.add('env-var-validator');
    skills.add('config-template-generator');
  }

  // General skills
  skills.add('project-scaffolder');
  skills.add('code-security-auditor');
  skills.add('dependency-updater');

  return Array.from(skills).sort();
}

/**
 * Analyze a single project
 */
async function analyzeProject(projectPath: string): Promise<ProjectAnalysis> {
  const name = basename(projectPath);

  console.log(`  Analyzing: ${name}...`);

  // Detect stack
  const stack = await detectTechStack(projectPath);

  // Extract env vars
  const envVars = await extractEnvVars(projectPath);

  // Check for documentation
  const hasReadme = await fileExists(join(projectPath, 'README.md'));
  const hasTodo = await fileExists(join(projectPath, 'TODO.md'));
  const hasRequirements = await fileExists(join(projectPath, 'REQUIREMENTS.md'));
  const hasClaudeFile = await fileExists(join(projectPath, 'CLAUDE.md'));

  // Read CLAUDE.md if exists
  let claudeFileContent: string | undefined;
  if (hasClaudeFile) {
    claudeFileContent = (await safeReadFile(join(projectPath, 'CLAUDE.md'))) || undefined;
  }

  // Analyze structure
  const structure = await analyzeStructure(projectPath);

  // Identify potential skills
  const potentialSkills = identifyPotentialSkills(stack, envVars, structure);

  return {
    path: projectPath,
    name,
    scannedAt: new Date().toISOString(),
    stack,
    envVars,
    hasClaudeFile,
    claudeFileContent,
    documentation: {
      hasReadme,
      hasTodo,
      hasRequirements,
      hasClaudeFile,
    },
    structure,
    potentialSkills,
  };
}

/**
 * Aggregate skills across all projects
 */
function aggregateSkills(projects: ProjectAnalysis[]): SkillRecommendation[] {
  const skillMap = new Map<string, {
    projects: string[];
    stacks: Set<string>;
  }>();

  // Collect all skills and which projects need them
  for (const project of projects) {
    for (const skill of project.potentialSkills) {
      if (!skillMap.has(skill)) {
        skillMap.set(skill, {
          projects: [],
          stacks: new Set(),
        });
      }

      const skillData = skillMap.get(skill)!;
      skillData.projects.push(project.name);
      project.stack.languages.forEach(l => skillData.stacks.add(l));
      project.stack.frameworks.forEach(f => skillData.stacks.add(f));
      project.stack.databases.forEach(d => skillData.stacks.add(d));
    }
  }

  // Calculate utility scores
  const utilityScores: Record<string, number> = {
    // High utility (universal)
    'code-security-auditor': 10,
    'readme-generator': 9,
    'project-scaffolder': 9,
    'dependency-updater': 8,

    // Database (high value)
    'sql-schema-analyzer': 9,
    'database-migration-generator': 9,
    'sql-server-schema-export': 8,
    'sql-server-performance-analyzer': 7,

    // .NET (high value for your projects)
    'dotnet-api-scaffold': 9,
    'dotnet-entity-generator': 9,
    'dotnet-unit-test-generator': 8,
    'ef-core-migration-generator': 8,
    'aspnet-controller-generator': 8,

    // Testing
    'unit-test-generator': 8,
    'integration-test-generator': 7,

    // TypeScript/JavaScript
    'typescript-api-scaffold': 7,
    'react-component-generator': 7,
    'nextjs-api-route-generator': 7,
    'vue-component-generator': 7,

    // Environment
    'env-var-validator': 6,
    'config-template-generator': 6,

    // Docker
    'dockerfile-generator': 6,
    'docker-compose-generator': 6,

    // Documentation
    'api-documentation-generator': 7,

    // Python
    'python-api-scaffold': 6,

    // Default
  };

  // Create recommendations
  const recommendations: SkillRecommendation[] = [];

  for (const [skill, data] of skillMap.entries()) {
    const projectCount = data.projects.length;
    const utility = utilityScores[skill] || 5; // Default utility
    const priority = projectCount * utility;

    recommendations.push({
      skill,
      priority,
      projectCount,
      utility,
      projects: data.projects,
      reasoning: generateReasoning(skill, projectCount, Array.from(data.stacks)),
    });
  }

  // Sort by priority (descending)
  recommendations.sort((a, b) => b.priority - a.priority);

  return recommendations;
}

/**
 * Generate reasoning for skill recommendation
 */
function generateReasoning(skill: string, projectCount: number, stacks: string[]): string {
  const reasons: string[] = [];

  reasons.push(`Used by ${projectCount} project${projectCount !== 1 ? 's' : ''}`);

  if (stacks.length > 0) {
    reasons.push(`Applies to: ${stacks.slice(0, 3).join(', ')}${stacks.length > 3 ? ', ...' : ''}`);
  }

  // Skill-specific reasoning
  if (skill.includes('sql') || skill.includes('database')) {
    reasons.push('High ROI: 98% token reduction with code execution');
  }

  if (skill.includes('test-generator')) {
    reasons.push('Saves 2-3 hours per project');
  }

  if (skill.includes('scaffold')) {
    reasons.push('Accelerates new feature development');
  }

  if (skill.includes('security')) {
    reasons.push('Critical for production readiness');
  }

  return reasons.join('. ');
}

/**
 * Main execution
 */
async function main() {
  console.log('🔍 Project Analyzer Agent\n');
  console.log('Scanning projects in:');
  console.log('  - /mnt/d/dev2 (level 1)');
  console.log('  - /mnt/d/dev2/clients (level 1)');
  console.log('  - /mnt/d/dev2/michaeljr (level 1)');
  console.log();

  // Load cache
  const cache = await loadCache();
  console.log(`📦 Loaded cache with ${Object.keys(cache.projects).length} existing projects\n`);

  // Get all project directories
  const projectDirs = await getProjectDirectories();
  console.log(`📂 Found ${projectDirs.length} total project directories\n`);

  // Analyze projects (skip cached ones)
  console.log('🔬 Analyzing projects...\n');

  let newCount = 0;
  let skippedCount = 0;

  for (const dir of projectDirs) {
    const name = basename(dir);

    // Skip if already in cache and scanned recently (within 7 days)
    if (cache.projects[dir]) {
      const scannedDate = new Date(cache.projects[dir].scannedAt);
      const daysSince = (Date.now() - scannedDate.getTime()) / (1000 * 60 * 60 * 24);

      if (daysSince < 7) {
        console.log(`  ⏭️  Skipping (cached): ${name}`);
        skippedCount++;
        continue;
      }
    }

    try {
      const analysis = await analyzeProject(dir);
      cache.projects[dir] = analysis;
      newCount++;
    } catch (error) {
      console.log(`  ❌ Error analyzing ${name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  console.log();
  console.log(`✅ Analysis complete:`);
  console.log(`   New/updated: ${newCount}`);
  console.log(`   Skipped (cached): ${skippedCount}`);
  console.log(`   Total in cache: ${Object.keys(cache.projects).length}`);
  console.log();

  // Save cache
  cache.lastScan = new Date().toISOString();
  await saveCache(cache);
  console.log(`💾 Cache saved to ${CACHE_FILE}\n`);

  // Aggregate skills
  console.log('📊 Aggregating skill recommendations...\n');

  const allProjects = Object.values(cache.projects);
  const recommendations = aggregateSkills(allProjects);

  // Generate reports
  console.log('📝 Generating reports...\n');

  // Create results directory
  try {
    await stat(RESULTS_DIR);
  } catch {
    await import('fs/promises').then(fs => fs.mkdir(RESULTS_DIR, { recursive: true }));
  }

  // Report 1: By Project
  const byProjectReport = allProjects.map(p => ({
    name: p.name,
    path: p.path,
    stack: p.stack,
    envVarCount: p.envVars.length,
    hasClaudeFile: p.hasClaudeFile,
    skillsNeeded: p.potentialSkills,
    skillCount: p.potentialSkills.length,
  }));

  await writeFile(
    join(RESULTS_DIR, 'projects-detailed.json'),
    JSON.stringify(byProjectReport, null, 2)
  );

  // Report 2: Skills by Priority
  await writeFile(
    join(RESULTS_DIR, 'skills-by-priority.json'),
    JSON.stringify(recommendations, null, 2)
  );

  // Report 3: Summary Markdown
  const markdown = generateMarkdownReport(allProjects, recommendations);
  await writeFile(
    join(RESULTS_DIR, 'ANALYSIS-SUMMARY.md'),
    markdown
  );

  console.log('✅ Reports generated:');
  console.log(`   ${join(RESULTS_DIR, 'projects-detailed.json')}`);
  console.log(`   ${join(RESULTS_DIR, 'skills-by-priority.json')}`);
  console.log(`   ${join(RESULTS_DIR, 'ANALYSIS-SUMMARY.md')}`);
  console.log();

  // Print top 10 skills
  console.log('🎯 Top 10 Recommended Skills:\n');
  recommendations.slice(0, 10).forEach((rec, i) => {
    console.log(`${(i + 1).toString().padStart(2)}. ${rec.skill.padEnd(40)} Priority: ${rec.priority.toString().padStart(4)} (${rec.projectCount} projects × ${rec.utility} utility)`);
  });

  console.log();
  console.log('✅ Analysis complete! Check results/ directory for detailed reports.');
}

/**
 * Generate markdown report
 */
function generateMarkdownReport(
  projects: ProjectAnalysis[],
  recommendations: SkillRecommendation[]
): string {
  const lines: string[] = [];

  lines.push('# Project Analysis Summary');
  lines.push('');
  lines.push(`**Generated:** ${new Date().toISOString()}`);
  lines.push(`**Total Projects:** ${projects.length}`);
  lines.push('');

  // Executive Summary
  lines.push('## Executive Summary');
  lines.push('');

  const techStacks = new Map<string, number>();
  const frameworks = new Map<string, number>();
  const databases = new Map<string, number>();

  projects.forEach(p => {
    p.stack.languages.forEach(l => techStacks.set(l, (techStacks.get(l) || 0) + 1));
    p.stack.frameworks.forEach(f => frameworks.set(f, (frameworks.get(f) || 0) + 1));
    p.stack.databases.forEach(d => databases.set(d, (databases.get(d) || 0) + 1));
  });

  lines.push('### Tech Stack Distribution');
  lines.push('');
  lines.push('| Language/Platform | Project Count |');
  lines.push('|-------------------|---------------|');
  Array.from(techStacks.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([tech, count]) => {
      lines.push(`| ${tech} | ${count} |`);
    });
  lines.push('');

  lines.push('### Framework Distribution');
  lines.push('');
  lines.push('| Framework | Project Count |');
  lines.push('|-----------|---------------|');
  Array.from(frameworks.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([fw, count]) => {
      lines.push(`| ${fw} | ${count} |`);
    });
  lines.push('');

  lines.push('### Database Distribution');
  lines.push('');
  lines.push('| Database | Project Count |');
  lines.push('|----------|---------------|');
  Array.from(databases.entries())
    .sort((a, b) => b[1] - a[1])
    .forEach(([db, count]) => {
      lines.push(`| ${db} | ${count} |`);
    });
  lines.push('');

  // Top Skills
  lines.push('## Recommended Skills (by Priority)');
  lines.push('');
  lines.push('| Rank | Skill | Priority | Project Count | Utility | Reasoning |');
  lines.push('|------|-------|----------|---------------|---------|-----------|');

  recommendations.slice(0, 20).forEach((rec, i) => {
    lines.push(`| ${i + 1} | ${rec.skill} | ${rec.priority} | ${rec.projectCount} | ${rec.utility} | ${rec.reasoning} |`);
  });

  lines.push('');

  // By Project
  lines.push('## Projects Detail');
  lines.push('');

  projects
    .sort((a, b) => b.potentialSkills.length - a.potentialSkills.length)
    .forEach(p => {
      lines.push(`### ${p.name}`);
      lines.push('');
      lines.push(`**Path:** \`${p.path}\``);
      lines.push('');

      if (p.stack.languages.length > 0) {
        lines.push(`**Languages:** ${p.stack.languages.join(', ')}`);
      }
      if (p.stack.frameworks.length > 0) {
        lines.push(`**Frameworks:** ${p.stack.frameworks.join(', ')}`);
      }
      if (p.stack.databases.length > 0) {
        lines.push(`**Databases:** ${p.stack.databases.join(', ')}`);
      }
      if (p.stack.platforms.length > 0) {
        lines.push(`**Platforms:** ${p.stack.platforms.join(', ')}`);
      }

      lines.push('');
      lines.push(`**Documentation:**`);
      lines.push(`- README: ${p.documentation.hasReadme ? '✅' : '❌'}`);
      lines.push(`- CLAUDE.md: ${p.documentation.hasClaudeFile ? '✅' : '❌'}`);
      lines.push(`- TODO: ${p.documentation.hasTodo ? '✅' : '❌'}`);
      lines.push(`- REQUIREMENTS: ${p.documentation.hasRequirements ? '✅' : '❌'}`);

      lines.push('');
      lines.push(`**Recommended Skills (${p.potentialSkills.length}):**`);
      p.potentialSkills.forEach(skill => {
        const rec = recommendations.find(r => r.skill === skill);
        lines.push(`- ${skill} (priority: ${rec?.priority || 'N/A'})`);
      });

      lines.push('');
    });

  return lines.join('\n');
}

// Run the agent
main().catch(console.error);
