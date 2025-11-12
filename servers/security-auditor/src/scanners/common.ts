/**
 * Common Security Patterns
 * Shared patterns for detecting vulnerabilities across all languages
 */

import { Pattern, VulnerabilityType } from '../types';

/**
 * Patterns for detecting hardcoded secrets
 */
export const SECRET_PATTERNS: Pattern[] = [
  {
    regex: /(?:api[_-]?key|apikey)\s*[=:]\s*["']([a-zA-Z0-9_\-]{20,})["']/gi,
    type: 'hardcoded-secret',
    severity: 'critical',
    message: 'Hardcoded API key detected',
    recommendation: 'Move API keys to environment variables or secure key management',
    cwe: 'CWE-798',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
  {
    regex: /(?:password|passwd|pwd)\s*[=:]\s*["']([^"'\s]{8,})["']/gi,
    type: 'hardcoded-secret',
    severity: 'critical',
    message: 'Hardcoded password detected',
    recommendation: 'Use environment variables or secure credential storage',
    cwe: 'CWE-798',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
  {
    regex: /(?:jwt[_-]?secret|secret[_-]?key)\s*[=:]\s*["']([^"'\s]{16,})["']/gi,
    type: 'hardcoded-secret',
    severity: 'critical',
    message: 'Hardcoded JWT secret detected',
    recommendation: 'Store JWT secrets in environment variables with strong encryption',
    cwe: 'CWE-798',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    regex: /(?:bearer|token)\s+["']([a-zA-Z0-9_\-\.]{40,})["']/gi,
    type: 'hardcoded-secret',
    severity: 'high',
    message: 'Hardcoded authentication token detected',
    recommendation: 'Use secure token management and environment variables',
    cwe: 'CWE-798',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
  {
    regex: /sk-[a-zA-Z0-9]{32,}/g,
    type: 'hardcoded-secret',
    severity: 'critical',
    message: 'Hardcoded secret key (API key pattern) detected',
    recommendation: 'Remove secret keys from source code and use environment variables',
    cwe: 'CWE-798',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
  {
    regex: /(?:aws[_-]?access[_-]?key[_-]?id|aws[_-]?secret[_-]?access[_-]?key)\s*[=:]\s*["']([A-Z0-9]{16,})["']/gi,
    type: 'hardcoded-secret',
    severity: 'critical',
    message: 'AWS credentials hardcoded',
    recommendation: 'Use IAM roles or AWS credentials file',
    cwe: 'CWE-798',
    owasp: 'A07:2021 – Identification and Authentication Failures',
  },
];

/**
 * Patterns for detecting insecure cryptography
 */
export const CRYPTO_PATTERNS: Pattern[] = [
  {
    regex: /MD5\.Create\(\)|MD5CryptoServiceProvider/g,
    type: 'insecure-crypto',
    severity: 'high',
    message: 'MD5 hashing algorithm is cryptographically broken',
    recommendation: 'Use SHA256 or stronger: SHA256.Create()',
    cwe: 'CWE-327',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    regex: /SHA1\.Create\(\)|SHA1CryptoServiceProvider/g,
    type: 'insecure-crypto',
    severity: 'high',
    message: 'SHA1 hashing algorithm is cryptographically weak',
    recommendation: 'Use SHA256 or stronger: SHA256.Create()',
    cwe: 'CWE-327',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    regex: /DES\.Create\(\)|DESCryptoServiceProvider|TripleDES/g,
    type: 'insecure-crypto',
    severity: 'high',
    message: 'DES/3DES encryption is insecure',
    recommendation: 'Use AES encryption: Aes.Create()',
    cwe: 'CWE-327',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
  {
    regex: /createHash\(['"]md5['"]\)/g,
    type: 'insecure-crypto',
    severity: 'high',
    message: 'MD5 hashing in Node.js is insecure',
    recommendation: 'Use SHA256 or stronger: createHash("sha256")',
    cwe: 'CWE-327',
    owasp: 'A02:2021 – Cryptographic Failures',
  },
];

/**
 * Patterns for CORS misconfiguration
 */
export const CORS_PATTERNS: Pattern[] = [
  {
    regex: /Access-Control-Allow-Origin["']?\s*[=:]\s*["']\*["']/gi,
    type: 'cors-misconfiguration',
    severity: 'medium',
    message: 'CORS configured with wildcard (*) origin',
    recommendation: 'Specify explicit allowed origins instead of wildcard',
    cwe: 'CWE-942',
    owasp: 'A05:2021 – Security Misconfiguration',
  },
  {
    regex: /cors\(\s*\{\s*origin\s*:\s*["']\*["']/gi,
    type: 'cors-misconfiguration',
    severity: 'medium',
    message: 'CORS middleware configured with wildcard origin',
    recommendation: 'Use origin allowlist: origin: ["https://trusted.com"]',
    cwe: 'CWE-942',
    owasp: 'A05:2021 – Security Misconfiguration',
  },
];

/**
 * Utility function to find pattern matches in code
 */
export function findMatches(
  content: string,
  pattern: Pattern,
  filePath: string
): Array<{
  line: number;
  column: number;
  code: string;
  match: RegExpExecArray;
}> {
  const matches: Array<{
    line: number;
    column: number;
    code: string;
    match: RegExpExecArray;
  }> = [];

  const lines = content.split('\n');

  lines.forEach((lineContent, lineIndex) => {
    pattern.regex.lastIndex = 0; // Reset regex state
    let match: RegExpExecArray | null;

    while ((match = pattern.regex.exec(lineContent)) !== null) {
      matches.push({
        line: lineIndex + 1,
        column: match.index + 1,
        code: lineContent.trim(),
        match,
      });
    }
  });

  return matches;
}

/**
 * Generate unique finding ID
 */
export function generateFindingId(type: VulnerabilityType, file: string, line: number): string {
  const hash = Buffer.from(`${type}-${file}-${line}`).toString('base64').slice(0, 8);
  return `${type}-${hash}`;
}
