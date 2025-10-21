import { PluginIntegrator, PluginIntegrationResult } from '../../../core/plugins/PluginIntegrator';
import { PluginManager } from '../../../core/plugins/PluginManager';
import type { GenerateScaffoldParams } from '../../../types/index';

// Mock PluginManager
jest.mock('../../../core/plugins/PluginManager');

describe('PluginIntegrator', () => {
  let pluginIntegrator: PluginIntegrator;
  let mockPluginManager: jest.Mocked<PluginManager>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    // Create mock instance
    mockPluginManager = {
      addPluginPath: jest.fn(),
      discoverPlugins: jest.fn(),
      getActivePlugins: jest.fn(),
      activatePlugins: jest.fn(),
      getMergedConfig: jest.fn(),
    } as any;

    // Mock the constructor
    (PluginManager as jest.MockedClass<typeof PluginManager>).mockImplementation(() => mockPluginManager);
    
    pluginIntegrator = new PluginIntegrator();
  });

  describe('initialize method', () => {
    it('should add default search paths and load plugins', async () => {
      mockPluginManager.discoverPlugins.mockResolvedValue();

      await pluginIntegrator.initialize();

      expect(mockPluginManager.addPluginPath).toHaveBeenCalled();
      expect(mockPluginManager.discoverPlugins).toHaveBeenCalledTimes(1);
    });

    it('should handle plugin loading errors gracefully', async () => {
      const error = new Error('Plugin loading failed');
      mockPluginManager.discoverPlugins.mockRejectedValue(error);

      // Should not throw
      await expect(pluginIntegrator.initialize()).resolves.not.toThrow();
    });
  });

  describe('integratePlugins method', () => {
    const mockParams: GenerateScaffoldParams = {
      tech_stack: ['{"framework":"vue3","language":"typescript"}'],
      project_name: 'test-project',
      output_dir: '.',
      options: {}
    };

    beforeEach(async () => {
      mockPluginManager.discoverPlugins.mockResolvedValue();
      await pluginIntegrator.initialize();
    });

    it('should build plugin context correctly', async () => {
      mockPluginManager.activatePlugins.mockResolvedValue({
        success: true,
        activePlugins: [],
        errors: [],
        warnings: []
      });
      mockPluginManager.getMergedConfig.mockResolvedValue({
        dependencies: {},
        scripts: {},
        files: []
      });

      const result = await pluginIntegrator.integratePlugins(mockParams);

      expect(mockPluginManager.activatePlugins).toHaveBeenCalledWith({
        techStack: { framework: 'vue3', language: 'typescript' },
        projectName: 'test-project',
        outputDir: '.',
        options: {}
      });
    });

    it('should handle successful plugin integration', async () => {
      mockPluginManager.activatePlugins.mockResolvedValue({
        success: true,
        activePlugins: ['vue3-plugin'],
        errors: [],
        warnings: []
      });
      mockPluginManager.getMergedConfig.mockResolvedValue({
        dependencies: {
          'vue-dep': { name: 'vue', version: '^3.0.0', type: 'dependencies' as const }
        },
        scripts: {
          'dev-script': { name: 'dev', command: 'vite dev' }
        },
        files: [
          { path: 'src/main.ts', content: 'console.log("Vue3");' }
        ]
      });

      const result = await pluginIntegrator.integratePlugins(mockParams);

      expect(result.success).toBe(true);
      expect(result.activePlugins).toEqual(['vue3-plugin']);
      expect(result.mergedConfig).toBeDefined();
      expect(result.mergedConfig?.dependencies).toHaveProperty('vue-dep');
      expect(result.mergedConfig?.scripts).toHaveProperty('dev-script');
      expect(result.mergedConfig?.files).toHaveLength(1);
    });

    it('should handle plugin activation errors', async () => {
      const error = new Error('Plugin activation failed');
      mockPluginManager.activatePlugins.mockRejectedValue(error);

      const result = await pluginIntegrator.integratePlugins(mockParams);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('插件集成失败: Plugin activation failed');
      expect(result.mergedConfig).toBeNull();
    });

    it('should handle activation failure with errors', async () => {
      mockPluginManager.activatePlugins.mockResolvedValue({
        success: false,
        activePlugins: [],
        errors: ['Plugin not found'],
        warnings: ['Plugin deprecated']
      });
      mockPluginManager.getMergedConfig.mockResolvedValue({
        dependencies: {},
        scripts: {},
        files: []
      });

      const result = await pluginIntegrator.integratePlugins(mockParams);

      expect(result.success).toBe(false);
      expect(result.errors).toContain('Plugin not found');
      expect(result.warnings).toContain('Plugin deprecated');
    });

    it('should handle empty plugin list', async () => {
      mockPluginManager.activatePlugins.mockResolvedValue({
        success: true,
        activePlugins: [],
        errors: [],
        warnings: []
      });
      mockPluginManager.getMergedConfig.mockResolvedValue({
        dependencies: {},
        scripts: {},
        files: []
      });

      const result = await pluginIntegrator.integratePlugins(mockParams);

      expect(result.success).toBe(true);
      expect(result.activePlugins).toEqual([]);
      expect(result.mergedConfig).toBeDefined();
      expect(result.mergedConfig?.dependencies).toEqual({});
      expect(result.mergedConfig?.scripts).toEqual({});
      expect(result.mergedConfig?.files).toEqual([]);
    });
  });

  describe('buildPluginContext method', () => {
    it('should parse tech stack correctly', async () => {
      mockPluginManager.discoverPlugins.mockResolvedValue();
      await pluginIntegrator.initialize();

      const params: GenerateScaffoldParams = {
        tech_stack: ['{"framework":"react","language":"javascript","packageManager":"yarn"}'],
        project_name: 'react-app',
        output_dir: '/path/to/output',
        options: { force: true }
      };

      mockPluginManager.activatePlugins.mockResolvedValue({
        success: true,
        activePlugins: [],
        errors: [],
        warnings: []
      });
      mockPluginManager.getMergedConfig.mockResolvedValue({
        dependencies: {},
        scripts: {},
        files: []
      });

      await pluginIntegrator.integratePlugins(params);

      expect(mockPluginManager.activatePlugins).toHaveBeenCalledWith({
        techStack: {
          framework: 'react',
          language: 'javascript',
          packageManager: 'yarn'
        },
        projectName: 'react-app',
        outputDir: '/path/to/output',
        options: { force: true }
      });
    });
  });
});