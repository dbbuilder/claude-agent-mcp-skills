/**
 * TypeScript/JavaScript Security Scanner
 * Detects SQL injection, XSS, and other vulnerabilities in TS/JS code
 */

import { Finding, Scanner, Pattern } from '../types';
import {
  SECRET_PATTERNS,
  CRYPTO_PATTERNS,
  CORS_PATTERNS,
  findMatches,
  generateFindingId,
} from './common';

/**
 * SQL Injection patterns for TypeScript/JavaScript
 */
const SQL_INJECTION_PATTERNS: Pattern[] = [
  {
    regex: /=\s*`[^`]*SELECT[^`]*\$\{[^}]+\}[^`]*`/gi,
    type: 'sql-injection',
    severity: 'critical',
    message: 'Potential SQL injection vulnerability - template literal with user input',
    recommendation: 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [id])',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /(?:query|execute|exec)\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'Potential SQL injection vulnerability - template literal with user input',
    recommendation: 'Use parameterized queries: db.query("SELECT * FROM users WHERE id = ?", [id])',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /(?:query|execute|exec)\s*\(\s*["'][^"']*["']\s*\+\s*[^,\)]+/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'Potential SQL injection vulnerability - string concatenation in query',
    recommendation: 'Use parameterized queries instead of string concatenation',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /\.raw\s*\(\s*`[^`]*\$\{[^}]+\}[^`]*`/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection risk in raw query with template literal',
    recommendation: 'Use ORM parameterized methods or prepared statements',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /ExecuteSqlRaw\s*\([^)]*\+[^)]*\)/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection in Entity Framework raw SQL with concatenation',
    recommendation: 'Use ExecuteSqlInterpolated or FromSqlInterpolated with parameters',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
];

/**
 * XSS patterns for React/Vue/Angular
 */
const XSS_PATTERNS: Pattern[] = [
  {
    regex: /dangerouslySetInnerHTML\s*=\s*\{\s*\{\s*__html\s*:\s*(?!['"]<|DOMPurify)/g,
    type: 'xss',
    severity: 'high',
    message: 'XSS vulnerability - dangerouslySetInnerHTML without sanitization',
    recommendation: 'Sanitize HTML with DOMPurify before rendering: DOMPurify.sanitize(html)',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /v-html\s*=\s*["'][^"']*(?!DOMPurify|sanitize)/g,
    type: 'xss',
    severity: 'high',
    message: 'XSS vulnerability - Vue v-html without sanitization',
    recommendation: 'Sanitize HTML before using v-html directive',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /innerHTML\s*=\s*[^;]*(?!DOMPurify|sanitize)/g,
    type: 'xss',
    severity: 'high',
    message: 'XSS vulnerability - innerHTML assignment without sanitization',
    recommendation: 'Use textContent for text or sanitize HTML with DOMPurify',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /\.html\s*\(\s*(?!['"]<|DOMPurify)[^)]+\)/g,
    type: 'xss',
    severity: 'high',
    message: 'XSS vulnerability - jQuery .html() without sanitization',
    recommendation: 'Use .text() for text content or sanitize HTML with DOMPurify',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /document\.write\s*\(/g,
    type: 'xss',
    severity: 'medium',
    message: 'XSS risk - document.write can lead to XSS',
    recommendation: 'Avoid document.write, use DOM manipulation methods',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
];

/**
 * Authentication/Authorization patterns
 */
const AUTH_PATTERNS: Pattern[] = [
  {
    regex: /jwt\.sign\s*\([^,]+,\s*["'][^"']{1,15}["']/g,
    type: 'weak-authentication',
    severity: 'high',
    message: 'Weak JWT secret - less than 16 characters',
    recommendation: 'Use strong secret (32+ characters) from environment variables',
    cwe: 'CWE-326',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    regex: /bcrypt\.hash\s*\([^,]+,\s*[1-9]\s*\)/g,
    type: 'weak-authentication',
    severity: 'medium',
    message: 'Low bcrypt rounds - vulnerable to brute force',
    recommendation: 'Use at least 10 rounds: bcrypt.hash(password, 12)',
    cwe: 'CWE-916',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    regex: /session\s*\(\s*\{[^}]*secure\s*:\s*false/gi,
    type: 'weak-authentication',
    severity: 'high',
    message: 'Session cookie without secure flag',
    recommendation: 'Enable secure flag: session({ secure: true })',
    cwe: 'CWE-614',
    owasp: 'A05:2021 – Security Misconfiguration',
  },
];

export class TypeScriptScanner implements Scanner {
  name = 'TypeScript/JavaScript Scanner';
  fileExtensions = ['.ts', '.tsx', '.js', '.jsx', '.mjs'];

  private allPatterns: Pattern[] = [
    ...SQL_INJECTION_PATTERNS,
    ...XSS_PATTERNS,
    ...AUTH_PATTERNS,
    ...SECRET_PATTERNS,
    ...CRYPTO_PATTERNS,
    ...CORS_PATTERNS,
  ];

  scan(filePath: string, content: string): Finding[] {
    const findings: Finding[] = [];

    // Skip node_modules and build output
    if (filePath.includes('node_modules') || filePath.includes('/dist/') || filePath.includes('/build/')) {
      return findings;
    }

    for (const pattern of this.allPatterns) {
      const matches = findMatches(content, pattern, filePath);

      for (const match of matches) {
        findings.push({
          id: generateFindingId(pattern.type, filePath, match.line),
          type: pattern.type,
          severity: pattern.severity,
          file: filePath,
          line: match.line,
          column: match.column,
          code: match.code,
          message: pattern.message,
          recommendation: pattern.recommendation,
          cwe: pattern.cwe,
          owasp: pattern.owasp,
          autoFixAvailable: false, // TODO: Implement auto-fix
        });
      }
    }

    return findings;
  }
}
