/**
 * Shared validation utilities
 */

import { z } from 'zod';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Common validation schemas
 */

export const PathSchema = z.string().refine(
  (p) => {
    try {
      return path.isAbsolute(p) || p === '.';
    } catch {
      return false;
    }
  },
  { message: 'Must be a valid path' }
);

export const DirectorySchema = PathSchema.refine(
  (p) => {
    try {
      const stats = fs.statSync(p);
      return stats.isDirectory();
    } catch {
      return false;
    }
  },
  { message: 'Directory does not exist' }
);

export const FileSchema = PathSchema.refine(
  (p) => {
    try {
      const stats = fs.statSync(p);
      return stats.isFile();
    } catch {
      return false;
    }
  },
  { message: 'File does not exist' }
);

export const FrameworkSchema = z.enum([
  'express',
  'fastapi',
  'aspnet',
  'nextjs',
  'react',
  'vue',
  'django',
  'flask',
]);

export const OutputFormatSchema = z.enum([
  'json',
  'markdown',
  'html',
  'yaml',
]);

export const ProjectTypeSchema = z.enum([
  'nodejs',
  'nodejs-typescript',
  'python-fastapi',
  'python-django',
  'dotnet-aspnet',
  'react',
  'vue',
  'nextjs',
  'static',
]);

/**
 * Validation error formatter
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly errors: z.ZodIssue[]
  ) {
    super(message);
    this.name = 'ValidationError';
  }

  toJSON() {
    return {
      name: this.name,
      message: this.message,
      errors: this.errors.map(e => ({
        path: e.path.join('.'),
        message: e.message,
        code: e.code,
      })),
    };
  }
}

/**
 * Validate input with Zod schema
 */
export function validate<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): T {
  const result = schema.safeParse(data);

  if (!result.success) {
    throw new ValidationError(
      'Validation failed',
      result.error.errors
    );
  }

  return result.data;
}

/**
 * Validate input and return result
 */
export function validateSafe<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ValidationError } {
  const result = schema.safeParse(data);

  if (!result.success) {
    return {
      success: false,
      error: new ValidationError('Validation failed', result.error.errors),
    };
  }

  return {
    success: true,
    data: result.data,
  };
}

/**
 * Common input schemas for MCP servers
 */

export const AuditInputSchema = z.object({
  projectPath: DirectorySchema,
  outputPath: PathSchema.optional(),
  format: OutputFormatSchema.default('markdown'),
  includePrivate: z.boolean().default(false),
});

export const GenerateInputSchema = z.object({
  projectPath: DirectorySchema,
  outputPath: PathSchema.optional(),
  framework: FrameworkSchema.optional(),
  format: OutputFormatSchema.default('markdown'),
});

export const ScaffoldInputSchema = z.object({
  projectType: ProjectTypeSchema,
  projectName: z.string().min(1).regex(/^[a-z0-9-]+$/i, {
    message: 'Project name must contain only letters, numbers, and hyphens',
  }),
  outputPath: PathSchema.default('.'),
  includeGit: z.boolean().default(true),
  includeDependencies: z.boolean().default(true),
});

export const UpdateDependenciesInputSchema = z.object({
  projectPath: DirectorySchema,
  strategy: z.enum(['conservative', 'balanced', 'aggressive']).default('balanced'),
  dryRun: z.boolean().default(false),
  includeDevDependencies: z.boolean().default(true),
});
