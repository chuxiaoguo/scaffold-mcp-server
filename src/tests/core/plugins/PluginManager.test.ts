import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import { PluginManager } from '../../../core/plugins/PluginManager';
import { PluginConfig, PluginContext } from '../../../core/plugins/types';
import * as fs from 'fs';
import * as path from 'path';

// Mock fs module
vi.mock('fs');
const mockFs = fs as any;

describe('PluginManager', () => {
  let pluginManager: PluginManager;
  let mockContext: PluginContext;

  beforeEach(() => {
    vi.clearAllMocks();
    pluginManager = new PluginManager();
    
    mockContext = {
      techStack: {
        language: ['typescript'],
        framework: ['vue3'],
        builder: ['vite'],
        features: ['pwa']
      },
      projectName: 'test-project',
      outputDir: '/test/output',
      extraTools: ['eslint', 'prettier'],
      userConfig: {},
      activePlugins: [],
      hasFile: vi.fn().mockReturnValue(false)
    };
  });

  describe('Plugin Discovery', () => {
    it('should discover plugins from added paths', async () => {
      const pluginPath = '/test/plugins';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['plugin1.json', 'plugin2.json']);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
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
      }));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      const plugins = pluginManager.getAvailablePlugins();
      expect(plugins).toHaveLength(2);
    });

    it('should handle non-existent plugin paths gracefully', async () => {
      const pluginPath = '/non/existent/path';
      
      mockFs.existsSync.mockReturnValue(false);

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      const plugins = pluginManager.getAvailablePlugins();
      expect(plugins).toHaveLength(0);
    });

    it('should skip invalid plugin files', async () => {
      const pluginPath = '/test/plugins';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['valid.json', 'invalid.json']);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify({
          metadata: {
            name: 'valid-plugin',
            version: '1.0.0',
            description: 'Valid plugin',
            category: 'utility'
          },
          activation: {}
        }))
        .mockReturnValueOnce('invalid json');

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      const plugins = pluginManager.getAvailablePlugins();
      expect(plugins).toHaveLength(1);
      expect(plugins[0].metadata.name).toBe('valid-plugin');
    });
  });

  describe('Plugin Activation', () => {
    beforeEach(async () => {
      const pluginPath = '/test/plugins';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['vue-plugin.json', 'react-plugin.json']);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify({
          metadata: {
            name: 'vue-plugin',
            version: '1.0.0',
            description: 'Vue plugin',
            category: 'framework'
          },
          activation: {
            techStack: {
              framework: ['vue3']
            }
          }
        }))
        .mockReturnValueOnce(JSON.stringify({
          metadata: {
            name: 'react-plugin',
            version: '1.0.0',
            description: 'React plugin',
            category: 'framework'
          },
          activation: {
            techStack: {
              framework: ['react']
            }
          }
        }));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();
    });

    it('should activate plugins matching tech stack', async () => {
      const result = await pluginManager.activatePlugins(mockContext);

      expect(result.success).toBe(true);
      expect(result.activePlugins).toContain('vue-plugin');
      expect(result.activePlugins).not.toContain('react-plugin');
    });

    it('should return active plugins list', async () => {
      await pluginManager.activatePlugins(mockContext);
      
      const activePlugins = pluginManager.getActivePlugins();
      expect(activePlugins).toContain('vue-plugin');
    });
  });

  describe('Configuration Merging', () => {
    beforeEach(async () => {
      const pluginPath = '/test/plugins';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['plugin1.json', 'plugin2.json']);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify({
          metadata: {
            name: 'plugin1',
            version: '1.0.0',
            description: 'Plugin 1',
            category: 'utility'
          },
          activation: {
            techStack: {
              framework: ['vue3']
            }
          },
          dependencies: [{
            name: 'vue',
            version: '^3.0.0',
            type: 'dependencies'
          }],
          scripts: [{
            name: 'dev',
            command: 'vite',
            description: 'Start dev server'
          }]
        }))
        .mockReturnValueOnce(JSON.stringify({
          metadata: {
            name: 'plugin2',
            version: '1.0.0',
            description: 'Plugin 2',
            category: 'utility'
          },
          activation: {
            techStack: {
              framework: ['vue3']
            }
          },
          dependencies: [{
            name: 'vite',
            version: '^4.0.0',
            type: 'devDependencies'
          }],
          scripts: [{
            name: 'build',
            command: 'vite build',
            description: 'Build for production'
          }]
        }));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();
    });

    it('should merge configurations from active plugins', async () => {
      await pluginManager.activatePlugins(mockContext);
      const mergedConfig = await pluginManager.getMergedConfig(mockContext);

      expect(mergedConfig.dependencies).toHaveLength(2);
      expect(mergedConfig.scripts).toHaveLength(2);
      
      const depNames = mergedConfig.dependencies?.map(d => d.name) || [];
      expect(depNames).toContain('vue');
      expect(depNames).toContain('vite');
      
      const scriptNames = mergedConfig.scripts?.map(s => s.name) || [];
      expect(scriptNames).toContain('dev');
      expect(scriptNames).toContain('build');
    });

    it('should handle empty plugin configurations', async () => {
      // Clear existing plugins and add empty one
      await pluginManager.discoverPlugins();
      
      const mergedConfig = await pluginManager.getMergedConfig(mockContext);
      
      expect(mergedConfig.dependencies || []).toHaveLength(0);
      expect(mergedConfig.scripts || []).toHaveLength(0);
      expect(mergedConfig.files || []).toHaveLength(0);
    });
  });

  describe('Plugin Management', () => {
    it('should get plugin by name', async () => {
      const pluginPath = '/test/plugins';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['test-plugin.json']);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        metadata: {
          name: 'test-plugin',
          version: '1.0.0',
          description: 'Test plugin',
          category: 'utility'
        },
        activation: {}
      }));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();

      const plugin = pluginManager.getPlugin('test-plugin');
      expect(plugin).toBeDefined();
      expect(plugin?.metadata.name).toBe('test-plugin');
    });

    it('should return undefined for non-existent plugin', () => {
      const plugin = pluginManager.getPlugin('non-existent');
      expect(plugin).toBeUndefined();
    });

    it('should provide plugin statistics', async () => {
      const pluginPath = '/test/plugins';
      
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readdirSync.mockReturnValue(['plugin1.json', 'plugin2.json']);
      mockFs.readFileSync
        .mockReturnValueOnce(JSON.stringify({
          metadata: {
            name: 'plugin1',
            version: '1.0.0',
            description: 'Plugin 1',
            category: 'utility'
          },
          activation: {
            techStack: {
              framework: ['vue3']
            }
          }
        }))
        .mockReturnValueOnce(JSON.stringify({
          metadata: {
            name: 'plugin2',
            version: '1.0.0',
            description: 'Plugin 2',
            category: 'framework'
          },
          activation: {
            techStack: {
              framework: ['react']
            }
          }
        }));

      pluginManager.addPluginPath(pluginPath);
      await pluginManager.discoverPlugins();
      await pluginManager.activatePlugins(mockContext);

      const stats = pluginManager.getStats();
      expect(stats.total).toBe(2);
      expect(stats.active).toBe(1); // Only vue plugin should be active
      expect(stats.byCategory.utility).toBe(1);
      expect(stats.byCategory.framework).toBe(1);
    });
  });
});