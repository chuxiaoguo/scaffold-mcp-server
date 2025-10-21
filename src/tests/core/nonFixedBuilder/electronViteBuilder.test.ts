import { ElectronViteBuilder } from '../../../core/nonFixedBuilder/electronViteBuilder';
import { PluginIntegrator } from '../../../core/plugins/PluginIntegrator';
import type { TechStack, GenerateOptions } from '../../../types/index';

// Mock PluginIntegrator
jest.mock('../../../core/plugins/PluginIntegrator');

describe('ElectronViteBuilder', () => {
  let electronViteBuilder: ElectronViteBuilder;
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
    
    electronViteBuilder = new ElectronViteBuilder();
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

      await electronViteBuilder.build(techStack, 'test-project');

      expect(mockPluginIntegrator.initialize).toHaveBeenCalledTimes(1);
    });

    it('should call integratePlugins with correct parameters', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm'
      };
      const projectName = 'my-electron-app';
      const options: GenerateOptions = { force: true };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      await electronViteBuilder.build(techStack, projectName, options);

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
          'dep2': { name: 'electron', version: '^25.0.0', type: 'devDependencies' as const }
        },
        scripts: {
          'script1': { name: 'dev', command: 'electron-vite dev' },
          'script2': { name: 'build', command: 'electron-vite build' }
        },
        files: [
          { path: 'src/main/index.ts', content: 'console.log("Main process");' },
          { path: 'src/renderer/main.ts', content: 'console.log("Renderer process");' }
        ]
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: true,
        mergedConfig: mockMergedConfig,
        activePlugins: ['electron-plugin'],
        errors: [],
        warnings: []
      });

      const result = await electronViteBuilder.build(techStack, 'test-project');

      expect(result.dependencies).toEqual({ vue: '^3.0.0' });
      expect(result.devDependencies).toEqual({ electron: '^25.0.0' });
      expect(result.scripts).toEqual({ dev: 'electron-vite dev', build: 'electron-vite build' });
      expect(result.files).toEqual({
        'src/main/index.ts': 'console.log("Main process");',
        'src/renderer/main.ts': 'console.log("Renderer process");'
      });
    });

    it('should fallback to basic configuration when plugin integration fails', async () => {
      const techStack: TechStack = {
        framework: 'vue3',
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

      const result = await electronViteBuilder.build(techStack, 'test-project');

      // Should have basic Electron + Vue3 dependencies
      expect(result.dependencies).toHaveProperty('vue');
      expect(result.devDependencies).toHaveProperty('electron');
      expect(result.devDependencies).toHaveProperty('electron-vite');
      expect(result.devDependencies).toHaveProperty('@vitejs/plugin-vue');

      // Should have basic scripts
      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts).toHaveProperty('preview');

      // Should have basic files
      expect(result.files).toHaveProperty('electron.vite.config.ts');
      expect(result.files).toHaveProperty('src/main/index.ts');
      expect(result.files).toHaveProperty('src/renderer/src/main.ts');
    });

    it('should handle React with TypeScript correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
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

      const result = await electronViteBuilder.build(techStack, 'react-electron-app');

      // Should have React + Electron dependencies
      expect(result.dependencies).toHaveProperty('react');
      expect(result.dependencies).toHaveProperty('react-dom');
      expect(result.devDependencies).toHaveProperty('electron');
      expect(result.devDependencies).toHaveProperty('@vitejs/plugin-react');
      expect(result.devDependencies).toHaveProperty('typescript');

      // Should have React-specific files
      expect(result.files).toHaveProperty('src/renderer/src/main.tsx');
      expect(result.files).toHaveProperty('src/renderer/src/App.tsx');
    });

    it('should handle Vue3 with TypeScript correctly', async () => {
      const techStack: TechStack = {
        framework: 'vue3',
        language: 'typescript',
        packageManager: 'yarn'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await electronViteBuilder.build(techStack, 'vue-electron-app');

      // Should have Vue3 + Electron dependencies
      expect(result.dependencies).toHaveProperty('vue');
      expect(result.devDependencies).toHaveProperty('electron');
      expect(result.devDependencies).toHaveProperty('@vitejs/plugin-vue');
      expect(result.devDependencies).toHaveProperty('typescript');
      expect(result.devDependencies).toHaveProperty('vue-tsc');

      // Should have Vue-specific files
      expect(result.files).toHaveProperty('src/renderer/src/main.ts');
      expect(result.files).toHaveProperty('src/renderer/src/App.vue');
    });

    it('should handle JavaScript projects correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
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

      const result = await electronViteBuilder.build(techStack, 'js-electron-app');

      // Should not have TypeScript dependencies
      expect(result.devDependencies).not.toHaveProperty('typescript');
      expect(result.devDependencies).not.toHaveProperty('@types/react');

      // Should have JavaScript entry files
      expect(result.files).toHaveProperty('src/main/index.js');
      expect(result.files).toHaveProperty('src/renderer/src/main.jsx');
    });

    it('should include Electron-specific configuration files', async () => {
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

      const result = await electronViteBuilder.build(techStack, 'electron-app');

      // Should have Electron-specific files
      expect(result.files).toHaveProperty('electron.vite.config.ts');
      expect(result.files).toHaveProperty('src/main/index.ts');
      expect(result.files).toHaveProperty('src/preload/index.ts');
      expect(result.files).toHaveProperty('src/renderer/index.html');

      // Should have proper Electron scripts
      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts).toHaveProperty('build:win');
      expect(result.scripts).toHaveProperty('build:mac');
      expect(result.scripts).toHaveProperty('build:linux');
    });

    it('should include electron-builder configuration', async () => {
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

      const result = await electronViteBuilder.build(techStack, 'electron-app');

      // Should have electron-builder dependency
      expect(result.devDependencies).toHaveProperty('electron-builder');

      // Should have build scripts for different platforms
      expect(result.scripts['build:win']).toContain('electron-builder --win');
      expect(result.scripts['build:mac']).toContain('electron-builder --mac');
      expect(result.scripts['build:linux']).toContain('electron-builder --linux');
    });
  });
});