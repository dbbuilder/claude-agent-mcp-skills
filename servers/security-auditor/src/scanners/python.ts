/**
 * Python Security Scanner
 * Detects SQL injection, command injection, and other vulnerabilities in Python code
 */

import { Finding, Scanner, Pattern } from '../types';
import { SECRET_PATTERNS, CRYPTO_PATTERNS, findMatches, generateFindingId } from './common';

/**
 * SQL Injection patterns for Python
 */
const SQL_INJECTION_PATTERNS: Pattern[] = [
  {
    regex: /=\s*f["'][^"']*SELECT[^"']*\{[^}]+\}/gi,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via f-string in SQL query',
    recommendation: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = ?", (id,))',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /=\s*["'][^"']*SELECT[^"']*["']\s*\+\s*/gi,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via string concatenation in SQL query',
    recommendation: 'Use parameterized queries instead of string concatenation',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /=\s*["'][^"']*SELECT[^"']*["']\s*%\s*/gi,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via % string formatting in query',
    recommendation: 'Use parameterized queries instead of % formatting',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /(?:execute|executemany)\s*\(\s*f["'][^"']*\{[^}]+\}/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via f-string in database execute',
    recommendation: 'Use parameterized queries: cursor.execute("SELECT * FROM users WHERE id = %s", (id,))',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /(?:execute|executemany)\s*\(\s*["'][^"']*["']\s*\.\s*format\s*\(/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via .format() in database query',
    recommendation: 'Use parameterized queries with placeholders',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /(?:execute|executemany)\s*\(\s*["'][^"']*["']\s*%\s*/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via % string formatting in query',
    recommendation: 'Use parameterized queries instead of % formatting',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /\.raw\s*\(\s*f["'][^"']*\{[^}]+\}/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection in Django raw query with f-string',
    recommendation: 'Use parameterized raw queries: Model.objects.raw("SELECT * FROM table WHERE id = %s", [id])',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
];

/**
 * Command injection patterns for Python
 */
const COMMAND_INJECTION_PATTERNS: Pattern[] = [
  {
    regex: /os\.system\s*\(\s*f["'][^"']*\{|subprocess\.(?:call|run|Popen)\s*\(\s*f["'][^"']*\{/g,
    type: 'sql-injection', // Using sql-injection type for command injection
    severity: 'critical',
    message: 'Command injection via f-string in system command',
    recommendation: 'Use subprocess with list arguments: subprocess.run(["command", arg1, arg2])',
    cwe: 'CWE-78',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /os\.system\s*\([^)]*\+[^)]*\)|subprocess\.(?:call|run|Popen)\s*\([^)]*\+/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'Command injection via string concatenation',
    recommendation: 'Use subprocess with list arguments instead of shell=True',
    cwe: 'CWE-78',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /shell\s*=\s*True/g,
    type: 'sql-injection',
    severity: 'high',
    message: 'Command injection risk - shell=True enables shell injection',
    recommendation: 'Remove shell=True and use list arguments',
    cwe: 'CWE-78',
    owasp: 'A03:2021 – Injection',
  },
];

/**
 * Path traversal patterns for Python
 */
const PATH_TRAVERSAL_PATTERNS: Pattern[] = [
  {
    regex: /open\s*\(\s*f["'][^"']*\{[^}]+\}[^"']*["']/g,
    type: 'path-traversal',
    severity: 'high',
    message: 'Path traversal risk - unsanitized user input in file path',
    recommendation: 'Validate paths with os.path.realpath() and check against allowed directory',
    cwe: 'CWE-22',
    owasp: 'A01:2021 – Broken Access Control',
  },
];

/**
 * Deserialization patterns for Python
 */
const DESERIALIZATION_PATTERNS: Pattern[] = [
  {
    regex: /pickle\.loads?\s*\(/g,
    type: 'insecure-deserialization',
    severity: 'critical',
    message: 'Insecure deserialization - pickle is unsafe with untrusted data',
    recommendation: 'Use json.loads() for JSON data or validate pickle data source',
    cwe: 'CWE-502',
    owasp: 'A08:2021 – Software and Data Integrity Failures',
  },
  {
    regex: /yaml\.load\s*\([^)]*\)/g,
    type: 'insecure-deserialization',
    severity: 'high',
    message: 'Unsafe YAML loading - yaml.load() can execute arbitrary code',
    recommendation: 'Use yaml.safe_load() instead of yaml.load()',
    cwe: 'CWE-502',
    owasp: 'A08:2021 – Software and Data Integrity Failures',
  },
];

/**
 * XSS patterns for Python (Flask/Django templates)
 */
const XSS_PATTERNS: Pattern[] = [
  {
    regex: /\|\s*safe\s*[}%]/g,
    type: 'xss',
    severity: 'high',
    message: 'XSS risk - Jinja2 |safe filter disables escaping',
    recommendation: 'Remove |safe filter unless content is sanitized',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /mark_safe\s*\(/g,
    type: 'xss',
    severity: 'high',
    message: 'XSS risk - Django mark_safe() bypasses escaping',
    recommendation: 'Sanitize HTML before using mark_safe()',
    cwe: 'CWE-79',
    owasp: 'A03:2021 – Injection',
  },
];

/**
 * Weak crypto patterns for Python
 */
const PYTHON_CRYPTO_PATTERNS: Pattern[] = [
  {
    regex: /hashlib\.md5\s*\(|hashlib\.sha1\s*\(/g,
    type: 'insecure-crypto',
    severity: 'high',
    message: 'Weak hashing algorithm (MD5/SHA1)',
    recommendation: 'Use hashlib.sha256() or stronger',
    cwe: 'CWE-327',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
];

export class PythonScanner implements Scanner {
  name = 'Python Scanner';
  fileExtensions = ['.py'];

  private allPatterns: Pattern[] = [
    ...SQL_INJECTION_PATTERNS,
    ...COMMAND_INJECTION_PATTERNS,
    ...PATH_TRAVERSAL_PATTERNS,
    ...DESERIALIZATION_PATTERNS,
    ...XSS_PATTERNS,
    ...PYTHON_CRYPTO_PATTERNS,
    ...SECRET_PATTERNS,
    ...CRYPTO_PATTERNS,
  ];

  scan(filePath: string, content: string): Finding[] {
    const findings: Finding[] = [];

    // Skip virtual environments and cache
    if (
      filePath.includes('venv/') ||
      filePath.includes('__pycache__') ||
      filePath.includes('.pyc')
    ) {
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
          autoFixAvailable: false,
        });
      }
    }

    return findings;
  }
}
