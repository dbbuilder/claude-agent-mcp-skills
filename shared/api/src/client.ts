/**
 * Claude API Client
 * Shared client for Anthropic Claude API with Haiku as default model
 */

import Anthropic from '@anthropic-ai/sdk';
import { config } from './config.js';

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

export interface ClaudeResponse {
  content: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  model: string;
}

/**
 * Claude API Client
 * Optimized for cost efficiency with Haiku as default
 */
export class ClaudeClient {
  private client: Anthropic;
  private defaultModel: string;

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || config.apiKey,
    });
    this.defaultModel = config.model;
  }

  /**
   * Send a simple text prompt to Claude
   * Uses Haiku by default for cost efficiency
   */
  async prompt(
    userMessage: string,
    options: ClaudeOptions = {}
  ): Promise<ClaudeResponse> {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || config.maxTokens;
    const temperature = options.temperature ?? config.temperature;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: options.system,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    return {
      content: this.extractTextContent(response),
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  /**
   * Send a conversation with multiple messages
   * Uses Haiku by default for cost efficiency
   */
  async chat(
    messages: ClaudeMessage[],
    options: ClaudeOptions = {}
  ): Promise<ClaudeResponse> {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || config.maxTokens;
    const temperature = options.temperature ?? config.temperature;

    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: options.system,
      messages: messages.map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    return {
      content: this.extractTextContent(response),
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      model: response.model,
    };
  }

  /**
   * Stream a response from Claude (for real-time feedback)
   * Uses Haiku by default for cost efficiency
   */
  async *stream(
    userMessage: string,
    options: ClaudeOptions = {}
  ): AsyncGenerator<string, void, unknown> {
    const model = options.model || this.defaultModel;
    const maxTokens = options.maxTokens || config.maxTokens;
    const temperature = options.temperature ?? config.temperature;

    const stream = await this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system: options.system,
      messages: [
        {
          role: 'user',
          content: userMessage,
        },
      ],
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  /**
   * Extract text content from Claude response
   */
  private extractTextContent(response: any): string {
    const textBlocks = response.content.filter(
      (block: any) => block.type === 'text'
    );
    return textBlocks.map((block: any) => block.text).join('');
  }

  /**
   * Check if API key is configured
   */
  static isConfigured(): boolean {
    return !!config.apiKey && config.apiKey !== 'your_api_key_here';
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      model: this.defaultModel,
      maxTokens: config.maxTokens,
      temperature: config.temperature,
    };
  }
}

/**
 * Create a new Claude client instance
 */
export function createClaudeClient(apiKey?: string): ClaudeClient {
  return new ClaudeClient(apiKey);
}

/**
 * Singleton instance for convenience
 */
let defaultClient: ClaudeClient | null = null;

export function getClaudeClient(): ClaudeClient {
  if (!defaultClient) {
    if (!ClaudeClient.isConfigured()) {
      throw new Error(
        'ANTHROPIC_API_KEY not configured. Please set it in .env file or pass it to createClaudeClient()'
      );
    }
    defaultClient = new ClaudeClient();
  }
  return defaultClient;
}
