#!/usr/bin/env node
/**
 * Security Auditor MCP Server
 * MCP server for OWASP Top 10 security scanning
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { SecurityAuditor } from './auditor.js';
import { ScanOptions } from './types.js';
import * as fs from 'fs';
import * as path from 'path';

// Create MCP server
const server = new McpServer({
  name: 'security-auditor',
  version: '0.1.0',
});

/**
 * Tool: Scan Project for Security Vulnerabilities
 *
 * Scans a project directory for OWASP Top 10 security vulnerabilities
 * including SQL injection, XSS, hardcoded secrets, weak crypto, etc.
 */
server.tool(
  'scan_project',
  {
    projectPath: z.string().describe('Absolute path to the project directory to scan'),
    language: z
      .enum(['typescript', 'javascript', 'csharp', 'python', 'all'])
      .optional()
      .describe('Programming language to scan (default: all)'),
    severityThreshold: z
      .enum(['low', 'medium', 'high', 'critical'])
      .optional()
      .describe('Minimum severity level to report (default: low)'),
    maxFindings: z
      .number()
      .optional()
      .describe('Maximum number of findings to return (default: unlimited)'),
  },
  async ({ projectPath, language, severityThreshold, maxFindings }) => {
    const options: ScanOptions = {
      projectPath,
      language: language || 'all',
      severityThreshold,
      maxFindings,
    };

    const auditor = new SecurityAuditor();
    const report = await auditor.scanProject(options);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(report, null, 2),
        },
      ],
    };
  }
);

/**
 * Tool: Scan File for Security Vulnerabilities
 *
 * Scans a single file for security vulnerabilities.
 * Useful for targeted analysis of specific files.
 */
server.tool(
  'scan_file',
  {
    filePath: z.string().describe('Absolute path to the file to scan'),
  },
  async ({ filePath }) => {
    const content = fs.readFileSync(filePath, 'utf-8');
    const ext = path.extname(filePath);

    // Import scanners dynamically
    const { TypeScriptScanner } = await import('./scanners/typescript.js');
    const { CSharpScanner } = await import('./scanners/csharp.js');
    const { PythonScanner } = await import('./scanners/python.js');

    let scanner;
    if (['.ts', '.tsx', '.js', '.jsx', '.mjs'].includes(ext)) {
      scanner = new TypeScriptScanner();
    } else if (ext === '.cs') {
      scanner = new CSharpScanner();
    } else if (ext === '.py') {
      scanner = new PythonScanner();
    } else {
      throw new Error(`Unsupported file type: ${ext}`);
    }

    const findings = scanner.scan(filePath, content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              filePath,
              totalFindings: findings.length,
              findings,
            },
            null,
            2
          ),
        },
      ],
    };
  }
);

/**
 * Tool: Get Security Recommendations
 *
 * Get security recommendations based on vulnerability types found.
 * Returns actionable guidance for improving security posture.
 */
server.tool(
  'get_recommendations',
  {
    vulnerabilityTypes: z
      .array(
        z.enum([
          'sql-injection',
          'xss',
          'hardcoded-secret',
          'insecure-crypto',
          'cors-misconfiguration',
          'weak-authentication',
          'path-traversal',
          'insecure-deserialization',
          'xxe',
          'broken-access-control',
        ])
      )
      .describe('Array of vulnerability types found'),
  },
  async ({ vulnerabilityTypes }) => {
    const types = new Set(vulnerabilityTypes);
    const recommendations: string[] = [];

    if (types.has('sql-injection')) {
      recommendations.push('Implement parameterized queries for all database operations');
      recommendations.push('Use ORM frameworks with built-in SQL injection protection');
      recommendations.push('Validate and sanitize all user inputs');
    }

    if (types.has('xss')) {
      recommendations.push('Implement Content Security Policy (CSP) headers');
      recommendations.push('Use HTML sanitization libraries like DOMPurify');
      recommendations.push('Enable auto-escaping in template engines');
      recommendations.push('Avoid innerHTML and dangerouslySetInnerHTML');
    }

    if (types.has('hardcoded-secret')) {
      recommendations.push('Move all secrets to environment variables');
      recommendations.push('Use a secrets management system (Azure Key Vault, AWS Secrets Manager)');
      recommendations.push('Implement pre-commit hooks to prevent secret commits');
      recommendations.push('Rotate any exposed credentials immediately');
    }

    if (types.has('insecure-crypto')) {
      recommendations.push('Upgrade to strong cryptographic algorithms (SHA256+, AES)');
      recommendations.push('Review and update crypto libraries to latest versions');
      recommendations.push('Avoid MD5, SHA1, DES, and 3DES');
    }

    if (types.has('cors-misconfiguration')) {
      recommendations.push('Configure CORS with explicit origin allowlist');
      recommendations.push('Avoid wildcard (*) CORS origins in production');
      recommendations.push('Use credentials: true only with specific origins');
    }

    if (types.has('weak-authentication')) {
      recommendations.push('Implement strong password hashing (bcrypt with 12+ rounds)');
      recommendations.push('Use secure session configuration (httpOnly, secure, sameSite flags)');
      recommendations.push('Implement JWT with strong secrets (32+ characters)');
      recommendations.push('Enable multi-factor authentication (MFA)');
    }

    if (types.has('insecure-deserialization')) {
      recommendations.push('Avoid deserializing untrusted data');
      recommendations.push('Use safe serialization formats like JSON');
      recommendations.push('Implement input validation before deserialization');
    }

    if (types.has('path-traversal')) {
      recommendations.push('Validate and sanitize all file paths');
      recommendations.push('Use allowlist-based path validation');
      recommendations.push('Use path.resolve() and check against allowed directories');
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ recommendations }, null, 2),
        },
      ],
    };
  }
);

/**
 * Start the MCP server
 */
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);

  // Log to stderr so it doesn't interfere with MCP protocol on stdout
  console.error('Security Auditor MCP server running on stdio');
}

main().catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});
