# Claude Agent SDK CLI

Unified command-line interface for all Claude Agent SDK MCP servers.

## Installation

```bash
cd cli
npm install
npm run build
npm link  # Optional: Link globally
```

## Usage

### Interactive Mode (Default)

The easiest way to use the CLI is in interactive mode, which guides you through server and command selection:

```bash
claude-agent
# or
claude-agent interactive
```

### List Available Servers

```bash
claude-agent list
```

### Show Server Information

```bash
claude-agent info <server-id>
```

Example:
```bash
claude-agent info security-auditor
```

### Direct Command Execution

#### Method 1: Using run command with JSON args

```bash
claude-agent run <server-id> <command> --args '{"arg1": "value1", "arg2": "value2"}'
```

Example:
```bash
claude-agent run security-auditor audit --args '{"projectPath": "/path/to/project", "format": "markdown"}'
```

#### Method 2: Using server-specific commands

```bash
claude-agent <server-id> <command> [args...]
```

Examples:
```bash
# Security audit
claude-agent security-auditor audit /path/to/project --format markdown

# Generate README
claude-agent readme-generator generate /path/to/project

# Scaffold new project
claude-agent project-scaffolder scaffold nextjs my-app ./output

# Generate API docs
claude-agent api-doc-generator generate /path/to/project --framework express --format both

# Generate Docker config
claude-agent docker-config-generator generate /path/to/project --includeCompose true

# Discover environment variables
claude-agent config-template-generator discover /path/to/project

# Update dependencies
claude-agent dependency-updater update /path/to/project --strategy balanced
```

## Available Servers

| Server ID | Name | Description |
|-----------|------|-------------|
| `security-auditor` | Security Auditor | Scan codebases for security vulnerabilities |
| `project-scaffolder` | Project Scaffolder | Generate project templates for various frameworks |
| `readme-generator` | README Generator | Generate comprehensive README documentation |
| `dependency-updater` | Dependency Updater | Analyze and update project dependencies safely |
| `api-doc-generator` | API Documentation Generator | Generate OpenAPI specs and API documentation |
| `integration-test-generator` | Integration Test Generator | Generate integration tests from API endpoints |
| `config-template-generator` | Configuration Template Generator | Discover environment variables and generate config templates |
| `docker-config-generator` | Docker Configuration Generator | Generate Dockerfiles and docker-compose configurations |
| `code-migration-assistant` | Code Migration Assistant | Assist with framework migrations |
| `performance-profiler` | Performance Profiler | Analyze code performance and suggest optimizations |

## Examples

### Security Audit Workflow

```bash
# Interactive mode
claude-agent
# Select: Security Auditor → audit → enter project path

# Or direct command
claude-agent security-auditor audit /path/to/project --format markdown
```

### New Project Workflow

```bash
# Scaffold a new Next.js project
claude-agent project-scaffolder scaffold nextjs my-app ./projects

# Generate README
claude-agent readme-generator generate ./projects/my-app

# Generate Docker configuration
claude-agent docker-config-generator generate ./projects/my-app

# Discover environment variables
claude-agent config-template-generator discover ./projects/my-app
```

### API Documentation Workflow

```bash
# Generate API documentation
claude-agent api-doc-generator generate /path/to/api --framework express --format both

# Generate integration tests
claude-agent integration-test-generator generate /path/to/api --framework express
```

## Development

### Build

```bash
npm run build
```

### Watch Mode

```bash
npm run dev
```

### Run Without Building

```bash
npm start
```

## Architecture

The CLI is built with the following components:

- **registry.ts**: Central registry of all MCP servers and their commands
- **ui.ts**: User interface utilities (spinners, colors, tables)
- **interactive.ts**: Interactive mode handler
- **executor.ts**: Server execution handler
- **index.ts**: Main CLI entry point with Commander.js

## Adding New Servers

To add a new server to the CLI:

1. Build the server and ensure it has a `build/index.js` entry point
2. Add server configuration to `src/registry.ts`:

```typescript
'my-server': {
  name: 'My Server',
  description: 'Description of what it does',
  path: path.join(SDK_ROOT, 'servers/my-server/build/index.js'),
  commands: [
    {
      name: 'mycommand',
      description: 'Command description',
      args: [
        { name: 'arg1', description: 'Argument description', required: true },
        { name: 'arg2', description: 'Optional arg', required: false, default: 'value' },
      ],
    },
  ],
},
```

3. Rebuild the CLI: `npm run build`

## License

MIT
