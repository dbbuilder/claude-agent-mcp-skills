/**
 * Semver Tests
 * Tests for semantic version comparison logic
 */

import * as semver from 'semver';

describe('Semver Version Comparison', () => {
  describe('Patch Updates', () => {
    it('should identify patch version bumps', () => {
      const current = semver.coerce('1.2.3');
      const latest = semver.coerce('1.2.4');

      expect(current).toBeTruthy();
      expect(latest).toBeTruthy();

      const diff = semver.diff(current!, latest!);
      expect(diff).toBe('patch');
    });

    it('should handle patch with build metadata', () => {
      const current = semver.coerce('1.2.3+build1');
      const latest = semver.coerce('1.2.4+build2');

      const diff = semver.diff(current!, latest!);
      expect(diff).toBe('patch');
    });
  });

  describe('Minor Updates', () => {
    it('should identify minor version bumps', () => {
      const current = semver.coerce('1.2.3');
      const latest = semver.coerce('1.3.0');

      const diff = semver.diff(current!, latest!);
      expect(diff).toBe('minor');
    });

    it('should treat minor bumps as non-breaking', () => {
      const current = '1.2.3';
      const latest = '1.3.0';

      const isBreaking = semver.major(latest) > semver.major(current);
      expect(isBreaking).toBe(false);
    });
  });

  describe('Major Updates', () => {
    it('should identify major version bumps', () => {
      const current = semver.coerce('1.2.3');
      const latest = semver.coerce('2.0.0');

      const diff = semver.diff(current!, latest!);
      expect(diff).toBe('major');
    });

    it('should treat major bumps as potentially breaking', () => {
      const current = '1.2.3';
      const latest = '2.0.0';

      const isBreaking = semver.major(latest) > semver.major(current);
      expect(isBreaking).toBe(true);
    });

    it('should handle multiple major versions ahead', () => {
      const current = semver.coerce('2.5.0');
      const latest = semver.coerce('5.1.0');

      const diff = semver.diff(current!, latest!);
      expect(diff).toBe('major');
    });
  });

  describe('Version Coercion', () => {
    it('should coerce npm versions with ^ or ~', () => {
      const version1 = semver.coerce('^4.18.0');
      const version2 = semver.coerce('~1.2.3');

      expect(version1?.version).toBe('4.18.0');
      expect(version2?.version).toBe('1.2.3');
    });

    it('should handle versions with v prefix', () => {
      const version = semver.coerce('v1.2.3');
      expect(version?.version).toBe('1.2.3');
    });

    it('should handle loose versions', () => {
      const version = semver.coerce('1.2');
      expect(version?.version).toBe('1.2.0');
    });

    it('should return null for invalid versions', () => {
      const version = semver.coerce('latest');
      expect(version).toBeNull();
    });
  });

  describe('Range Satisfaction', () => {
    it('should check if version satisfies range', () => {
      expect(semver.satisfies('1.2.3', '^1.0.0')).toBe(true);
      expect(semver.satisfies('1.2.3', '^2.0.0')).toBe(false);
    });

    it('should handle tilde ranges', () => {
      expect(semver.satisfies('1.2.5', '~1.2.0')).toBe(true);
      expect(semver.satisfies('1.3.0', '~1.2.0')).toBe(false);
    });
  });

  describe('Version Sorting', () => {
    it('should sort versions correctly', () => {
      const versions = ['1.2.3', '2.0.0', '1.3.0', '1.2.4'];
      const sorted = versions.sort(semver.compare);

      expect(sorted).toEqual(['1.2.3', '1.2.4', '1.3.0', '2.0.0']);
    });

    it('should find latest version', () => {
      const versions = ['1.2.3', '2.0.0', '1.3.0', '1.2.4'];
      const latest = semver.maxSatisfying(versions, '*');

      expect(latest).toBe('2.0.0');
    });
  });
});
