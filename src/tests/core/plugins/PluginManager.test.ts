import { PluginManager } from '../../../core/plugins/PluginManager';
import type { PluginConfig, PluginContext } from '../../../core/plugins/types';
import * as fs from 'fs';

// Mock fs module
jest.mock('fs');

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockFs: jest.Mocked<typeof fs>;

  beforeEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    
    mockFs = fs as jest.Mocked<typeof fs>;
    pluginManager = new PluginManager();
  });

  describe('addPluginPath method', () => {
    it('should add new plugin path', () => {
      const pluginPath = '/path/to/plugins';
      
      expect(() => pluginManager.addPluginPath(pluginPath)).not.toThrow();
    });

    it('should not add duplicate plugin paths', () => {
      const pluginPath = '/path/to/plugins';
      
      pluginManager.addPluginPath(pluginPath);
      pluginManager.addPluginPath(pluginPath);
      
      expect(() => pluginManager.addPluginPath(pluginPath)).not.toThrow();
    });
  });

  describe('discoverPlugins method', () => {
    it('should discover plugins from added paths', async () => {
      const pluginPath = '/path/to/plugins';
      const mockPlugin: PluginConfig = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          category: 'utility'
        },
        activation: {
          techStack: {
            framework: ['vue3']
          }
        }
      };

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test-plugin.json', isFile: () => true, isDirectory: () => false }
      ] as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPlugin));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      expect(mockFs.existsSync).toHaveBeenCalledWith(pluginPath);
    });

    it('should handle non-existent plugin paths gracefully', async () => {
      const pluginPath = '/non/existent/path';
      mockFs.existsSync.mockReturnValue(false);

      pluginManager.addPluginPath(pluginPath);
      
      await expect(pluginManager.discoverPlugins()).resolves.not.toThrow();
    });

    it('should handle invalid plugin files gracefully', async () => {
      const pluginPath = '/path/to/plugins';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'invalid.json', isFile: () => true, isDirectory: () => false }
      ] as any);
      mockFs.readFileSync.mockReturnValue('invalid json');

      pluginManager.addPluginPath(pluginPath);
      
      await expect(pluginManager.discoverPlugins()).resolves.not.toThrow();
    });
  });

  describe('getAvailablePlugins method', () => {
    it('should return empty array when no plugins loaded', () => {
      const plugins = pluginManager.getAvailablePlugins();
      
      expect(plugins).toEqual([]);
    });

    it('should return loaded plugins', async () => {
      const mockPlugin: PluginConfig = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          category: 'utility'
        },
        activation: {
          techStack: {
            framework: ['vue3']
          }
        }
      };

      const pluginPath = '/path/to/plugins';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test-plugin.json', isFile: () => true, isDirectory: () => false }
      ] as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPlugin));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      const plugins = pluginManager.getAvailablePlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].metadata.name).toBe('test-plugin');
    });
  });

  describe('getPlugin method', () => {
    it('should return undefined for non-existent plugin', () => {
      const plugin = pluginManager.getPlugin('non-existent');
      
      expect(plugin).toBeUndefined();
    });

    it('should return plugin by name', async () => {
      const mockPlugin: PluginConfig = {
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          category: 'utility'
        },
        activation: {
          techStack: {
            framework: ['vue3']
          }
        }
      };

      const pluginPath = '/path/to/plugins';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'test-plugin.json', isFile: () => true, isDirectory: () => false }
      ] as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPlugin));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      const plugin = pluginManager.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.metadata.name).toBe('test-plugin');
    });
  });

  describe('activatePlugins method', () => {
    const mockContext: PluginContext = {
      techStack: { framework: ['vue3'], language: ['typescript'] },
      projectName: 'test-project',
      outputDir: '.',
      extraTools: [],
      userConfig: {},
      activePlugins: [],
      hasFile: jest.fn().mockReturnValue(false)
    };

    it('should handle empty plugin list', async () => {
      const result = await pluginManager.activatePlugins(mockContext);

      expect(result.success).toBe(true);
      expect(result.activePlugins).toEqual([]);
      expect(result.errors).toEqual([]);
      expect(result.warnings).toEqual([]);
    });

    it('should handle plugin activation with loaded plugins', async () => {
      const mockPlugin: PluginConfig = {
        metadata: {
          name: 'vue3-plugin',
          version: '1.0.0',
          description: 'Vue3 plugin',
          category: 'framework'
        },
        activation: {
          techStack: {
            framework: ['vue3']
          }
        }
      };

      const pluginPath = '/path/to/plugins';
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue([
        { name: 'vue3-plugin.json', isFile: () => true, isDirectory: () => false }
      ] as any);
      mockFs.readFileSync.mockReturnValue(JSON.stringify(mockPlugin));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      const result = await pluginManager.activatePlugins(mockContext);

      expect(result.success).toBe(true);
      expect(result.errors).toEqual([]);
    });
  });

  describe('getMergedConfig method', () => {
    const mockContext: PluginContext = {
      techStack: { framework: ['vue3'], language: ['typescript'] },
      projectName: 'test-project',
      outputDir: '.',
      extraTools: [],
      userConfig: {},
      activePlugins: [],
      hasFile: jest.fn().mockReturnValue(false)
    };

    it('should return merged configuration', async () => {
      const result = await pluginManager.getMergedConfig(mockContext);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('dependencies');
      expect(result).toHaveProperty('scripts');
      expect(result).toHaveProperty('files');
    });
  });

  describe('getActivePlugins method', () => {
    it('should return empty array when no plugins are active', () => {
      const activePlugins = pluginManager.getActivePlugins();
      
      expect(activePlugins).toEqual([]);
    });
  });

  describe('reloadPlugins method', () => {
    it('should reload all plugins', async () => {
      await expect(pluginManager.reloadPlugins()).resolves.not.toThrow();
    });
  });

  describe('getStats method', () => {
    it('should return plugin statistics', () => {
      const stats = pluginManager.getStats();
      
      expect(stats).toHaveProperty('total');
      expect(stats).toHaveProperty('active');
      expect(stats).toHaveProperty('byCategory');
      expect(typeof stats.total).toBe('number');
      expect(typeof stats.active).toBe('number');
      expect(typeof stats.byCategory).toBe('object');
    });
  });
});