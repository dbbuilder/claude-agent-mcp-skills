/**
 * Docker Configuration Generator
 * Main orchestrator for Docker configuration generation
 */

import * as fs from 'fs';
import * as path from 'path';
import { ProjectAnalyzer } from './analyzers/project-analyzer.js';
import { DockerfileGenerator } from './generators/dockerfile-generator.js';
import { ComposeGenerator } from './generators/compose-generator.js';
import {
  AnalyzeOptions,
  GenerateDockerfileOptions,
  GenerateComposeOptions,
  GenerateResult,
  ServiceConfig,
  VolumeConfig,
} from './types.js';

export class DockerGenerator {
  private analyzer: ProjectAnalyzer;
  private dockerfileGenerator: DockerfileGenerator;
  private composeGenerator: ComposeGenerator;

  constructor() {
    this.analyzer = new ProjectAnalyzer();
    this.dockerfileGenerator = new DockerfileGenerator();
    this.composeGenerator = new ComposeGenerator();
  }

  /**
   * Analyze project structure
   */
  async analyzeProject(options: AnalyzeOptions) {
    return await this.analyzer.analyze(options.projectPath);
  }

  /**
   * Generate Dockerfile
   */
  async generateDockerfile(options: GenerateDockerfileOptions): Promise<GenerateResult> {
    try {
      const { projectPath, projectType, outputPath, options: dockerOptions } = options;

      // Use provided options or analyze project
      let finalProjectType = projectType;
      let finalPort = dockerOptions?.port;
      let finalBuildCommand = dockerOptions?.buildCommand;
      let finalStartCommand = dockerOptions?.startCommand;

      if (projectPath) {
        const analysis = await this.analyzer.analyze(projectPath);
        finalProjectType = projectType || analysis.projectType;
        finalPort = dockerOptions?.port || analysis.port;
        finalBuildCommand = dockerOptions?.buildCommand || analysis.buildCommand;
        finalStartCommand = dockerOptions?.startCommand || analysis.startCommand;
      }

      // Generate Dockerfile
      const dockerfileContent = this.dockerfileGenerator.generate({
        projectType: finalProjectType,
        port: finalPort,
        buildCommand: finalBuildCommand,
        startCommand: finalStartCommand,
        ...dockerOptions,
      });

      // Generate .dockerignore
      const dockerignoreContent = this.dockerfileGenerator.generateDockerignore(finalProjectType);

      // Write files if output path specified
      if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, dockerfileContent, 'utf-8');

        const dockerignorePath = path.join(dir, '.dockerignore');
        fs.writeFileSync(dockerignorePath, dockerignoreContent, 'utf-8');

        return {
          success: true,
          dockerfilePath: outputPath,
          dockerignorePath,
        };
      }

      // Return content without writing files
      return {
        success: true,
        content: {
          dockerfile: dockerfileContent,
          dockerignore: dockerignoreContent,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generate Docker Compose configuration
   */
  async generateCompose(options: GenerateComposeOptions): Promise<GenerateResult> {
    try {
      const { projectPath, outputPath, databases = [], includeRedis = false } = options;

      // Analyze project
      const analysis = await this.analyzer.analyze(projectPath);

      // Determine project name from directory
      const projectName = path.basename(projectPath).toLowerCase().replace(/[^a-z0-9-]/g, '-');

      // Build services list
      const services: ServiceConfig[] = [];

      // App service
      const appService: ServiceConfig = {
        name: 'app',
        type: 'app',
        build: {
          context: '.',
          dockerfile: 'Dockerfile',
        },
        ports: [`${analysis.port || 3000}:${analysis.port || 3000}`],
        environment: {
          NODE_ENV: 'production',
          PORT: String(analysis.port || 3000),
        },
        volumes: ['.:/app', '/app/node_modules'],
        dependsOn: [],
      };

      // Add database services
      const databasesToAdd = databases.length > 0 ? databases : analysis.databases;
      const volumes: VolumeConfig[] = [];

      for (const db of databasesToAdd) {
        const dbService = this.composeGenerator.generateDatabaseService(db, projectName);
        services.push(dbService);
        appService.dependsOn?.push(dbService.name);

        // Add database environment variables to app
        if (db === 'postgresql') {
          appService.environment!.DATABASE_URL = 'postgresql://postgres:postgres@postgres:5432/' + projectName + '_db';
          volumes.push({ name: 'postgres-data' });
        } else if (db === 'mysql') {
          appService.environment!.DATABASE_URL = 'mysql://root:root@mysql:3306/' + projectName + '_db';
          volumes.push({ name: 'mysql-data' });
        } else if (db === 'mongodb') {
          appService.environment!.MONGO_URL = 'mongodb://mongo:mongo@mongo:27017/' + projectName + '_db';
          volumes.push({ name: 'mongo-data' });
        } else if (db === 'sqlserver') {
          appService.environment!.DATABASE_URL = 'sqlserver://sqlserver:1433;Database=' + projectName + '_db';
          volumes.push({ name: 'sqlserver-data' });
        } else if (db === 'redis') {
          appService.environment!.REDIS_URL = 'redis://redis:6379';
          volumes.push({ name: 'redis-data' });
        }
      }

      // Add Redis if requested
      if (includeRedis && !databasesToAdd.includes('redis')) {
        const redisService = this.composeGenerator.generateDatabaseService('redis', projectName);
        services.push(redisService);
        appService.dependsOn?.push(redisService.name);
        appService.environment!.REDIS_URL = 'redis://redis:6379';
        volumes.push({ name: 'redis-data' });
      }

      // Add app service first
      services.unshift(appService);

      // Generate compose file
      const composeContent = this.composeGenerator.generate({
        projectName,
        services,
        volumes,
      });

      // Write file if output path specified
      if (outputPath) {
        const dir = path.dirname(outputPath);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }

        fs.writeFileSync(outputPath, composeContent, 'utf-8');

        return {
          success: true,
          dockerComposePath: outputPath,
        };
      }

      // Return content without writing files
      return {
        success: true,
        content: {
          dockerCompose: composeContent,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Complete workflow: analyze and generate all Docker configs
   */
  async generate(projectPath: string, outputDir?: string): Promise<GenerateResult> {
    try {
      // Analyze project
      const analysis = await this.analyzer.analyze(projectPath);

      const finalOutputDir = outputDir || projectPath;

      // Generate Dockerfile
      const dockerfileResult = await this.generateDockerfile({
        projectPath,
        projectType: analysis.projectType,
        outputPath: path.join(finalOutputDir, 'Dockerfile'),
        options: {
          projectType: analysis.projectType,
          port: analysis.port,
          buildCommand: analysis.buildCommand,
          startCommand: analysis.startCommand,
        },
      });

      if (!dockerfileResult.success) {
        return dockerfileResult;
      }

      // Generate Docker Compose if database is needed
      let composeResult: GenerateResult | undefined;
      if (analysis.hasDatabase) {
        composeResult = await this.generateCompose({
          projectPath,
          outputPath: path.join(finalOutputDir, 'docker-compose.yml'),
          databases: analysis.databases,
        });

        if (!composeResult.success) {
          return composeResult;
        }
      }

      return {
        success: true,
        dockerfilePath: dockerfileResult.dockerfilePath,
        dockerignorePath: dockerfileResult.dockerignorePath,
        dockerComposePath: composeResult?.dockerComposePath,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }
}
