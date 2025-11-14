# Claude Agent SDK - Setup Guide

## Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/claude-agent-sdk.git
cd claude-agent-sdk
```

### 2. Configure API Key

The SDK uses the Anthropic Claude API for AI-powered features. You'll need an API key.

#### Get Your API Key

1. Go to https://console.anthropic.com/settings/keys
2. Create a new API key
3. Copy the key (starts with `sk-ant-`)

#### Set Up Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and add your API key
nano .env
```

Add your key to `.env`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Important**: Never commit `.env` to git. It's already in `.gitignore`.

### 3. Install Dependencies

#### Install All MCP Servers

```bash
# Security Auditor
cd servers/security-auditor
npm install
npm run build

# Project Scaffolder
cd ../project-scaffolder
npm install
npm run build

# README Generator
cd ../readme-generator
npm install
npm run build

# Dependency Updater
cd ../dependency-updater
npm install
npm run build

# Return to root
cd ../..
```

#### Install CLI Tool

```bash
cd cli
npm install
npm run build
cd ..
```

#### Install Shared API Client (Optional)

```bash
cd shared/api
npm install
npm run build
cd ../..
```

### 4. Test Your Setup

```bash
# Test that API key is configured
cd shared/api
npm run dev
```

## Model Configuration

The SDK defaults to **Claude 3.5 Haiku** for cost efficiency. You can override this:

```env
# Use Sonnet for more complex reasoning
CLAUDE_MODEL=claude-3-5-sonnet-20241022

# Use Opus for most complex tasks
CLAUDE_MODEL=claude-opus-4-20250514
```

### Model Comparison

| Model | Speed | Cost (per 1M tokens) | Best For |
|-------|-------|---------------------|----------|
| **Haiku** (default) | Fastest | $0.80 input / $4.00 output | 90% of tasks |
| **Sonnet** | Medium | $3.00 input / $15.00 output | Complex reasoning |
| **Opus** | Slower | $15.00 input / $75.00 output | Most complex tasks |

**Recommendation**: Start with Haiku. Only upgrade to Sonnet/Opus if needed.

## Running Tests

```bash
# Security Auditor
cd servers/security-auditor
npm test

# Project Scaffolder
cd ../project-scaffolder
npm test

# README Generator
cd ../readme-generator
npm test

# Dependency Updater
cd ../dependency-updater
npm test
```

## Using the CLI

```bash
# Interactive mode
npx claude-mcp-tools

# Direct commands
npx claude-mcp-tools audit -p ./my-server
npx claude-mcp-tools scaffold -t typescript-express -n my-api
npx claude-mcp-tools readme -p ./my-project
npx claude-mcp-tools deps -p ./my-project
```

## Security Best Practices

### API Key Security

1. **Never commit** `.env` to git (already in `.gitignore`)
2. **Never log** API keys in console or files
3. **Rotate keys** regularly from Anthropic console
4. **Use separate keys** for dev/staging/production
5. **Monitor usage** in Anthropic console

### Environment Files

- ✅ `.env` - Your actual API key (gitignored)
- ✅ `.env.example` - Template without secrets (committed)
- ❌ Never commit `.env` or `.env.local`

### CI/CD Setup

For GitHub Actions or other CI/CD:

```yaml
# .github/workflows/test.yml
env:
  ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

Set `ANTHROPIC_API_KEY` in repository secrets.

## Troubleshooting

### "ANTHROPIC_API_KEY not configured"

- Check `.env` file exists in project root
- Verify API key is set: `cat .env | grep ANTHROPIC_API_KEY`
- Make sure key starts with `sk-ant-`

### "Invalid API key"

- Verify key is active in Anthropic console
- Check for extra spaces or quotes in `.env`
- Try regenerating the key

### "Rate limit exceeded"

- You've hit Anthropic's rate limits
- Wait a few minutes and try again
- Consider upgrading your Anthropic plan

### Tests failing due to API key

Some tools don't require API keys (they're rule-based):
- Security Auditor: No API needed
- README Generator: No API needed
- Project Scaffolder: No API needed
- Dependency Updater: No API needed

## Cost Management

### Track Usage

```typescript
import { getClaudeClient } from '@claude-agent-sdk/api';

const client = getClaudeClient();
const response = await client.prompt('Hello');

console.log(`Tokens used: ${response.usage.inputTokens + response.usage.outputTokens}`);
```

### Estimate Costs

```typescript
import { estimateCost, MODELS } from '@claude-agent-sdk/api';

const cost = estimateCost(1000, 500, MODELS.HAIKU);
console.log(`Cost: $${cost.toFixed(4)}`);
```

### Reduce Costs

1. **Use Haiku by default** (4x cheaper than Sonnet)
2. **Limit max tokens** (set `CLAUDE_MAX_TOKENS=1024`)
3. **Cache system prompts** (reuse for multiple requests)
4. **Monitor usage** in Anthropic console

## Next Steps

- Read the [CLI Documentation](cli/README.md)
- Explore [MCP Server Documentation](servers/README.md)
- Check out [API Client Guide](shared/api/README.md)
- Review [Phase 2 Plan](PHASE-2-PLAN.md)

## Support

- Issues: https://github.com/yourusername/claude-agent-sdk/issues
- Anthropic Docs: https://docs.anthropic.com
- MCP Protocol: https://modelcontextprotocol.io
