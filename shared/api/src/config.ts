/**
 * API Configuration
 * Loads settings from environment variables with sensible defaults
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env from project root (traverse up from shared/api/src)
const projectRoot = path.resolve(process.cwd());
const envPath = path.join(projectRoot, '.env');

if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

/**
 * Claude Models
 * Haiku: Fast and cost-effective for most tasks
 * Sonnet: Better reasoning for complex tasks
 * Opus: Most capable for very complex reasoning
 */
export const MODELS = {
  HAIKU: 'claude-3-5-haiku-20241022',
  SONNET: 'claude-3-5-sonnet-20241022',
  OPUS: 'claude-opus-4-20250514',
} as const;

export interface ApiConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  logLevel: string;
}

/**
 * Get configuration from environment
 */
function getConfig(): ApiConfig {
  return {
    // API Key (required)
    apiKey: process.env.ANTHROPIC_API_KEY || '',

    // Model (default to Haiku for cost efficiency)
    model: process.env.CLAUDE_MODEL || MODELS.HAIKU,

    // Max tokens (default to 4096)
    maxTokens: parseInt(process.env.CLAUDE_MAX_TOKENS || '4096', 10),

    // Temperature (default to 0.7 for balanced output)
    temperature: parseFloat(process.env.CLAUDE_TEMPERATURE || '0.7'),

    // Log level
    logLevel: process.env.LOG_LEVEL || 'info',
  };
}

export const config = getConfig();

/**
 * Validate configuration
 */
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!config.apiKey) {
    errors.push('ANTHROPIC_API_KEY is not set in environment');
  }

  if (config.apiKey === 'your_api_key_here') {
    errors.push('ANTHROPIC_API_KEY still has placeholder value');
  }

  if (!Object.values(MODELS).includes(config.model as any)) {
    errors.push(`Invalid model: ${config.model}. Must be one of: ${Object.values(MODELS).join(', ')}`);
  }

  if (config.maxTokens < 1 || config.maxTokens > 200000) {
    errors.push(`Invalid maxTokens: ${config.maxTokens}. Must be between 1 and 200000`);
  }

  if (config.temperature < 0 || config.temperature > 1) {
    errors.push(`Invalid temperature: ${config.temperature}. Must be between 0 and 1`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get model recommendation based on task complexity
 */
export function getRecommendedModel(complexity: 'simple' | 'moderate' | 'complex'): string {
  switch (complexity) {
    case 'simple':
      return MODELS.HAIKU; // Fast, cheap, good for most tasks
    case 'moderate':
      return MODELS.SONNET; // Better reasoning
    case 'complex':
      return MODELS.OPUS; // Best reasoning
    default:
      return MODELS.HAIKU;
  }
}

/**
 * Estimate cost for a request (approximate)
 */
export function estimateCost(inputTokens: number, outputTokens: number, model: string): number {
  // Pricing per million tokens (as of Jan 2025)
  const pricing: Record<string, { input: number; output: number }> = {
    [MODELS.HAIKU]: { input: 0.80, output: 4.00 },
    [MODELS.SONNET]: { input: 3.00, output: 15.00 },
    [MODELS.OPUS]: { input: 15.00, output: 75.00 },
  };

  const rates = pricing[model] || pricing[MODELS.HAIKU];
  const inputCost = (inputTokens / 1_000_000) * rates.input;
  const outputCost = (outputTokens / 1_000_000) * rates.output;

  return inputCost + outputCost;
}
