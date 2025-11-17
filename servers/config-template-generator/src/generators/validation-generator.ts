/**
 * Validation Schema Generator
 * Generates Zod, Joi, or Yup validation schemas
 */

import { ConfigVariable, ConfigVarType } from '../types.js';

export class ValidationGenerator {
  /**
   * Generate Zod validation schema
   */
  generateZod(variables: ConfigVariable[]): string {
    const lines: string[] = [];

    lines.push("import { z } from 'zod';");
    lines.push('');
    lines.push('/**');
    lines.push(' * Environment variable validation schema');
    lines.push(' * Auto-generated from configuration discovery');
    lines.push(' */');
    lines.push('export const envSchema = z.object({');

    for (const variable of variables) {
      const zodType = this.getZodType(variable);
      const comment = variable.description ? `  // ${variable.description}` : '';

      if (comment) lines.push(comment);

      if (variable.required) {
        lines.push(`  ${variable.name}: ${zodType},`);
      } else {
        lines.push(`  ${variable.name}: ${zodType}.optional(),`);
      }
    }

    lines.push('});');
    lines.push('');
    lines.push('export type Env = z.infer<typeof envSchema>;');
    lines.push('');
    lines.push('/**');
    lines.push(' * Validate and parse environment variables');
    lines.push(' */');
    lines.push('export function validateEnv(): Env {');
    lines.push('  const result = envSchema.safeParse(process.env);');
    lines.push('');
    lines.push('  if (!result.success) {');
    lines.push('    console.error("Environment validation failed:");');
    lines.push('    console.error(result.error.format());');
    lines.push('    process.exit(1);');
    lines.push('  }');
    lines.push('');
    lines.push('  return result.data;');
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Generate Joi validation schema
   */
  generateJoi(variables: ConfigVariable[]): string {
    const lines: string[] = [];

    lines.push("import Joi from 'joi';");
    lines.push('');
    lines.push('/**');
    lines.push(' * Environment variable validation schema');
    lines.push(' * Auto-generated from configuration discovery');
    lines.push(' */');
    lines.push('export const envSchema = Joi.object({');

    for (const variable of variables) {
      const joiType = this.getJoiType(variable);
      const comment = variable.description ? `  // ${variable.description}` : '';

      if (comment) lines.push(comment);

      if (variable.required) {
        lines.push(`  ${variable.name}: ${joiType}.required(),`);
      } else {
        lines.push(`  ${variable.name}: ${joiType}.optional(),`);
      }
    }

    lines.push('});');
    lines.push('');
    lines.push('/**');
    lines.push(' * Validate environment variables');
    lines.push(' */');
    lines.push('export function validateEnv() {');
    lines.push('  const { error, value } = envSchema.validate(process.env, {');
    lines.push('    abortEarly: false,');
    lines.push('    allowUnknown: true,');
    lines.push('  });');
    lines.push('');
    lines.push('  if (error) {');
    lines.push('    console.error("Environment validation failed:");');
    lines.push('    console.error(error.details);');
    lines.push('    process.exit(1);');
    lines.push('  }');
    lines.push('');
    lines.push('  return value;');
    lines.push('}');

    return lines.join('\n');
  }

  /**
   * Get Zod type for config variable
   */
  private getZodType(variable: ConfigVariable): string {
    let zodType: string;

    switch (variable.type) {
      case 'string':
        zodType = 'z.string()';
        if (variable.minLength) zodType += `.min(${variable.minLength})`;
        if (variable.maxLength) zodType += `.max(${variable.maxLength})`;
        if (variable.pattern) zodType += `.regex(/${variable.pattern}/)`;
        break;

      case 'number':
      case 'port':
        zodType = 'z.coerce.number()';
        if (variable.min !== undefined) zodType += `.min(${variable.min})`;
        if (variable.max !== undefined) zodType += `.max(${variable.max})`;
        break;

      case 'boolean':
        zodType = 'z.coerce.boolean()';
        break;

      case 'url':
        zodType = 'z.string().url()';
        break;

      case 'email':
        zodType = 'z.string().email()';
        break;

      case 'database_url':
        zodType = 'z.string().url()';
        break;

      case 'api_key':
      case 'secret':
      case 'jwt_secret':
        zodType = 'z.string().min(16)';
        break;

      case 'path':
        zodType = 'z.string()';
        break;

      case 'json':
        zodType = 'z.string().transform((str) => JSON.parse(str))';
        break;

      default:
        zodType = 'z.string()';
    }

    if (variable.defaultValue) {
      zodType += `.default("${variable.defaultValue}")`;
    }

    return zodType;
  }

  /**
   * Get Joi type for config variable
   */
  private getJoiType(variable: ConfigVariable): string {
    let joiType: string;

    switch (variable.type) {
      case 'string':
        joiType = 'Joi.string()';
        if (variable.minLength) joiType += `.min(${variable.minLength})`;
        if (variable.maxLength) joiType += `.max(${variable.maxLength})`;
        if (variable.pattern) joiType += `.pattern(/${variable.pattern}/)`;
        break;

      case 'number':
      case 'port':
        joiType = 'Joi.number()';
        if (variable.min !== undefined) joiType += `.min(${variable.min})`;
        if (variable.max !== undefined) joiType += `.max(${variable.max})`;
        break;

      case 'boolean':
        joiType = 'Joi.boolean()';
        break;

      case 'url':
      case 'database_url':
        joiType = 'Joi.string().uri()';
        break;

      case 'email':
        joiType = 'Joi.string().email()';
        break;

      case 'api_key':
      case 'secret':
      case 'jwt_secret':
        joiType = 'Joi.string().min(16)';
        break;

      case 'path':
        joiType = 'Joi.string()';
        break;

      case 'json':
        joiType = 'Joi.string()';
        break;

      default:
        joiType = 'Joi.string()';
    }

    if (variable.defaultValue) {
      joiType += `.default("${variable.defaultValue}")`;
    }

    return joiType;
  }
}
