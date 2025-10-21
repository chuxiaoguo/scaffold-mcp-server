import { ViteBuilder } from '../../../core/nonFixedBuilder/viteBuilder';
import { PluginIntegrator } from '../../../core/plugins/PluginIntegrator';
import type { TechStack, GenerateOptions } from '../../../types/index';

// Mock PluginIntegrator
jest.mock('../../../core/plugins/PluginIntegrator');

describe('ViteBuilder', () => {
  let viteBuilder: ViteBuilder;
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
    
    viteBuilder = new ViteBuilder();
  });

  describe('build method', () => {
    it('should initialize plugin integrator', async () => {
      const techStack: TechStack = {
        framework: 'vue3',
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

      await viteBuilder.build(techStack, 'test-project');

      expect(mockPluginIntegrator.initialize).toHaveBeenCalledTimes(1);
    });

    it('should call integratePlugins with correct parameters', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm'
      };
      const projectName = 'my-react-app';
      const options: GenerateOptions = { force: true };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      await viteBuilder.build(techStack, projectName, options);

      expect(mockPluginIntegrator.integratePlugins).toHaveBeenCalledWith({
        tech_stack: [JSON.stringify(techStack)],
        project_name: projectName,
        output_dir: '.',
        options: options
      });
    });

    it('should use plugin configuration when available', async () => {
      const techStack: TechStack = {
        framework: 'vue3',
        language: 'typescript',
        packageManager: 'npm'
      };

      const mockMergedConfig = {
        dependencies: {
          'dep1': { name: 'vue', version: '^3.0.0', type: 'dependencies' as const },
          'dep2': { name: 'typescript', version: '^5.0.0', type: 'devDependencies' as const }
        },
        scripts: {
          'script1': { name: 'dev', command: 'vite' },
          'script2': { name: 'build', command: 'vite build' }
        },
        files: [
          { path: 'src/main.ts', content: 'console.log("Hello World");' },
          { path: 'package.json', content: '{}' }
        ]
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: true,
        mergedConfig: mockMergedConfig,
        activePlugins: ['vue3-plugin'],
        errors: [],
        warnings: []
      });

      const result = await viteBuilder.build(techStack, 'test-project');

      expect(result.dependencies).toEqual({ vue: '^3.0.0' });
      expect(result.devDependencies).toEqual({ typescript: '^5.0.0' });
      expect(result.scripts).toEqual({ dev: 'vite', build: 'vite build' });
      expect(result.files).toEqual({
        'src/main.ts': 'console.log("Hello World");',
        'package.json': '{}'
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

      const result = await viteBuilder.build(techStack, 'test-project');

      // Should have basic React + TypeScript dependencies
      expect(result.dependencies).toHaveProperty('react');
      expect(result.dependencies).toHaveProperty('react-dom');
      expect(result.devDependencies).toHaveProperty('vite');
      expect(result.devDependencies).toHaveProperty('typescript');
      expect(result.devDependencies).toHaveProperty('@vitejs/plugin-react');

      // Should have basic scripts
      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts).toHaveProperty('preview');

      // Should have basic files
      expect(result.files).toHaveProperty('vite.config.ts');
      expect(result.files).toHaveProperty('src/main.tsx');
      expect(result.files).toHaveProperty('index.html');
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

      const result = await viteBuilder.build(techStack, 'vue-app');

      // Should have Vue3 + TypeScript dependencies
      expect(result.dependencies).toHaveProperty('vue');
      expect(result.devDependencies).toHaveProperty('@vitejs/plugin-vue');
      expect(result.devDependencies).toHaveProperty('typescript');
      expect(result.devDependencies).toHaveProperty('vue-tsc');

      // Should have Vue-specific files
      expect(result.files).toHaveProperty('src/main.ts');
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

      const result = await viteBuilder.build(techStack, 'js-app');

      // Should not have TypeScript dependencies
      expect(result.devDependencies).not.toHaveProperty('typescript');
      expect(result.devDependencies).not.toHaveProperty('@types/react');

      // Should have JavaScript entry file
      expect(result.files).toHaveProperty('src/main.jsx');
    });
  });
});