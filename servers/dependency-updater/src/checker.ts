/**
 * Dependency Checker
 * Checks for outdated dependencies across different package managers
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';
import * as semver from 'semver';
import {
  CheckOutdatedOptions,
  CheckOutdatedResult,
  OutdatedDependency,
  PackageManager,
} from './types.js';

export class DependencyChecker {
  /**
   * Check for outdated dependencies
   */
  async check(options: CheckOutdatedOptions): Promise<CheckOutdatedResult> {
    const packageManager = options.packageManager || (await this.detectPackageManager(options.projectPath));

    if (!packageManager) {
      return {
        packageManager: 'npm',
        count: 0,
        dependencies: [],
        summary: { patch: 0, minor: 0, major: 0 },
        warnings: ['Could not detect package manager'],
      };
    }

    let dependencies: OutdatedDependency[] = [];

    switch (packageManager) {
      case 'npm':
      case 'yarn':
      case 'pnpm':
        dependencies = await this.checkNpmOutdated(options.projectPath, packageManager);
        break;
      case 'pip':
      case 'poetry':
        dependencies = await this.checkPythonOutdated(options.projectPath, packageManager);
        break;
      case 'dotnet':
        dependencies = await this.checkDotNetOutdated(options.projectPath);
        break;
      case 'cargo':
        dependencies = await this.checkCargoOutdated(options.projectPath);
        break;
      case 'go':
        dependencies = await this.checkGoOutdated(options.projectPath);
        break;
    }

    // Filter by update type if specified
    if (options.updateType && options.updateType !== 'all') {
      dependencies = dependencies.filter((dep) => dep.updateType === options.updateType);
    }

    // Calculate summary
    const summary = {
      patch: dependencies.filter((d) => d.updateType === 'patch').length,
      minor: dependencies.filter((d) => d.updateType === 'minor').length,
      major: dependencies.filter((d) => d.updateType === 'major').length,
    };

    return {
      packageManager,
      count: dependencies.length,
      dependencies,
      summary,
      warnings: [],
    };
  }

  /**
   * Detect package manager from project files
   */
  private async detectPackageManager(projectPath: string): Promise<PackageManager | null> {
    const files = fs.readdirSync(projectPath);

    // Node.js
    if (files.includes('package.json')) {
      if (files.includes('pnpm-lock.yaml')) return 'pnpm';
      if (files.includes('yarn.lock')) return 'yarn';
      if (files.includes('package-lock.json')) return 'npm';
      return 'npm'; // Default to npm
    }

    // Python
    if (files.includes('pyproject.toml')) return 'poetry';
    if (files.includes('requirements.txt')) return 'pip';

    // .NET
    if (files.some((f) => f.endsWith('.csproj') || f.endsWith('.sln'))) return 'dotnet';

    // Rust
    if (files.includes('Cargo.toml')) return 'cargo';

    // Go
    if (files.includes('go.mod')) return 'go';

    return null;
  }

  /**
   * Check outdated npm/yarn/pnpm packages
   */
  private async checkNpmOutdated(projectPath: string, packageManager: PackageManager): Promise<OutdatedDependency[]> {
    try {
      const command = packageManager === 'npm'
        ? 'npm outdated --json'
        : packageManager === 'yarn'
        ? 'yarn outdated --json'
        : 'pnpm outdated --json';

      const output = execSync(command, {
        cwd: projectPath,
        encoding: 'utf-8',
        stdio: ['pipe', 'pipe', 'ignore'],
      });

      const outdated = JSON.parse(output);
      const dependencies: OutdatedDependency[] = [];

      for (const [name, info] of Object.entries(outdated)) {
        const dep = info as any;
        const updateType = this.determineUpdateType(dep.current, dep.latest);

        dependencies.push({
          name,
          current: dep.current,
          wanted: dep.wanted,
          latest: dep.latest,
          updateType,
          breaking: updateType === 'major',
          homepage: dep.homepage,
        });
      }

      return dependencies;
    } catch (error) {
      // npm outdated exits with code 1 if there are outdated packages
      // Try to parse the error output
      if (error instanceof Error && 'stdout' in error) {
        try {
          const output = (error as any).stdout.toString();
          if (output) {
            const outdated = JSON.parse(output);
            const dependencies: OutdatedDependency[] = [];

            for (const [name, info] of Object.entries(outdated)) {
              const dep = info as any;
              const updateType = this.determineUpdateType(dep.current, dep.latest);

              dependencies.push({
                name,
                current: dep.current,
                wanted: dep.wanted,
                latest: dep.latest,
                updateType,
                breaking: updateType === 'major',
                homepage: dep.homepage,
              });
            }

            return dependencies;
          }
        } catch (parseError) {
          // Failed to parse, return empty
        }
      }
      return [];
    }
  }

  /**
   * Check outdated Python packages
   */
  private async checkPythonOutdated(projectPath: string, packageManager: PackageManager): Promise<OutdatedDependency[]> {
    try {
      const command = packageManager === 'poetry'
        ? 'poetry show --outdated --no-ansi'
        : 'pip list --outdated --format=json';

      const output = execSync(command, {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      if (packageManager === 'pip') {
        const outdated = JSON.parse(output);
        return outdated.map((pkg: any) => ({
          name: pkg.name,
          current: pkg.version,
          wanted: pkg.latest_version,
          latest: pkg.latest_version,
          updateType: this.determineUpdateType(pkg.version, pkg.latest_version),
          breaking: false, // Python doesn't follow semver strictly
        }));
      } else {
        // Parse poetry output (text format)
        const lines = output.split('\n').filter((l) => l.trim());
        const dependencies: OutdatedDependency[] = [];

        for (const line of lines) {
          const match = line.match(/(\S+)\s+(\S+)\s+(\S+)/);
          if (match) {
            const [, name, current, latest] = match;
            dependencies.push({
              name,
              current,
              wanted: latest,
              latest,
              updateType: this.determineUpdateType(current, latest),
              breaking: false,
            });
          }
        }

        return dependencies;
      }
    } catch (error) {
      return [];
    }
  }

  /**
   * Check outdated .NET packages
   */
  private async checkDotNetOutdated(projectPath: string): Promise<OutdatedDependency[]> {
    try {
      const output = execSync('dotnet list package --outdated --format json', {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      const data = JSON.parse(output);
      const dependencies: OutdatedDependency[] = [];

      for (const project of data.projects || []) {
        for (const framework of project.frameworks || []) {
          for (const pkg of framework.topLevelPackages || []) {
            if (pkg.latestVersion) {
              const updateType = this.determineUpdateType(pkg.resolvedVersion, pkg.latestVersion);
              dependencies.push({
                name: pkg.id,
                current: pkg.resolvedVersion,
                wanted: pkg.requestedVersion,
                latest: pkg.latestVersion,
                updateType,
                breaking: updateType === 'major',
              });
            }
          }
        }
      }

      return dependencies;
    } catch (error) {
      return [];
    }
  }

  /**
   * Check outdated Cargo packages
   */
  private async checkCargoOutdated(projectPath: string): Promise<OutdatedDependency[]> {
    try {
      const output = execSync('cargo outdated --format json', {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      const data = JSON.parse(output);
      return (data.dependencies || []).map((dep: any) => ({
        name: dep.name,
        current: dep.project,
        wanted: dep.compat,
        latest: dep.latest,
        updateType: this.determineUpdateType(dep.project, dep.latest),
        breaking: false,
      }));
    } catch (error) {
      return [];
    }
  }

  /**
   * Check outdated Go modules
   */
  private async checkGoOutdated(projectPath: string): Promise<OutdatedDependency[]> {
    try {
      const output = execSync('go list -u -m -json all', {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      const modules = output.split('\n}\n{').map((m) => {
        try {
          return JSON.parse(m.startsWith('{') ? m : '{' + m);
        } catch {
          return null;
        }
      }).filter(Boolean);

      const dependencies: OutdatedDependency[] = [];

      for (const mod of modules) {
        if (mod.Update) {
          dependencies.push({
            name: mod.Path,
            current: mod.Version,
            wanted: mod.Update.Version,
            latest: mod.Update.Version,
            updateType: this.determineUpdateType(mod.Version, mod.Update.Version),
            breaking: false,
          });
        }
      }

      return dependencies;
    } catch (error) {
      return [];
    }
  }

  /**
   * Determine update type from version comparison
   */
  private determineUpdateType(current: string, latest: string): 'patch' | 'minor' | 'major' {
    try {
      const currentVersion = semver.coerce(current);
      const latestVersion = semver.coerce(latest);

      if (!currentVersion || !latestVersion) return 'major';

      const diff = semver.diff(currentVersion, latestVersion);

      if (diff === 'patch') return 'patch';
      if (diff === 'minor' || diff === 'prepatch' || diff === 'preminor') return 'minor';
      return 'major';
    } catch (error) {
      return 'major'; // Default to major if we can't determine
    }
  }
}
