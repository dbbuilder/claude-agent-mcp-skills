/**
 * Template Registry Tests
 * Tests for template metadata and registry functionality
 */

import { getTemplate, listTemplates, getTemplatesByCategory } from '../src/templates/index.js';

describe('Template Registry', () => {
  describe('getTemplate', () => {
    it('should return TypeScript Express template metadata', () => {
      const template = getTemplate('typescript-express');

      expect(template.name).toBe('typescript-express');
      expect(template.displayName).toBe('TypeScript Express API');
      expect(template.language).toBe('TypeScript');
      expect(template.framework).toBe('Express');
      expect(template.category).toBe('backend');
    });

    it('should return Next.js template metadata', () => {
      const template = getTemplate('typescript-nextjs');

      expect(template.name).toBe('typescript-nextjs');
      expect(template.displayName).toBe('Next.js Full-Stack App');
      expect(template.language).toBe('TypeScript');
      expect(template.framework).toBe('Next.js');
      expect(template.category).toBe('fullstack');
    });

    it('should return .NET Web API template metadata', () => {
      const template = getTemplate('dotnet-webapi');

      expect(template.name).toBe('dotnet-webapi');
      expect(template.displayName).toBe('.NET 8 Web API');
      expect(template.language).toBe('C#');
      expect(template.framework).toBe('.NET');
      expect(template.category).toBe('backend');
    });

    it('should return Python FastAPI template metadata', () => {
      const template = getTemplate('python-fastapi');

      expect(template.name).toBe('python-fastapi');
      expect(template.displayName).toBe('Python FastAPI');
      expect(template.language).toBe('Python');
      expect(template.framework).toBe('FastAPI');
      expect(template.category).toBe('backend');
    });

    it('should return Vue 3 template metadata', () => {
      const template = getTemplate('vue3-frontend');

      expect(template.name).toBe('vue3-frontend');
      expect(template.displayName).toBe('Vue 3 Frontend');
      expect(template.language).toBe('TypeScript');
      expect(template.framework).toBe('Vue 3');
      expect(template.category).toBe('frontend');
    });

    it('should return React template metadata', () => {
      const template = getTemplate('react-frontend');

      expect(template.name).toBe('react-frontend');
      expect(template.displayName).toBe('React Frontend');
      expect(template.language).toBe('TypeScript');
      expect(template.framework).toBe('React');
      expect(template.category).toBe('frontend');
    });

    it('should return React Native template metadata', () => {
      const template = getTemplate('react-native');

      expect(template.name).toBe('react-native');
      expect(template.displayName).toBe('React Native Mobile App');
      expect(template.language).toBe('TypeScript');
      expect(template.framework).toBe('React Native');
      expect(template.category).toBe('frontend');
    });

    it('should throw error for unknown template', () => {
      expect(() => getTemplate('unknown-template' as any)).toThrow('Unknown template: unknown-template');
    });

    it('should include tags for all templates', () => {
      const expressTemplate = getTemplate('typescript-express');
      expect(expressTemplate.tags).toContain('typescript');
      expect(expressTemplate.tags).toContain('express');
      expect(expressTemplate.tags).toContain('rest-api');

      const reactNativeTemplate = getTemplate('react-native');
      expect(reactNativeTemplate.tags).toContain('react-native');
      expect(reactNativeTemplate.tags).toContain('mobile');
      expect(reactNativeTemplate.tags).toContain('ios');
      expect(reactNativeTemplate.tags).toContain('android');
    });
  });

  describe('listTemplates', () => {
    it('should return all 7 templates', () => {
      const templates = listTemplates();

      expect(templates.length).toBe(7);
      const names = templates.map((t: any) => t.name);
      expect(names).toContain('typescript-express');
      expect(names).toContain('typescript-nextjs');
      expect(names).toContain('dotnet-webapi');
      expect(names).toContain('python-fastapi');
      expect(names).toContain('vue3-frontend');
      expect(names).toContain('react-frontend');
      expect(names).toContain('react-native');
    });

    it('should return template metadata for each template', () => {
      const templates = listTemplates();

      templates.forEach((template: any) => {
        expect(template.name).toBeDefined();
        expect(template.displayName).toBeDefined();
        expect(template.description).toBeDefined();
        expect(template.language).toBeDefined();
        expect(template.framework).toBeDefined();
        expect(template.category).toBeDefined();
        expect(template.tags).toBeInstanceOf(Array);
        expect(template.defaultOptions).toBeDefined();
      });
    });
  });

  describe('getTemplatesByCategory', () => {
    it('should return backend templates', () => {
      const backendTemplates = getTemplatesByCategory('backend');

      expect(backendTemplates.length).toBe(3);
      expect(backendTemplates.map(t => t.name)).toEqual([
        'typescript-express',
        'dotnet-webapi',
        'python-fastapi',
      ]);
    });

    it('should return frontend templates', () => {
      const frontendTemplates = getTemplatesByCategory('frontend');

      expect(frontendTemplates.length).toBe(3);
      expect(frontendTemplates.map(t => t.name)).toEqual([
        'vue3-frontend',
        'react-frontend',
        'react-native',
      ]);
    });

    it('should return fullstack templates', () => {
      const fullstackTemplates = getTemplatesByCategory('fullstack');

      expect(fullstackTemplates.length).toBe(1);
      expect(fullstackTemplates[0].name).toBe('typescript-nextjs');
    });

    it('should return empty array for unknown category', () => {
      const templates = getTemplatesByCategory('unknown' as any);

      expect(templates.length).toBe(0);
    });
  });

  describe('Default Options', () => {
    it('should have default options for all templates', () => {
      const templates = listTemplates();

      templates.forEach((template: any) => {
        expect(template.defaultOptions).toBeDefined();
        expect(typeof template.defaultOptions.includeTests).toBe('boolean');
        expect(typeof template.defaultOptions.includeCICD).toBe('boolean');

        // React Native shouldn't have Docker by default
        if (template.name === 'react-native') {
          expect(template.defaultOptions.includeDocker).toBe(false);
        }
      });
    });
  });
});
