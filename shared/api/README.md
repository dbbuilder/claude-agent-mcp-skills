# Shared Claude API Client

A cost-optimized, type-safe client for the Anthropic Claude API, designed for the Claude Agent SDK. Uses **Haiku by default** for maximum cost efficiency.

## Features

- **Cost Optimized**: Defaults to Claude 3.5 Haiku (80% cheaper than Sonnet)
- **Type Safe**: Full TypeScript support with strong typing
- **Easy Configuration**: Environment variable-based setup
- **Streaming Support**: Real-time response streaming
- **Usage Tracking**: Built-in token counting and cost estimation
- **Flexible**: Easy to override model for complex tasks

## Installation

```bash
cd shared/api
npm install
```

## Configuration

1. Copy `.env.example` to `.env` in the project root:
```bash
cp ../../.env.example ../../.env
```

2. Add your Anthropic API key:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

3. Optional: Override defaults
```env
CLAUDE_MODEL=claude-3-5-haiku-20241022
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7
```

## Usage

### Simple Prompt

```typescript
import { getClaudeClient } from '@claude-agent-sdk/api';

const client = getClaudeClient();

const response = await client.prompt('Explain dependency injection');

console.log(response.content);
console.log(`Used ${response.usage.inputTokens} input tokens`);
console.log(`Used ${response.usage.outputTokens} output tokens`);
```

### Multi-turn Conversation

```typescript
import { getClaudeClient } from '@claude-agent-sdk/api';

const client = getClaudeClient();

const response = await client.chat([
  { role: 'user', content: 'What is React?' },
  { role: 'assistant', content: 'React is a JavaScript library...' },
  { role: 'user', content: 'How do hooks work?' },
]);

console.log(response.content);
```

### Streaming Response

```typescript
import { getClaudeClient } from '@claude-agent-sdk/api';

const client = getClaudeClient();

for await (const chunk of client.stream('Write a short poem')) {
  process.stdout.write(chunk);
}
```

### Override Model for Complex Tasks

```typescript
import { getClaudeClient, MODELS } from '@claude-agent-sdk/api';

const client = getClaudeClient();

// Use Sonnet for more complex reasoning
const response = await client.prompt(
  'Analyze this complex security vulnerability...',
  { model: MODELS.SONNET }
);

// Use Opus for very complex tasks
const response2 = await client.prompt(
  'Design a complete microservices architecture...',
  { model: MODELS.OPUS }
);
```

### Custom System Prompt

```typescript
const response = await client.prompt('Review this code', {
  system: 'You are an expert security auditor specializing in web applications.',
});
```

## Model Selection Guide

### Claude 3.5 Haiku (Default)
- **Use for**: 90% of tasks
- **Best for**: Code analysis, simple generation, Q&A, refactoring
- **Speed**: Fastest
- **Cost**: $0.80 per million input tokens

### Claude 3.5 Sonnet
- **Use for**: Complex reasoning tasks
- **Best for**: Architecture design, complex analysis, multi-step planning
- **Speed**: Medium
- **Cost**: $3.00 per million input tokens

### Claude Opus 4
- **Use for**: Most complex reasoning
- **Best for**: Very complex system design, comprehensive analysis
- **Speed**: Slower
- **Cost**: $15.00 per million input tokens

## Cost Estimation

```typescript
import { estimateCost, MODELS } from '@claude-agent-sdk/api';

const cost = estimateCost(1000, 500, MODELS.HAIKU);
console.log(`Estimated cost: $${cost.toFixed(4)}`);
```

## Validation

```typescript
import { validateConfig } from '@claude-agent-sdk/api';

const validation = validateConfig();
if (!validation.valid) {
  console.error('Configuration errors:', validation.errors);
}
```

## Configuration Options

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTHROPIC_API_KEY` | (required) | Your Anthropic API key |
| `CLAUDE_MODEL` | `claude-3-5-haiku-20241022` | Model to use |
| `CLAUDE_MAX_TOKENS` | `4096` | Maximum tokens in response |
| `CLAUDE_TEMPERATURE` | `0.7` | Response randomness (0-1) |

## Error Handling

```typescript
import { getClaudeClient, ClaudeClient } from '@claude-agent-sdk/api';

try {
  if (!ClaudeClient.isConfigured()) {
    throw new Error('API key not configured');
  }

  const client = getClaudeClient();
  const response = await client.prompt('Hello');
} catch (error) {
  console.error('API error:', error);
}
```

## Best Practices

1. **Always use Haiku unless you need advanced reasoning**
   - Haiku handles 90% of tasks effectively
   - 4x cheaper than Sonnet

2. **Set appropriate max tokens**
   - Lower = cheaper
   - Start with 1024, increase if needed

3. **Use system prompts for context**
   - Better results than embedding context in user message
   - More efficient token usage

4. **Track usage in production**
   - Monitor `response.usage` to control costs
   - Set up alerts for high usage

## License

MIT
