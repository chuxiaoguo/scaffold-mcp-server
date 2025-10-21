import { UmiBuilder } from '../../../core/nonFixedBuilder/umiBuilder';
import { PluginIntegrator } from '../../../core/plugins/PluginIntegrator';
import type { TechStack, GenerateOptions } from '../../../types/index';

// Mock PluginIntegrator
jest.mock('../../../core/plugins/PluginIntegrator');

describe('UmiBuilder', () => {
  let umiBuilder: UmiBuilder;
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
    
    umiBuilder = new UmiBuilder();
  });

  describe('build method', () => {
    it('should initialize plugin integrator', async () => {
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

      await umiBuilder.build(techStack, 'test-project');

      expect(mockPluginIntegrator.initialize).toHaveBeenCalledTimes(1);
    });

    it('should call integratePlugins with correct parameters', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm',
        ui: 'antd',
        state: 'redux'
      };
      const projectName = 'my-umi-app';
      const options: GenerateOptions = { force: true };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      await umiBuilder.build(techStack, projectName, options);

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
        packageManager: 'pnpm'
      };

      const mockMergedConfig = {
        dependencies: {
          'dep1': { name: 'umi', version: '^4.0.0', type: 'dependencies' as const },
          'dep2': { name: 'typescript', version: '^5.0.0', type: 'devDependencies' as const }
        },
        scripts: {
          'script1': { name: 'dev', command: 'umi dev' },
          'script2': { name: 'build', command: 'umi build' }
        },
        files: [
          { path: '.umirc.ts', content: 'export default {};' },
          { path: 'src/pages/index.tsx', content: 'export default () => <div>Hello</div>;' }
        ]
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: true,
        mergedConfig: mockMergedConfig,
        activePlugins: ['umi-plugin'],
        errors: [],
        warnings: []
      });

      const result = await umiBuilder.build(techStack, 'test-project');

      expect(result.dependencies).toEqual({ umi: '^4.0.0' });
      expect(result.devDependencies).toEqual({ typescript: '^5.0.0' });
      expect(result.scripts).toEqual({ dev: 'umi dev', build: 'umi build' });
      expect(result.files).toEqual({
        '.umirc.ts': 'export default {};',
        'src/pages/index.tsx': 'export default () => <div>Hello</div>;'
      });
    });

    it('should fallback to basic configuration when plugin integration fails', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: ['Plugin error'],
        warnings: ['Plugin warning']
      });

      const result = await umiBuilder.build(techStack, 'test-project');

      // Should have basic Umi dependencies
      expect(result.dependencies).toHaveProperty('umi');
      expect(result.dependencies).toHaveProperty('react');
      expect(result.dependencies).toHaveProperty('react-dom');
      expect(result.devDependencies).toHaveProperty('typescript');

      // Should have basic scripts
      expect(result.scripts).toHaveProperty('dev');
      expect(result.scripts).toHaveProperty('build');
      expect(result.scripts).toHaveProperty('preview');
      expect(result.scripts).toHaveProperty('lint');

      // Should have basic files
      expect(result.files).toHaveProperty('.umirc.ts');
      expect(result.files).toHaveProperty('src/pages/index.tsx');
      expect(result.files).toHaveProperty('src/layouts/index.tsx');
      expect(result.files).toHaveProperty('src/app.ts');
    });

    it('should handle different UI libraries correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm',
        ui: 'antd'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await umiBuilder.build(techStack, 'antd-app');

      // Should have Ant Design dependencies
      expect(result.dependencies).toHaveProperty('antd');
      expect(result.dependencies).toHaveProperty('@ant-design/icons');
    });

    it('should handle different state management libraries correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm',
        state: 'redux'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await umiBuilder.build(techStack, 'redux-app');

      // Should have Redux dependencies
      expect(result.dependencies).toHaveProperty('@reduxjs/toolkit');
      expect(result.dependencies).toHaveProperty('react-redux');
    });

    it('should handle Zustand state management correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm',
        state: 'zustand'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await umiBuilder.build(techStack, 'zustand-app');

      // Should have Zustand dependency
      expect(result.dependencies).toHaveProperty('zustand');
    });

    it('should handle different CSS preprocessors correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm',
        style: 'less'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await umiBuilder.build(techStack, 'less-app');

      // Should have Less dependency
      expect(result.devDependencies).toHaveProperty('less');
    });

    it('should handle Tailwind CSS correctly', async () => {
      const techStack: TechStack = {
        framework: 'react',
        language: 'typescript',
        packageManager: 'pnpm',
        style: 'tailwindcss'
      };

      mockPluginIntegrator.integratePlugins.mockResolvedValue({
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors: [],
        warnings: []
      });

      const result = await umiBuilder.build(techStack, 'tailwind-app');

      // Should have Tailwind CSS dependencies
      expect(result.devDependencies).toHaveProperty('tailwindcss');
      expect(result.devDependencies).toHaveProperty('autoprefixer');
      expect(result.devDependencies).toHaveProperty('postcss');

      // Should have PostCSS config file
      expect(result.files).toHaveProperty('postcss.config.js');
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

      const result = await umiBuilder.build(techStack, 'js-app');

      // Should not have TypeScript dependencies
      expect(result.devDependencies).not.toHaveProperty('typescript');
      expect(result.devDependencies).not.toHaveProperty('@types/react');

      // Should not have TypeScript-specific files
      expect(result.files).not.toHaveProperty('tsconfig.json');
      expect(result.files).not.toHaveProperty('typings.d.ts');
    });
  });
});