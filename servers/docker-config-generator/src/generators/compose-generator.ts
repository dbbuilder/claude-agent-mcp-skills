/**
 * Docker Compose Generator
 * Generates docker-compose.yml with application and database services
 */

import { DatabaseType, ServiceConfig, DockerComposeOptions } from '../types.js';

export class ComposeGenerator {
  /**
   * Generate docker-compose.yml
   */
  generate(options: DockerComposeOptions): string {
    const { projectName, services, networks = ['app-network'], volumes } = options;

    const lines: string[] = [];

    lines.push('version: "3.8"');
    lines.push('');
    lines.push('services:');

    // Generate service configurations
    for (const service of services) {
      lines.push(...this.generateService(service));
    }

    // Networks
    if (networks.length > 0) {
      lines.push('');
      lines.push('networks:');
      for (const network of networks) {
        lines.push(`  ${network}:`);
        lines.push('    driver: bridge');
      }
    }

    // Volumes
    if (volumes && volumes.length > 0) {
      lines.push('');
      lines.push('volumes:');
      for (const volume of volumes) {
        lines.push(`  ${volume.name}:`);
        if (volume.driver) {
          lines.push(`    driver: ${volume.driver}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate service configuration
   */
  private generateService(service: ServiceConfig): string[] {
    const lines: string[] = [];

    lines.push(`  ${service.name}:`);

    // Image or build
    if (service.image) {
      lines.push(`    image: ${service.image}`);
    } else if (service.build) {
      lines.push('    build:');
      lines.push(`      context: ${service.build.context}`);
      lines.push(`      dockerfile: ${service.build.dockerfile}`);
    }

    // Container name
    lines.push(`    container_name: ${service.name}`);

    // Restart policy
    lines.push('    restart: unless-stopped');

    // Ports
    if (service.ports && service.ports.length > 0) {
      lines.push('    ports:');
      for (const port of service.ports) {
        lines.push(`      - "${port}"`);
      }
    }

    // Environment variables
    if (service.environment && Object.keys(service.environment).length > 0) {
      lines.push('    environment:');
      for (const [key, value] of Object.entries(service.environment)) {
        lines.push(`      ${key}: ${value}`);
      }
    }

    // Volumes
    if (service.volumes && service.volumes.length > 0) {
      lines.push('    volumes:');
      for (const volume of service.volumes) {
        lines.push(`      - ${volume}`);
      }
    }

    // Depends on
    if (service.dependsOn && service.dependsOn.length > 0) {
      lines.push('    depends_on:');
      for (const dep of service.dependsOn) {
        lines.push(`      - ${dep}`);
      }
    }

    // Health check
    if (service.healthcheck) {
      lines.push('    healthcheck:');
      lines.push(`      test: [${service.healthcheck.test.map(t => `"${t}"`).join(', ')}]`);
      lines.push(`      interval: ${service.healthcheck.interval}`);
      lines.push(`      timeout: ${service.healthcheck.timeout}`);
      lines.push(`      retries: ${service.healthcheck.retries}`);
      if (service.healthcheck.startPeriod) {
        lines.push(`      start_period: ${service.healthcheck.startPeriod}`);
      }
    }

    // Networks
    lines.push('    networks:');
    lines.push('      - app-network');

    lines.push('');

    return lines;
  }

  /**
   * Generate database service configuration
   */
  generateDatabaseService(database: DatabaseType, projectName: string): ServiceConfig {
    switch (database) {
      case 'postgresql':
        return {
          name: 'postgres',
          type: 'database',
          image: 'postgres:16-alpine',
          ports: ['5432:5432'],
          environment: {
            POSTGRES_DB: `${projectName}_db`,
            POSTGRES_USER: 'postgres',
            POSTGRES_PASSWORD: 'postgres',
          },
          volumes: ['postgres-data:/var/lib/postgresql/data'],
          healthcheck: {
            test: ['CMD-SHELL', 'pg_isready -U postgres'],
            interval: '10s',
            timeout: '5s',
            retries: 5,
          },
        };

      case 'mysql':
        return {
          name: 'mysql',
          type: 'database',
          image: 'mysql:8.0',
          ports: ['3306:3306'],
          environment: {
            MYSQL_DATABASE: `${projectName}_db`,
            MYSQL_ROOT_PASSWORD: 'root',
          },
          volumes: ['mysql-data:/var/lib/mysql'],
          healthcheck: {
            test: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
            interval: '10s',
            timeout: '5s',
            retries: 5,
          },
        };

      case 'mongodb':
        return {
          name: 'mongo',
          type: 'database',
          image: 'mongo:7',
          ports: ['27017:27017'],
          environment: {
            MONGO_INITDB_DATABASE: `${projectName}_db`,
            MONGO_INITDB_ROOT_USERNAME: 'mongo',
            MONGO_INITDB_ROOT_PASSWORD: 'mongo',
          },
          volumes: ['mongo-data:/data/db'],
          healthcheck: {
            test: ['CMD', 'mongosh', '--eval', 'db.adminCommand("ping")'],
            interval: '10s',
            timeout: '5s',
            retries: 5,
          },
        };

      case 'sqlserver':
        return {
          name: 'sqlserver',
          type: 'database',
          image: 'mcr.microsoft.com/mssql/server:2022-latest',
          ports: ['1433:1433'],
          environment: {
            ACCEPT_EULA: 'Y',
            SA_PASSWORD: 'YourStrong@Passw0rd',
            MSSQL_PID: 'Developer',
          },
          volumes: ['sqlserver-data:/var/opt/mssql'],
          healthcheck: {
            test: ['CMD-SHELL', '/opt/mssql-tools/bin/sqlcmd -S localhost -U sa -P YourStrong@Passw0rd -Q "SELECT 1"'],
            interval: '10s',
            timeout: '5s',
            retries: 5,
            startPeriod: '60s',
          },
        };

      case 'redis':
        return {
          name: 'redis',
          type: 'cache',
          image: 'redis:7-alpine',
          ports: ['6379:6379'],
          volumes: ['redis-data:/data'],
          healthcheck: {
            test: ['CMD', 'redis-cli', 'ping'],
            interval: '10s',
            timeout: '5s',
            retries: 5,
          },
        };

      default:
        throw new Error(`Unsupported database type: ${database}`);
    }
  }
}
