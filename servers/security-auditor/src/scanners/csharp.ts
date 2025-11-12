/**
 * C# Security Scanner
 * Detects SQL injection, crypto issues, and other vulnerabilities in C# code
 */

import { Finding, Scanner, Pattern } from '../types';
import { CRYPTO_PATTERNS, findMatches, generateFindingId } from './common';

/**
 * SQL Injection patterns for C#
 */
const SQL_INJECTION_PATTERNS: Pattern[] = [
  {
    regex: /(?:ExecuteSqlCommand|ExecuteSqlRaw|ExecuteSqlCommandAsync|ExecuteSqlRawAsync)\s*\([^)]*\+[^)]*\)/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection in Entity Framework raw SQL with string concatenation',
    recommendation: 'Use ExecuteSqlInterpolated or FromSqlInterpolated: context.Database.ExecuteSqlInterpolated($"SELECT * FROM Users WHERE Id = {id}")',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /new\s+SqlCommand\s*\([^,]*\+[^,)]*,/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via string concatenation in SqlCommand',
    recommendation: 'Use parameterized queries: cmd.Parameters.AddWithValue("@id", id)',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /CommandText\s*=\s*[^;]*\+\s*/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection via string concatenation in CommandText',
    recommendation: 'Use command parameters instead of string concatenation',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
  {
    regex: /FromSqlRaw\s*\([^)]*\+[^)]*\)/g,
    type: 'sql-injection',
    severity: 'critical',
    message: 'SQL injection in LINQ FromSqlRaw with concatenation',
    recommendation: 'Use FromSqlInterpolated with interpolated strings',
    cwe: 'CWE-89',
    owasp: 'A03:2021 – Injection',
  },
];

/**
 * Authentication/Authorization patterns for C#
 */
const AUTH_PATTERNS: Pattern[] = [
  {
    regex: /\[AllowAnonymous\][^\[]*\[HttpPost\]|  \[HttpPost\][^\[]*\[AllowAnonymous\]/g,
    type: 'weak-authentication',
    severity: 'high',
    message: 'POST endpoint allows anonymous access - potential security risk',
    recommendation: 'Review if anonymous access is necessary for POST/PUT/DELETE endpoints',
    cwe: 'CWE-306',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
  {
    regex: /\.RequireHttpsMetadata\s*=\s*false/g,
    type: 'weak-authentication',
    severity: 'high',
    message: 'HTTPS metadata validation disabled in authentication',
    recommendation: 'Enable HTTPS metadata validation in production',
    cwe: 'CWE-319',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    regex: /ValidateIssuerSigningKey\s*=\s*false/g,
    type: 'weak-authentication',
    severity: 'critical',
    message: 'JWT issuer signing key validation disabled',
    recommendation: 'Always validate issuer signing key: ValidateIssuerSigningKey = true',
    cwe: 'CWE-347',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
];

/**
 * Deserialization patterns for C#
 */
const DESERIALIZATION_PATTERNS: Pattern[] = [
  {
    regex: /BinaryFormatter|ObjectStateFormatter|NetDataContractSerializer/g,
    type: 'insecure-deserialization',
    severity: 'critical',
    message: 'Insecure deserialization - BinaryFormatter is vulnerable',
    recommendation: 'Use JSON serialization with JsonSerializer or System.Text.Json',
    cwe: 'CWE-502',
    owasp: 'A08:2021 – Software and Data Integrity Failures',
  },
  {
    regex: /JavaScriptSerializer|DataContractJsonSerializer/g,
    type: 'insecure-deserialization',
    severity: 'medium',
    message: 'Legacy JSON deserializer - prefer System.Text.Json',
    recommendation: 'Use System.Text.Json.JsonSerializer for better security',
    cwe: 'CWE-502',
    owasp: 'A08:2021 – Software and Data Integrity Failures',
  },
];

/**
 * Path traversal patterns for C#
 */
const PATH_TRAVERSAL_PATTERNS: Pattern[] = [
  {
    regex: /Path\.Combine\s*\([^)]*\+[^)]*\)|File\.(ReadAllText|WriteAllText|Open|Create)\s*\([^)]*\+/g,
    type: 'path-traversal',
    severity: 'high',
    message: 'Path traversal risk - unsanitized user input in file path',
    recommendation: 'Validate and sanitize file paths: Path.GetFullPath() and check against allowed directory',
    cwe: 'CWE-22',
    owasp: 'A01:2021 – Broken Access Control',
  },
];

export class CSharpScanner implements Scanner {
  name = 'C# Scanner';
  fileExtensions = ['.cs'];

  private allPatterns: Pattern[] = [
    ...SQL_INJECTION_PATTERNS,
    ...AUTH_PATTERNS,
    ...DESERIALIZATION_PATTERNS,
    ...PATH_TRAVERSAL_PATTERNS,
    ...CRYPTO_PATTERNS,
  ];

  scan(filePath: string, content: string): Finding[] {
    const findings: Finding[] = [];

    // Skip bin, obj, and packages directories
    if (filePath.includes('/bin/') || filePath.includes('/obj/') || filePath.includes('/packages/')) {
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
