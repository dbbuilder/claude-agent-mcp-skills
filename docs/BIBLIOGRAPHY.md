# Claude Agent SDK & MCP Code Execution - Bibliography

## Official Documentation

### Claude Agent SDK
- **Agent SDK Overview** - https://docs.claude.com/en/docs/agent-sdk/overview
  - Primary reference for SDK capabilities, features, and installation
  - Covers context management, tool ecosystem, permissions system
  - Documents authentication options (Anthropic, Bedrock, Vertex AI)

- **Building Agents with the Claude Agent SDK** - https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk
  - Official engineering blog post from Anthropic
  - Explains the shift from Claude Code SDK to Claude Agent SDK
  - Details production-ready agent features

### Model Context Protocol (MCP)
- **Code Execution with MCP** - https://www.anthropic.com/engineering/code-execution-with-mcp
  - **PRIMARY RESOURCE**: Comprehensive guide to code-first agent architecture
  - Details 98.7% token reduction case study (150K → 2K tokens)
  - Explains progressive disclosure, privacy-preserving operations, state persistence

- **MCP Specification (2025-03-26)** - https://modelcontextprotocol.io/specification/2025-03-26
  - Official protocol specification
  - Technical reference for MCP implementation

## GitHub Repositories

### SDKs
- **Python SDK** - https://github.com/anthropics/claude-agent-sdk-python
  - Official Python implementation
  - Example code and reference implementations

- **TypeScript SDK** - https://github.com/anthropics/claude-agent-sdk-typescript (implied)
  - NPM package: `@anthropic-ai/claude-agent-sdk`
  - Version installed: ^0.1.37

### MCP Servers
- **Anthropic MCP Server Repository** - https://github.com/anthropics (reference implementations)
  - Google Drive, Slack, GitHub, Git integrations
  - Postgres, Puppeteer, Stripe connectors

## Tutorials & Guides (2025)

### Comprehensive Tutorials
- **DataCamp Tutorial** - https://www.datacamp.com/tutorial/how-to-use-claude-agent-sdk
  - Hands-on tutorial with Claude 4.5 Sonnet
  - Three example projects included
  - Setup and basic usage

- **The Claude Agent SDK Builder's Playbook** - https://alirezarezvani.medium.com/the-claude-agent-sdk-builders-playbook-build-your-first-autonomous-agent-in-30-minutes-88a1952f637e
  - 30-minute quickstart guide
  - First autonomous agent walkthrough

- **A Practical Guide to Python Claude Code SDK** - https://www.eesel.ai/blog/python-claude-code-sdk
  - eesel AI's practical guide for 2025
  - Python-focused implementation examples

### Platform-Specific Guides
- **Bind AI IDE Tutorial** - https://blog.getbind.co/2025/10/03/how-to-create-agents-with-claude-agents-sdk/
  - Real-world agent building example
  - IDE-integrated workflow

- **PromptLayer Blog** - https://blog.promptlayer.com/building-agents-with-claude-codes-sdk/
  - Agent building with prompt management
  - Integration patterns

### Best Practices & Advanced Topics
- **Claude Agent SDK Best Practices (2025)** - https://skywork.ai/blog/claude-agent-sdk-best-practices-ai-agents-2025/
  - Production best practices
  - AI agent development patterns

- **Claude Agent: 2025 Playbook for SDK, Context & Memory** - https://binaryverseai.com/claude-agent-sdk-context-engineering-long-memory/
  - Context engineering patterns
  - Long-term memory implementation
  - Tool design strategies

### MCP-Specific Resources
- **A Clear Intro to MCP with Code Examples** - https://towardsdatascience.com/clear-intro-to-mcp/
  - Towards Data Science tutorial
  - Code examples and explanations

- **Cloudflare Code Mode** - https://blog.cloudflare.com/code-mode/
  - Cloudflare's implementation of MCP code execution
  - Sandboxed TypeScript execution model

- **MCP Architecture & Implementation Guide** - https://dzone.com/articles/model-context-protocol-mcp-guide-architecture-uses-implementation
  - Architecture overview
  - Implementation patterns

## Industry Analysis

- **Anthropic Turns MCP Agents Into Code First Systems** - https://www.marktechpost.com/2025/11/08/anthropic-turns-mcp-agents-into-code-first-systems-with-code-execution-with-mcp-approach/
  - MarkTechPost analysis
  - Industry implications of code-first approach

- **What Is MCP and How It Works** - https://www.descope.com/learn/post/mcp
  - Descope educational resource
  - MCP fundamentals

## Security Resources

- **MCP Security Considerations** - https://www.blackhillsinfosec.com/model-context-protocol/
  - Black Hills Information Security analysis
  - Security threats and mitigations

- **MCP: Landscape, Security Threats** - https://xinyi-hou.github.io/files/hou2025mcp.pdf
  - Academic security analysis
  - Threat modeling for MCP implementations

## Reference Materials

- **Model Context Protocol Wikipedia** - https://en.wikipedia.org/wiki/Model_Context_Protocol
  - General overview and history
  - Community adoption metrics

---

## Installation Quick Reference

### Claude Agent SDK
```bash
# TypeScript/Node.js
npm install @anthropic-ai/claude-agent-sdk

# Python
pip install claude-agent-sdk
```

### Environment Setup
```bash
export ANTHROPIC_API_KEY="your-api-key"

# Alternative providers
export CLAUDE_CODE_USE_BEDROCK=1  # Amazon Bedrock
export CLAUDE_CODE_USE_VERTEX=1   # Google Vertex AI
```

---

## Key Statistics & Metrics

- **Token Efficiency**: 98.7% reduction (150K → 2K tokens) with MCP code execution
- **Community Adoption**: Thousands of MCP servers built since Nov 2024
- **SDK Availability**: TypeScript, Python, C#, Java
- **Current SDK Version**: 0.1.37 (TypeScript)

---

*Bibliography compiled: 2025-11-11*
*Project: /mnt/d/dev2/claude-agent-sdk*
