import { WebpackBuilder } from '../../../core/nonFixedBuilder/webpackBuilder';
import { PluginIntegrator } from '../../../core/plugins/PluginIntegrator';
import type { TechStack, GenerateOptions } from '../../../types/index';

// Mock PluginIntegrator
jest.mock('../../../core/plugins/PluginIntegrator');

describe('WebpackBuilder', () => {
  let webpackBuilder: WebpackBuilder;
  let mockPluginIntegrator: jest.Mocked<PluginIntegrator>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockPluginIntegrator = {
      initialize: jest.fn(),
      integratePlugins: jest.fn(),
    } as any;

    // Mock the constructor
    (PluginIntegrator as jest.MockedClass<typeof PluginIntegrator>).mockImplementation(() => mockPluginIntegrator);
    
    webpackBuilder = new WebpackBuilder();
  });

  describe('build method', () => {
    it('should initialize plugin integrator', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'npm'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      await webpackBuilder.build(techStack, 'test-project');

      expect(mockPluginIntegrator.initialize).toHaveBeenCalledTimes(1);
    });

    it('should call integratePlugins with correct parameters', async () => {
      const techStack: TechStack = {
        framework: 'vue3',
        language: 'typescript',
        packageManager: 'pnpm'
      };
      const projectName = 'my-vue-app';
      const options: GenerateOptions = { force: true };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      await webpackBuilder.build(techStack, projectName, options);

      expect(mockPluginIntegrator.integratePlugins).toHaveBeenCalledWith({
        tech_stack: [JSON.stringify(techStack)],
        project_name: projectName,
        output_dir: '.',
        options: options
      });
    });

    it('should use plugin configuration when available', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'npm'
      };

      const mockMergedConfig = {
        dependencies: {
          'dep1': { name: 'react', version: '^18.0.0', type: 'dependencies' as const },
          'dep2': { name: 'webpack', version: '^5.0.0', type: 'devDependencies' as const }
        },
        scripts: {
          'script1': { name: 'start', command: 'webpack serve' },
          'script2': { name: 'build', command: 'webpack --mode production' }
        },
        files: [
          { path: 'src/index.tsx', content: 'import React from "react";' },
          { path: 'webpack.config.js', content: 'module.exports = {};' }
        ]
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: true,
        mergedConfig: mockMergedConfig,
        activePlugins: ['react-plugin'],
        errors: [],
        warnings: []
      });

      const result = await webpackBuilder.build(techStack, 'test-project');

      expect(result.dependencies).toEqual({ react: '^18.0.0' });
      expect(result.devDependencies).toEqual({ webpack: '^5.0.0' });
      expect(result.scripts).toEqual({ start: 'webpack serve', build: 'webpack --mode production' });
      expect(result.files).toEqual({
        'src/index.tsx': 'import React from "react";',
        'webpack.config.js': 'module.exports = {};'
      });
    });

    it('should fallback to basic configuration when plugin integration fails', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'npm'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: ['Plugin error'],
        warnings: ['Plugin warning']
      });

      const result = await webpackBuilder.build(techStack, 'test-project');

      // Should have basic React + TypeScript dependencies
      expect(result.dependencies).toHaveProperty('react');
      expect(result.dependencies).toHaveProperty('react-dom');
      expect(result.devDependencies).toHaveProperty('webpack');
      expect(result.devDependencies).toHaveProperty('typescript');

      // Should have basic scripts
      expect(result.scripts).toHaveProperty('start');
      expect(result.scripts).toHaveProperty('build');

      // Should have basic files
      expect(result.files).toHaveProperty('webpack.config.js');
      expect(result.files).toHaveProperty('src/index.tsx');
    });

    it('should handle Vue3 with TypeScript correctly', async () => {
      const techStack: TechStack = {
        framework: 'vue3',
        language: 'typescript',
        packageManager: 'pnpm'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await webpackBuilder.build(techStack, 'vue-app');

      // Should have Vue3 + TypeScript dependencies
      expect(result.dependencies).toHaveProperty('vue');
      expect(result.devDependencies).toHaveProperty('vue-loader');
      expect(result.devDependencies).toHaveProperty('typescript');

      // Should have Vue-specific files
      expect(result.files).toHaveProperty('src/main.ts');
      expect(result.files).toHaveProperty('src/App.vue');
    });

    it('should handle Vue2 projects correctly', async () => {
      const techStack: TechStack = {
        framework: 'vue2',
        language: 'javascript',
        packageManager: 'npm'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await webpackBuilder.build(techStack, 'vue2-app');

      // Should have Vue2 dependencies
      expect(result.dependencies).toHaveProperty('vue');
      expect(result.devDependencies).toHaveProperty('vue-loader');
      expect(result.devDependencies).toHaveProperty('vue-template-compiler');

      // Should have Vue2-specific files
      expect(result.files).toHaveProperty('src/main.js');
      expect(result.files).toHaveProperty('src/App.vue');
    });

    it('should handle JavaScript projects correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'javascript',
        packageManager: 'yarn'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await webpackBuilder.build(techStack, 'js-app');

      // Should not have TypeScript dependencies
      expect(result.devDependencies).not.toHaveProperty('typescript');
      expect(result.devDependencies).not.toHaveProperty('@types/react');

      // Should have JavaScript entry file
      expect(result.files).toHaveProperty('src/index.jsx');
    });
  });
});