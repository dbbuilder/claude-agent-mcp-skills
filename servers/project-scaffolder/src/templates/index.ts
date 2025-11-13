/**
 * Template Registry
 * Metadata for all available project templates
 */

import { TemplateMetadata, ProjectTemplate } from '../types.js';

export const TEMPLATES: Record<ProjectTemplate, TemplateMetadata> = {
  'typescript-express': {
    name: 'typescript-express',
    displayName: 'TypeScript Express API',
    description: 'REST API with TypeScript, Express, and PostgreSQL',
    language: 'TypeScript',
    framework: 'Express',
    category: 'backend',
    tags: ['rest-api', 'typescript', 'express', 'postgresql', 'jwt'],
    defaultOptions: {
      database: 'postgresql',
      authentication: 'jwt',
      includeDocker: true,
      includeTests: true,
      includeCICD: true,
    },
  },
  'typescript-nextjs': {
    name: 'typescript-nextjs',
    displayName: 'Next.js Full-Stack',
    description: 'Full-stack Next.js app with TypeScript and Tailwind CSS',
    language: 'TypeScript',
    framework: 'Next.js',
    category: 'fullstack',
    tags: ['nextjs', 'react', 'typescript', 'tailwindcss', 'fullstack'],
    defaultOptions: {
      database: 'postgresql',
      authentication: 'jwt',
      includeDocker: true,
      includeTests: true,
      includeCICD: true,
    },
  },
  'dotnet-webapi': {
    name: 'dotnet-webapi',
    displayName: '.NET Web API',
    description: 'ASP.NET Core Web API with Entity Framework Core',
    language: 'C#',
    framework: 'ASP.NET Core',
    category: 'backend',
    tags: ['dotnet', 'csharp', 'webapi', 'entityframework', 'rest-api'],
    defaultOptions: {
      database: 'sqlserver',
      authentication: 'jwt',
      includeDocker: true,
      includeTests: true,
      includeCICD: true,
    },
  },
  'python-fastapi': {
    name: 'python-fastapi',
    displayName: 'Python FastAPI',
    description: 'FastAPI REST API with SQLAlchemy and Pydantic',
    language: 'Python',
    framework: 'FastAPI',
    category: 'backend',
    tags: ['python', 'fastapi', 'sqlalchemy', 'pydantic', 'rest-api'],
    defaultOptions: {
      database: 'postgresql',
      authentication: 'jwt',
      includeDocker: true,
      includeTests: true,
      includeCICD: true,
    },
  },
  'vue3-frontend': {
    name: 'vue3-frontend',
    displayName: 'Vue 3 Frontend',
    description: 'Vue 3 + TypeScript + Vite + Pinia',
    language: 'TypeScript',
    framework: 'Vue 3',
    category: 'frontend',
    tags: ['vue', 'typescript', 'vite', 'pinia', 'frontend'],
    defaultOptions: {
      includeDocker: true,
      includeTests: true,
      includeCICD: true,
    },
  },
  'react-frontend': {
    name: 'react-frontend',
    displayName: 'React Frontend',
    description: 'React + TypeScript + Vite + Redux Toolkit',
    language: 'TypeScript',
    framework: 'React',
    category: 'frontend',
    tags: ['react', 'typescript', 'vite', 'redux', 'frontend'],
    defaultOptions: {
      includeDocker: true,
      includeTests: true,
      includeCICD: true,
    },
  },
  'react-native': {
    name: 'react-native',
    displayName: 'React Native Mobile App',
    description: 'React Native + Expo + TypeScript + React Navigation',
    language: 'TypeScript',
    framework: 'React Native',
    category: 'frontend',
    tags: ['react-native', 'expo', 'typescript', 'mobile', 'ios', 'android'],
    defaultOptions: {
      includeDocker: false,
      includeTests: true,
      includeCICD: true,
    },
  },
};

export function getTemplate(name: ProjectTemplate): TemplateMetadata {
  return TEMPLATES[name];
}

export function listTemplates(): TemplateMetadata[] {
  return Object.values(TEMPLATES);
}

export function getTemplatesByCategory(
  category: 'backend' | 'frontend' | 'fullstack'
): TemplateMetadata[] {
  return Object.values(TEMPLATES).filter((t) => t.category === category);
}
