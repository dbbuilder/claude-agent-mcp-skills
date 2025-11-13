/**
 * Project Generator
 * Core logic for scaffolding projects from templates
 */

import * as fs from 'fs';
import * as path from 'path';
import { ScaffoldOptions, ScaffoldResult, TemplateVariable, TemplateFile } from './types.js';
import { getTemplate } from './templates/index.js';

export class ProjectGenerator {
  /**
   * Generate a new project from a template
   */
  async scaffold(options: ScaffoldOptions): Promise<ScaffoldResult> {
    try {
      const template = getTemplate(options.template);
      const projectPath = path.join(options.outputPath, options.projectName);

      // Check if directory already exists
      if (fs.existsSync(projectPath)) {
        return {
          projectPath,
          filesCreated: [],
          nextSteps: [],
          template: options.template,
          success: false,
          error: `Directory ${projectPath} already exists`,
        };
      }

      // Create project directory
      fs.mkdirSync(projectPath, { recursive: true });

      // Prepare template variables
      const variables = this.prepareVariables(options);

      // Generate template files
      const files = await this.generateFiles(options.template, variables);

      // Write files to disk
      const filesCreated: string[] = [];
      for (const file of files) {
        const filePath = path.join(projectPath, file.path);
        const fileDir = path.dirname(filePath);

        // Create directory if it doesn't exist
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        // Write file
        fs.writeFileSync(filePath, file.content, { mode: file.mode || 0o644 });
        filesCreated.push(file.path);
      }

      // Initialize git repository if requested
      if (options.options?.gitInit !== false) {
        try {
          const { execSync } = await import('child_process');
          execSync('git init', { cwd: projectPath, stdio: 'ignore' });
          execSync('git add .', { cwd: projectPath, stdio: 'ignore' });
          filesCreated.push('.git/');
        } catch (error) {
          // Git init failed, but project was created successfully
          console.error('Git initialization failed:', error);
        }
      }

      // Generate next steps
      const nextSteps = this.generateNextSteps(options, projectPath);

      return {
        projectPath,
        filesCreated,
        nextSteps,
        template: options.template,
        success: true,
      };
    } catch (error) {
      return {
        projectPath: path.join(options.outputPath, options.projectName),
        filesCreated: [],
        nextSteps: [],
        template: options.template,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Prepare template variables from options
   */
  private prepareVariables(options: ScaffoldOptions): TemplateVariable {
    const currentYear = new Date().getFullYear();

    return {
      projectName: options.projectName,
      projectDescription: options.options?.description || `${options.projectName} - Generated with Claude Agent SDK`,
      authorName: options.options?.author || 'Your Name',
      license: options.options?.license || 'MIT',
      currentYear,
      database: options.options?.database,
      authentication: options.options?.authentication,
      includeDocker: options.options?.includeDocker !== false,
      includeTests: options.options?.includeTests !== false,
      includeCICD: options.options?.includeCICD !== false,
    };
  }

  /**
   * Generate template files based on template type
   */
  private async generateFiles(
    template: string,
    variables: TemplateVariable
  ): Promise<TemplateFile[]> {
    const files: TemplateFile[] = [];

    // Import template-specific generator
    switch (template) {
      case 'typescript-express':
        files.push(...this.generateTypeScriptExpressTemplate(variables));
        break;
      case 'typescript-nextjs':
        files.push(...this.generateNextJsTemplate(variables));
        break;
      case 'dotnet-webapi':
        files.push(...this.generateDotNetWebApiTemplate(variables));
        break;
      case 'python-fastapi':
        files.push(...this.generatePythonFastApiTemplate(variables));
        break;
      case 'vue3-frontend':
        files.push(...this.generateVue3Template(variables));
        break;
      case 'react-frontend':
        files.push(...this.generateReactTemplate(variables));
        break;
      case 'react-native':
        files.push(...this.generateReactNativeTemplate(variables));
        break;
      default:
        throw new Error(`Unknown template: ${template}`);
    }

    // Add common files
    files.push(...this.generateCommonFiles(variables));

    return files;
  }

  /**
   * Generate TypeScript Express template files
   */
  private generateTypeScriptExpressTemplate(variables: TemplateVariable): TemplateFile[] {
    return [
      {
        path: 'package.json',
        content: this.substituteVariables(
          JSON.stringify(
            {
              name: '{{projectName}}',
              version: '1.0.0',
              description: '{{projectDescription}}',
              type: 'module',
              main: 'dist/index.js',
              scripts: {
                dev: 'tsx src/index.ts',
                build: 'tsc',
                start: 'node dist/index.js',
                test: 'jest',
                lint: 'eslint src/**/*.ts',
                format: 'prettier --write "src/**/*.ts"',
              },
              dependencies: {
                express: '^4.18.2',
                cors: '^2.8.5',
                helmet: '^7.1.0',
                dotenv: '^16.3.1',
              },
              devDependencies: {
                '@types/express': '^4.17.21',
                '@types/cors': '^2.8.17',
                '@types/node': '^20.10.6',
                typescript: '^5.3.3',
                tsx: '^4.7.0',
                eslint: '^8.56.0',
                prettier: '^3.1.1',
                jest: '^29.7.0',
                '@types/jest': '^29.5.11',
              },
            },
            null,
            2
          ),
          variables
        ),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              module: 'ES2022',
              lib: ['ES2022'],
              outDir: './dist',
              rootDir: './src',
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              forceConsistentCasingInFileNames: true,
              resolveJsonModule: true,
              moduleResolution: 'node',
            },
            include: ['src/**/*'],
            exclude: ['node_modules', 'dist'],
          },
          null,
          2
        ),
      },
      {
        path: 'src/index.ts',
        content: this.substituteVariables(
          `import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to {{projectName}}',
    version: '1.0.0',
  });
});

// Start server
app.listen(PORT, () => {
  console.log(\`Server running on port \${PORT}\`);
});

export default app;
`,
          variables
        ),
      },
      {
        path: 'src/config/database.ts',
        content: this.substituteVariables(
          `// Database configuration
export const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || '{{projectName}}',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};
`,
          variables
        ),
      },
    ];
  }

  /**
   * Generate common files for all templates
   */
  private generateCommonFiles(variables: TemplateVariable): TemplateFile[] {
    const files: TemplateFile[] = [
      {
        path: 'README.md',
        content: this.substituteVariables(
          `# {{projectName}}

{{projectDescription}}

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
npm run dev
\`\`\`

### Build

\`\`\`bash
npm run build
\`\`\`

### Test

\`\`\`bash
npm test
\`\`\`

## Environment Variables

Copy \`.env.template\` to \`.env\` and configure:

\`\`\`
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME={{projectName}}
DB_USER=postgres
DB_PASSWORD=postgres
\`\`\`

## License

{{license}}

---

Generated with [Claude Agent SDK](https://github.com/dbbuilder/claude-agent-mcp-skills)
`,
          variables
        ),
      },
      {
        path: '.gitignore',
        content: `# Dependencies
node_modules/
.pnp
.pnp.js

# Testing
coverage/
*.lcov

# Production
dist/
build/

# Environment
.env
.env.local
.env.*.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
`,
      },
      {
        path: '.env.template',
        content: this.substituteVariables(
          `# Server
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME={{projectName}}
DB_USER=postgres
DB_PASSWORD=postgres

# JWT (if authentication enabled)
JWT_SECRET=your-secret-key-here
JWT_EXPIRES_IN=7d
`,
          variables
        ),
      },
      {
        path: 'LICENSE',
        content: this.substituteVariables(
          `MIT License

Copyright (c) {{currentYear}} {{authorName}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
          variables
        ),
      },
    ];

    // Add Docker files if requested
    if (variables.includeDocker) {
      files.push(
        {
          path: 'Dockerfile',
          content: this.substituteVariables(
            `FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

CMD ["node", "dist/index.js"]
`,
            variables
          ),
        },
        {
          path: 'docker-compose.yml',
          content: this.substituteVariables(
            `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - PORT=3000
      - DB_HOST=db
      - DB_PORT=5432
      - DB_NAME={{projectName}}
      - DB_USER=postgres
      - DB_PASSWORD=postgres
    depends_on:
      - db

  db:
    image: postgres:16-alpine
    environment:
      - POSTGRES_DB={{projectName}}
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
`,
            variables
          ),
        }
      );
    }

    // Add CI/CD if requested
    if (variables.includeCICD) {
      files.push({
        path: '.github/workflows/ci.yml',
        content: this.substituteVariables(
          `name: CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Use Node.js 20
      uses: actions/setup-node@v3
      with:
        node-version: 20
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linter
      run: npm run lint

    - name: Run tests
      run: npm test

    - name: Build
      run: npm run build
`,
          variables
        ),
      });
    }

    return files;
  }

  /**
   * Generate Next.js template files
   */
  private generateNextJsTemplate(variables: TemplateVariable): TemplateFile[] {
    return [
      {
        path: 'package.json',
        content: this.substituteVariables(
          JSON.stringify(
            {
              name: '{{projectName}}',
              version: '0.1.0',
              description: '{{projectDescription}}',
              private: true,
              scripts: {
                dev: 'next dev',
                build: 'next build',
                start: 'next start',
                lint: 'next lint',
                test: 'jest',
              },
              dependencies: {
                next: '^14.0.4',
                react: '^18.2.0',
                'react-dom': '^18.2.0',
              },
              devDependencies: {
                '@types/node': '^20',
                '@types/react': '^18',
                '@types/react-dom': '^18',
                typescript: '^5',
                eslint: '^8',
                'eslint-config-next': '^14.0.4',
                tailwindcss: '^3.4.0',
                postcss: '^8',
                autoprefixer: '^10',
                jest: '^29.7.0',
                '@testing-library/react': '^14.1.2',
              },
            },
            null,
            2
          ),
          variables
        ),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2022',
              lib: ['dom', 'dom.iterable', 'esnext'],
              allowJs: true,
              skipLibCheck: true,
              strict: true,
              noEmit: true,
              esModuleInterop: true,
              module: 'esnext',
              moduleResolution: 'bundler',
              resolveJsonModule: true,
              isolatedModules: true,
              jsx: 'preserve',
              incremental: true,
              plugins: [
                {
                  name: 'next',
                },
              ],
              paths: {
                '@/*': ['./src/*'],
              },
            },
            include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
            exclude: ['node_modules'],
          },
          null,
          2
        ),
      },
      {
        path: 'next.config.js',
        content: `/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
}

module.exports = nextConfig
`,
      },
      {
        path: 'tailwind.config.ts',
        content: `import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
export default config
`,
      },
      {
        path: 'postcss.config.js',
        content: `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
`,
      },
      {
        path: 'src/app/layout.tsx',
        content: this.substituteVariables(
          `import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: '{{projectName}}',
  description: '{{projectDescription}}',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
`,
          variables
        ),
      },
      {
        path: 'src/app/page.tsx',
        content: this.substituteVariables(
          `export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">Welcome to {{projectName}}</h1>
        <p className="text-xl text-gray-600">{{projectDescription}}</p>
        <div className="mt-8">
          <a
            href="/api/hello"
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          >
            Test API
          </a>
        </div>
      </div>
    </main>
  )
}
`,
          variables
        ),
      },
      {
        path: 'src/app/globals.css',
        content: `@tailwind base;
@tailwind components;
@tailwind utilities;
`,
      },
      {
        path: 'src/app/api/hello/route.ts',
        content: `import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    message: 'Hello from Next.js API',
    timestamp: new Date().toISOString()
  })
}
`,
      },
    ];
  }

  private generateDotNetWebApiTemplate(variables: TemplateVariable): TemplateFile[] {
    const projectName = variables.projectName.replace(/[^a-zA-Z0-9]/g, '');

    return [
      {
        path: `${projectName}.csproj`,
        content: `<Project Sdk="Microsoft.NET.Sdk.Web">

  <PropertyGroup>
    <TargetFramework>net8.0</TargetFramework>
    <Nullable>enable</Nullable>
    <ImplicitUsings>enable</ImplicitUsings>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.AspNetCore.OpenApi" Version="8.0.0" />
    <PackageReference Include="Swashbuckle.AspNetCore" Version="6.5.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.SqlServer" Version="8.0.0" />
    <PackageReference Include="Microsoft.EntityFrameworkCore.Design" Version="8.0.0" />
    <PackageReference Include="Serilog.AspNetCore" Version="8.0.0" />
  </ItemGroup>

</Project>
`,
      },
      {
        path: 'Program.cs',
        content: this.substituteVariables(
          `using Microsoft.EntityFrameworkCore;
using Serilog;

var builder = WebApplication.CreateBuilder(args);

// Logging
Log.Logger = new LoggerConfiguration()
    .ReadFrom.Configuration(builder.Configuration)
    .CreateLogger();

builder.Host.UseSerilog();

// Services
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "{{projectName}} API", Version = "v1" });
});

// Database
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(connectionString));

// CORS
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var app = builder.Build();

// Middleware
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseCors();
app.UseAuthorization();
app.MapControllers();

// Health check
app.MapGet("/health", () => new
{
    Status = "Healthy",
    Timestamp = DateTime.UtcNow
});

app.Run();
`,
          variables
        ),
      },
      {
        path: 'appsettings.json',
        content: this.substituteVariables(
          `{
  "Logging": {
    "LogLevel": {
      "Default": "Information",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "AllowedHosts": "*",
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database={{projectName}};Trusted_Connection=True;TrustServerCertificate=True"
  },
  "Serilog": {
    "MinimumLevel": {
      "Default": "Information",
      "Override": {
        "Microsoft": "Warning",
        "System": "Warning"
      }
    },
    "WriteTo": [
      { "Name": "Console" },
      {
        "Name": "File",
        "Args": { "path": "logs/log-.txt", "rollingInterval": "Day" }
      }
    ]
  }
}
`,
          variables
        ),
      },
      {
        path: 'appsettings.Development.json',
        content: `{
  "Logging": {
    "LogLevel": {
      "Default": "Debug",
      "Microsoft.AspNetCore": "Information"
    }
  }
}
`,
      },
      {
        path: 'Data/ApplicationDbContext.cs',
        content: this.substituteVariables(
          `using Microsoft.EntityFrameworkCore;

namespace {{projectName}}.Data;

public class ApplicationDbContext : DbContext
{
    public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
        : base(options)
    {
    }

    // Add DbSet properties here
    // public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure entity relationships here
    }
}
`,
          variables
        ),
      },
      {
        path: 'Controllers/WeatherForecastController.cs',
        content: this.substituteVariables(
          `using Microsoft.AspNetCore.Mvc;

namespace {{projectName}}.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    private readonly ILogger<WeatherForecastController> _logger;

    public WeatherForecastController(ILogger<WeatherForecastController> logger)
    {
        _logger = logger;
    }

    [HttpGet]
    public IEnumerable<WeatherForecast> Get()
    {
        _logger.LogInformation("Getting weather forecast");

        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }

    [HttpGet("{id}")]
    public ActionResult<WeatherForecast> GetById(int id)
    {
        if (id < 1 || id > 5)
        {
            return NotFound();
        }

        return new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(id)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        };
    }
}
`,
          variables
        ),
      },
      {
        path: 'Models/WeatherForecast.cs',
        content: this.substituteVariables(
          `namespace {{projectName}};

public class WeatherForecast
{
    public DateOnly Date { get; set; }
    public int TemperatureC { get; set; }
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
    public string? Summary { get; set; }
}
`,
          variables
        ),
      },
      {
        path: 'Properties/launchSettings.json',
        content: `{
  "$schema": "http://json.schemastore.org/launchsettings.json",
  "profiles": {
    "http": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": "swagger",
      "applicationUrl": "http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    },
    "https": {
      "commandName": "Project",
      "dotnetRunMessages": true,
      "launchBrowser": true,
      "launchUrl": "swagger",
      "applicationUrl": "https://localhost:5001;http://localhost:5000",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Development"
      }
    }
  }
}
`,
      },
    ];
  }

  private generatePythonFastApiTemplate(variables: TemplateVariable): TemplateFile[] {
    return [
      {
        path: 'pyproject.toml',
        content: this.substituteVariables(
          `[tool.poetry]
name = "{{projectName}}"
version = "0.1.0"
description = "{{projectDescription}}"
authors = ["{{authorName}}"]

[tool.poetry.dependencies]
python = "^3.11"
fastapi = "^0.109.0"
uvicorn = {extras = ["standard"], version = "^0.27.0"}
sqlalchemy = "^2.0.25"
pydantic = "^2.5.3"
pydantic-settings = "^2.1.0"
python-dotenv = "^1.0.0"

[tool.poetry.group.dev.dependencies]
pytest = "^7.4.4"
pytest-asyncio = "^0.23.3"
black = "^24.1.1"
ruff = "^0.1.13"
mypy = "^1.8.0"

[build-system]
requires = ["poetry-core"]
build-backend = "poetry.core.masonry.api"
`,
          variables
        ),
      },
      {
        path: 'requirements.txt',
        content: `fastapi==0.109.0
uvicorn[standard]==0.27.0
sqlalchemy==2.0.25
pydantic==2.5.3
pydantic-settings==2.1.0
python-dotenv==1.0.0
`,
      },
      {
        path: 'main.py',
        content: this.substituteVariables(
          `from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn

from app.api.v1 import api_router
from app.core.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Starting up {{projectName}}...")
    yield
    # Shutdown
    print("Shutting down...")


app = FastAPI(
    title="{{projectName}}",
    description="{{projectDescription}}",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
app.include_router(api_router, prefix="/api/v1")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "{{projectName}}"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
    )
`,
          variables
        ),
      },
      {
        path: 'app/__init__.py',
        content: '',
      },
      {
        path: 'app/core/__init__.py',
        content: '',
      },
      {
        path: 'app/core/config.py',
        content: this.substituteVariables(
          `from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "{{projectName}}"
    VERSION: str = "0.1.0"
    API_V1_STR: str = "/api/v1"

    # Database
    DATABASE_URL: str = "postgresql://user:password@localhost/{{projectName}}"

    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:8000"]

    # Security
    SECRET_KEY: str = "your-secret-key-here-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        env_file = ".env"


settings = Settings()
`,
          variables
        ),
      },
      {
        path: 'app/api/__init__.py',
        content: '',
      },
      {
        path: 'app/api/v1/__init__.py',
        content: `from fastapi import APIRouter

from app.api.v1 import health

api_router = APIRouter()
api_router.include_router(health.router, tags=["health"])
`,
      },
      {
        path: 'app/api/v1/health.py',
        content: `from fastapi import APIRouter
from datetime import datetime

router = APIRouter()


@router.get("/health")
async def health():
    return {
        "status": "ok",
        "timestamp": datetime.utcnow().isoformat(),
    }
`,
      },
      {
        path: 'app/models/__init__.py',
        content: '# Database models go here\n',
      },
      {
        path: 'app/schemas/__init__.py',
        content: '# Pydantic schemas go here\n',
      },
      {
        path: 'tests/__init__.py',
        content: '',
      },
      {
        path: 'tests/test_main.py',
        content: `from fastapi.testclient import TestClient
from main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_api_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
`,
      },
    ];
  }

  private generateVue3Template(variables: TemplateVariable): TemplateFile[] {
    return [
      {
        path: 'package.json',
        content: this.substituteVariables(
          JSON.stringify(
            {
              name: '{{projectName}}',
              version: '0.1.0',
              description: '{{projectDescription}}',
              private: true,
              scripts: {
                dev: 'vite',
                build: 'vue-tsc && vite build',
                preview: 'vite preview',
                test: 'vitest',
                lint: 'eslint . --ext .vue,.js,.jsx,.cjs,.mjs,.ts,.tsx,.cts,.mts --fix',
                format: 'prettier --write src/',
              },
              dependencies: {
                vue: '^3.4.15',
                'vue-router': '^4.2.5',
                pinia: '^2.1.7',
                axios: '^1.6.5',
              },
              devDependencies: {
                '@vitejs/plugin-vue': '^5.0.3',
                '@vue/eslint-config-typescript': '^12.0.0',
                '@vue/test-utils': '^2.4.3',
                eslint: '^8.56.0',
                'eslint-plugin-vue': '^9.20.1',
                prettier: '^3.2.4',
                typescript: '~5.3.3',
                vite: '^5.0.11',
                vitest: '^1.2.1',
                'vue-tsc': '^1.8.27',
              },
            },
            null,
            2
          ),
          variables
        ),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              useDefineForClassFields: true,
              module: 'ESNext',
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              skipLibCheck: true,
              moduleResolution: 'bundler',
              allowImportingTsExtensions: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: 'preserve',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noFallthroughCasesInSwitch: true,
              paths: {
                '@/*': ['./src/*'],
              },
            },
            include: ['src/**/*.ts', 'src/**/*.d.ts', 'src/**/*.tsx', 'src/**/*.vue'],
            references: [{ path: './tsconfig.node.json' }],
          },
          null,
          2
        ),
      },
      {
        path: 'tsconfig.node.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              composite: true,
              skipLibCheck: true,
              module: 'ESNext',
              moduleResolution: 'bundler',
              allowSyntheticDefaultImports: true,
            },
            include: ['vite.config.ts'],
          },
          null,
          2
        ),
      },
      {
        path: 'vite.config.ts',
        content: `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
`,
      },
      {
        path: 'index.html',
        content: this.substituteVariables(
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <link rel="icon" type="image/svg+xml" href="/vite.svg">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{projectName}}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>
`,
          variables
        ),
      },
      {
        path: 'src/main.ts',
        content: `import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import './assets/main.css'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
`,
      },
      {
        path: 'src/App.vue',
        content: this.substituteVariables(
          `<template>
  <div id="app">
    <nav>
      <RouterLink to="/">Home</RouterLink>
      <RouterLink to="/about">About</RouterLink>
    </nav>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
</script>

<style scoped>
nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f0f0f0;
}

nav a {
  text-decoration: none;
  color: #42b983;
  font-weight: 600;
}

nav a:hover {
  color: #35495e;
}

main {
  padding: 2rem;
}
</style>
`,
          variables
        ),
      },
      {
        path: 'src/views/HomeView.vue',
        content: this.substituteVariables(
          `<template>
  <div class="home">
    <h1>Welcome to {{projectName}}</h1>
    <p>{{projectDescription}}</p>

    <div class="counter">
      <p>Counter: {{ counter }}</p>
      <button @click="increment">Increment</button>
      <button @click="decrement">Decrement</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const counter = ref(0)

const increment = () => {
  counter.value++
}

const decrement = () => {
  counter.value--
}
</script>

<style scoped>
.home {
  text-align: center;
}

h1 {
  color: #42b983;
  margin-bottom: 1rem;
}

.counter {
  margin-top: 2rem;
}

button {
  margin: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #42b983;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

button:hover {
  background-color: #35495e;
}
</style>
`,
          variables
        ),
      },
      {
        path: 'src/views/AboutView.vue',
        content: this.substituteVariables(
          `<template>
  <div class="about">
    <h1>About {{projectName}}</h1>
    <p>This is a Vue 3 application built with TypeScript, Vite, and Vue Router.</p>

    <div class="tech-stack">
      <h2>Tech Stack</h2>
      <ul>
        <li>Vue 3 (Composition API)</li>
        <li>TypeScript</li>
        <li>Vue Router</li>
        <li>Pinia (State Management)</li>
        <li>Vite (Build Tool)</li>
        <li>Vitest (Testing)</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.about {
  max-width: 600px;
  margin: 0 auto;
}

h1 {
  color: #42b983;
  margin-bottom: 1rem;
}

.tech-stack {
  margin-top: 2rem;
  text-align: left;
}

ul {
  list-style: none;
  padding: 0;
}

li {
  padding: 0.5rem;
  margin: 0.5rem 0;
  background-color: #f0f0f0;
  border-radius: 4px;
}
</style>
`,
          variables
        ),
      },
      {
        path: 'src/router/index.ts',
        content: `import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue')
    }
  ]
})

export default router
`,
      },
      {
        path: 'src/stores/counter.ts',
        content: `import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  const count = ref(0)
  const doubleCount = computed(() => count.value * 2)

  function increment() {
    count.value++
  }

  function decrement() {
    count.value--
  }

  return { count, doubleCount, increment, decrement }
})
`,
      },
      {
        path: 'src/assets/main.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  line-height: 1.6;
  color: #2c3e50;
}

#app {
  min-height: 100vh;
}
`,
      },
      {
        path: 'src/vite-env.d.ts',
        content: `/// <reference types="vite/client" />
`,
      },
    ];
  }

  private generateReactTemplate(variables: TemplateVariable): TemplateFile[] {
    return [
      {
        path: 'package.json',
        content: this.substituteVariables(
          JSON.stringify(
            {
              name: '{{projectName}}',
              version: '0.1.0',
              description: '{{projectDescription}}',
              private: true,
              type: 'module',
              scripts: {
                dev: 'vite',
                build: 'tsc && vite build',
                preview: 'vite preview',
                test: 'vitest',
                lint: 'eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0',
              },
              dependencies: {
                react: '^18.2.0',
                'react-dom': '^18.2.0',
                'react-router-dom': '^6.21.3',
                axios: '^1.6.5',
              },
              devDependencies: {
                '@types/react': '^18.2.48',
                '@types/react-dom': '^18.2.18',
                '@typescript-eslint/eslint-plugin': '^6.19.0',
                '@typescript-eslint/parser': '^6.19.0',
                '@vitejs/plugin-react': '^4.2.1',
                eslint: '^8.56.0',
                'eslint-plugin-react-hooks': '^4.6.0',
                'eslint-plugin-react-refresh': '^0.4.5',
                typescript: '^5.3.3',
                vite: '^5.0.11',
                vitest: '^1.2.1',
                '@testing-library/react': '^14.1.2',
                '@testing-library/jest-dom': '^6.2.0',
              },
            },
            null,
            2
          ),
          variables
        ),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              useDefineForClassFields: true,
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              module: 'ESNext',
              skipLibCheck: true,
              moduleResolution: 'bundler',
              allowImportingTsExtensions: true,
              resolveJsonModule: true,
              isolatedModules: true,
              noEmit: true,
              jsx: 'react-jsx',
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noFallthroughCasesInSwitch: true,
              paths: {
                '@/*': ['./src/*'],
              },
            },
            include: ['src'],
            references: [{ path: './tsconfig.node.json' }],
          },
          null,
          2
        ),
      },
      {
        path: 'tsconfig.node.json',
        content: JSON.stringify(
          {
            compilerOptions: {
              composite: true,
              skipLibCheck: true,
              module: 'ESNext',
              moduleResolution: 'bundler',
              allowSyntheticDefaultImports: true,
            },
            include: ['vite.config.ts'],
          },
          null,
          2
        ),
      },
      {
        path: 'vite.config.ts',
        content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 3000,
    open: true
  }
})
`,
      },
      {
        path: 'index.html',
        content: this.substituteVariables(
          `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{{projectName}}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`,
          variables
        ),
      },
      {
        path: 'src/main.tsx',
        content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>,
)
`,
      },
      {
        path: 'src/App.tsx',
        content: this.substituteVariables(
          `import { Routes, Route, Link } from 'react-router-dom'
import Home from './pages/Home'
import About from './pages/About'
import './App.css'

function App() {
  return (
    <div className="app">
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>

      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
`,
          variables
        ),
      },
      {
        path: 'src/App.css',
        content: `.app {
  min-height: 100vh;
}

nav {
  display: flex;
  gap: 1rem;
  padding: 1rem;
  background-color: #f0f0f0;
}

nav a {
  text-decoration: none;
  color: #61dafb;
  font-weight: 600;
}

nav a:hover {
  color: #282c34;
}

main {
  padding: 2rem;
  text-align: center;
}
`,
      },
      {
        path: 'src/pages/Home.tsx',
        content: this.substituteVariables(
          `import { useState } from 'react'

function Home() {
  const [count, setCount] = useState(0)

  return (
    <div className="home">
      <h1>Welcome to {{projectName}}</h1>
      <p>{{projectDescription}}</p>

      <div className="counter">
        <p>Counter: {count}</p>
        <button onClick={() => setCount(count + 1)}>Increment</button>
        <button onClick={() => setCount(count - 1)}>Decrement</button>
      </div>
    </div>
  )
}

export default Home
`,
          variables
        ),
      },
      {
        path: 'src/pages/About.tsx',
        content: this.substituteVariables(
          `function About() {
  return (
    <div className="about">
      <h1>About {{projectName}}</h1>
      <p>This is a React application built with TypeScript, Vite, and React Router.</p>

      <div className="tech-stack">
        <h2>Tech Stack</h2>
        <ul>
          <li>React 18</li>
          <li>TypeScript</li>
          <li>React Router</li>
          <li>Vite (Build Tool)</li>
          <li>Vitest (Testing)</li>
        </ul>
      </div>
    </div>
  )
}

export default About
`,
          variables
        ),
      },
      {
        path: 'src/index.css',
        content: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
    Ubuntu, Cantarell, 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #282c34;
  line-height: 1.6;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New', monospace;
}

.counter {
  margin-top: 2rem;
}

button {
  margin: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: #61dafb;
  color: #282c34;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

button:hover {
  background-color: #21a1f1;
}

.tech-stack {
  margin-top: 2rem;
}

.tech-stack ul {
  list-style: none;
  padding: 0;
  max-width: 400px;
  margin: 1rem auto;
}

.tech-stack li {
  padding: 0.5rem;
  margin: 0.5rem 0;
  background-color: #f0f0f0;
  border-radius: 4px;
}
`,
      },
      {
        path: 'src/vite-env.d.ts',
        content: `/// <reference types="vite/client" />
`,
      },
    ];
  }

  private generateReactNativeTemplate(variables: TemplateVariable): TemplateFile[] {
    return [
      {
        path: 'package.json',
        content: this.substituteVariables(
          JSON.stringify(
            {
              name: '{{projectName}}',
              version: '0.1.0',
              description: '{{projectDescription}}',
              private: true,
              main: 'index.js',
              scripts: {
                start: 'expo start',
                android: 'expo start --android',
                ios: 'expo start --ios',
                web: 'expo start --web',
                test: 'jest',
                lint: 'eslint .',
              },
              dependencies: {
                expo: '~50.0.0',
                'expo-status-bar': '~1.11.1',
                react: '18.2.0',
                'react-native': '0.73.2',
                '@react-navigation/native': '^6.1.9',
                '@react-navigation/native-stack': '^6.9.17',
                'react-native-screens': '~3.29.0',
                'react-native-safe-area-context': '4.8.2',
                '@expo/vector-icons': '^14.0.0',
              },
              devDependencies: {
                '@babel/core': '^7.23.7',
                '@types/react': '~18.2.45',
                typescript: '^5.3.3',
                '@testing-library/react-native': '^12.4.3',
                jest: '^29.7.0',
                'jest-expo': '~50.0.0',
                'eslint': '^8.56.0',
                '@typescript-eslint/eslint-plugin': '^6.19.0',
                '@typescript-eslint/parser': '^6.19.0',
              },
            },
            null,
            2
          ),
          variables
        ),
      },
      {
        path: 'tsconfig.json',
        content: JSON.stringify(
          {
            extends: 'expo/tsconfig.base',
            compilerOptions: {
              strict: true,
              paths: {
                '@/*': ['./src/*'],
              },
            },
            include: ['**/*.ts', '**/*.tsx', '.expo/types/**/*.ts', 'expo-env.d.ts'],
          },
          null,
          2
        ),
      },
      {
        path: 'app.json',
        content: this.substituteVariables(
          JSON.stringify(
            {
              expo: {
                name: '{{projectName}}',
                slug: '{{projectName}}',
                version: '1.0.0',
                orientation: 'portrait',
                icon: './assets/icon.png',
                userInterfaceStyle: 'light',
                splash: {
                  image: './assets/splash.png',
                  resizeMode: 'contain',
                  backgroundColor: '#ffffff',
                },
                assetBundlePatterns: ['**/*'],
                ios: {
                  supportsTablet: true,
                  bundleIdentifier: 'com.{{projectName}}.app',
                },
                android: {
                  adaptiveIcon: {
                    foregroundImage: './assets/adaptive-icon.png',
                    backgroundColor: '#ffffff',
                  },
                  package: 'com.{{projectName}}.app',
                },
                web: {
                  favicon: './assets/favicon.png',
                },
              },
            },
            null,
            2
          ),
          variables
        ),
      },
      {
        path: 'babel.config.js',
        content: `module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
`,
      },
      {
        path: 'App.tsx',
        content: `import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import DetailsScreen from './src/screens/DetailsScreen';

export type RootStackParamList = {
  Home: undefined;
  Details: { itemId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="auto" />
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ title: 'Home' }}
        />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{ title: 'Details' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
`,
      },
      {
        path: 'src/screens/HomeScreen.tsx',
        content: this.substituteVariables(
          `import React, { useState } from 'react';
import { View, Text, StyleSheet, Button, FlatList, TouchableOpacity } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../App';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

type Props = {
  navigation: HomeScreenNavigationProp;
};

interface Item {
  id: number;
  title: string;
}

const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const [counter, setCounter] = useState(0);
  const [items] = useState<Item[]>([
    { id: 1, title: 'Item 1' },
    { id: 2, title: 'Item 2' },
    { id: 3, title: 'Item 3' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome to {{projectName}}</Text>
      <Text style={styles.subtitle}>{{projectDescription}}</Text>

      <View style={styles.counterContainer}>
        <Text style={styles.counterText}>Counter: {counter}</Text>
        <View style={styles.buttonRow}>
          <Button title="Increment" onPress={() => setCounter(counter + 1)} />
          <Button title="Decrement" onPress={() => setCounter(counter - 1)} />
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Navigate to:</Text>
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.listItem}
              onPress={() => navigation.navigate('Details', { itemId: item.id })}
            >
              <Text style={styles.listItemText}>{item.title}</Text>
            </TouchableOpacity>
          )}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#61dafb',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  counterContainer: {
    marginBottom: 30,
    padding: 15,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  counterText: {
    fontSize: 18,
    marginBottom: 10,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  listContainer: {
    flex: 1,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  listItem: {
    padding: 15,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    marginBottom: 10,
  },
  listItemText: {
    fontSize: 16,
    color: '#333',
  },
});

export default HomeScreen;
`,
          variables
        ),
      },
      {
        path: 'src/screens/DetailsScreen.tsx',
        content: this.substituteVariables(
          `import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../App';

type DetailsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Details'>;
type DetailsScreenRouteProp = RouteProp<RootStackParamList, 'Details'>;

type Props = {
  navigation: DetailsScreenNavigationProp;
  route: DetailsScreenRouteProp;
};

const DetailsScreen: React.FC<Props> = ({ navigation, route }) => {
  const { itemId } = route.params;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Details Screen</Text>
      <Text style={styles.itemId}>Item ID: {itemId}</Text>

      <View style={styles.infoContainer}>
        <Text style={styles.infoTitle}>About {{projectName}}</Text>
        <Text style={styles.infoText}>
          This is a React Native application built with:
        </Text>
        <View style={styles.techStack}>
          <Text style={styles.techItem}>• React Native & Expo</Text>
          <Text style={styles.techItem}>• TypeScript</Text>
          <Text style={styles.techItem}>• React Navigation</Text>
          <Text style={styles.techItem}>• Jest for testing</Text>
        </View>
      </View>

      <Button title="Go Back" onPress={() => navigation.goBack()} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#61dafb',
  },
  itemId: {
    fontSize: 18,
    marginBottom: 30,
    color: '#666',
  },
  infoContainer: {
    flex: 1,
    marginBottom: 20,
  },
  infoTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    marginBottom: 15,
    color: '#333',
  },
  techStack: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
  },
  techItem: {
    fontSize: 16,
    marginBottom: 8,
    color: '#444',
  },
});

export default DetailsScreen;
`,
          variables
        ),
      },
      {
        path: 'src/components/Button.tsx',
        content: `import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const CustomButton: React.FC<ButtonProps> = ({ title, onPress, style, textStyle }) => {
  return (
    <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
      <Text style={[styles.text, textStyle]}>{title}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#61dafb',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default CustomButton;
`,
      },
      {
        path: '.eslintrc.js',
        content: `module.exports = {
  extends: ['expo', 'prettier'],
  plugins: ['@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  rules: {
    '@typescript-eslint/no-unused-vars': 'warn',
    'react-hooks/exhaustive-deps': 'warn',
  },
};
`,
      },
      {
        path: 'jest.config.js',
        content: `module.exports = {
  preset: 'jest-expo',
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg)'
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
  ],
};
`,
      },
      {
        path: '.gitignore',
        content: `# OSX
.DS_Store

# Xcode
build/
*.pbxuser
!default.pbxuser
*.mode1v3
!default.mode1v3
*.mode2v3
!default.mode2v3
*.perspectivev3
!default.perspectivev3
xcuserdata
*.xccheckout
*.moved-aside
DerivedData
*.hmap
*.ipa
*.xcuserstate
project.xcworkspace

# Android/IJ
.idea
.gradle
local.properties
*.iml
*.hprof
.cxx/

# node.js
node_modules/
npm-debug.log
yarn-error.log

# Expo
.expo/
dist/
web-build/

# Environment
.env
.env.local

# Testing
coverage/
`,
      },
      {
        path: 'README.md',
        content: this.substituteVariables(
          `# {{projectName}}

{{projectDescription}}

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn
- Expo CLI: \`npm install -g expo-cli\`
- iOS Simulator (Mac only) or Android Studio

### Installation

\`\`\`bash
npm install
\`\`\`

### Development

\`\`\`bash
# Start Expo dev server
npm start

# Run on iOS Simulator
npm run ios

# Run on Android Emulator
npm run android

# Run in web browser
npm run web
\`\`\`

### Testing

\`\`\`bash
npm test
\`\`\`

### Linting

\`\`\`bash
npm run lint
\`\`\`

## Tech Stack

- **React Native** - Mobile framework
- **Expo** - Development platform
- **TypeScript** - Type safety
- **React Navigation** - Navigation library
- **Jest** - Testing framework

## Project Structure

\`\`\`
{{projectName}}/
├── src/
│   ├── screens/        # Screen components
│   ├── components/     # Reusable components
│   └── types/          # TypeScript types
├── assets/             # Images, fonts, etc.
├── App.tsx             # Root component
├── app.json            # Expo configuration
└── package.json
\`\`\`

## Building for Production

\`\`\`bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android
\`\`\`

## License

{{license}}

---

Generated with [Claude Agent SDK](https://github.com/dbbuilder/claude-agent-mcp-skills)
`,
          variables
        ),
      },
      {
        path: 'LICENSE',
        content: this.substituteVariables(
          `MIT License

Copyright (c) {{currentYear}} {{authorName}}

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
`,
          variables
        ),
      },
    ];
  }

  /**
   * Substitute template variables
   */
  private substituteVariables(content: string, variables: TemplateVariable): string {
    let result = content;
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, String(value));
    }
    return result;
  }

  /**
   * Generate next steps for the user
   */
  private generateNextSteps(options: ScaffoldOptions, projectPath: string): string[] {
    const steps: string[] = [
      `cd ${options.projectName}`,
      `npm install`,
      `cp .env.template .env`,
      `# Edit .env with your configuration`,
      `npm run dev`,
    ];

    if (options.options?.includeDocker) {
      steps.push('# Or run with Docker:');
      steps.push('docker-compose up');
    }

    return steps;
  }
}
