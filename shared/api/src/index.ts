/**
 * Shared Claude API Client
 * Export all public APIs
 */

export {
  ClaudeClient,
  createClaudeClient,
  getClaudeClient,
  type ClaudeMessage,
  type ClaudeOptions,
  type ClaudeResponse,
} from './client.js';

export {
  config,
  validateConfig,
  getRecommendedModel,
  estimateCost,
  MODELS,
  type ApiConfig,
} from './config.js';
