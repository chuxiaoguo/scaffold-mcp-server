import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ActivationEngine } from '../../../core/plugins/ActivationEngine';
import { PluginConfig, PluginContext } from '../../../core/plugins/types';

describe('ActivationEngine', () => {
  let activationEngine: ActivationEngine;
  let mockContext: PluginContext;

  beforeEach(() => {
    activationEngine = new ActivationEngine();
    
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

  describe('shouldActivate', () => {
    it('should activate plugin when tech stack matches', () => {
      const plugin: PluginConfig = {
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
      };

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(true);
    });

    it('should not activate plugin when tech stack does not match', () => {
      const plugin: PluginConfig = {
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
      };

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(false);
    });

    it('should activate plugin when file exists condition is met', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'file-plugin',
          version: '1.0.0',
          description: 'File-based plugin',
          category: 'utility'
        },
        activation: {
          files: {
            exists: ['package.json']
          }
        }
      };

      mockContext.hasFile = vi.fn().mockReturnValue(true);

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(true);
    });

    it('should not activate plugin when file does not exist', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'file-plugin',
          version: '1.0.0',
          description: 'File-based plugin',
          category: 'utility'
        },
        activation: {
          files: {
            exists: ['missing-file.json']
          }
        }
      };

      mockContext.hasFile = vi.fn().mockReturnValue(false);

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(false);
    });

    it('should activate plugin when required plugins are active', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'dependent-plugin',
          version: '1.0.0',
          description: 'Dependent plugin',
          category: 'utility'
        },
        activation: {
          plugins: {
            requires: ['base-plugin']
          }
        }
      };

      mockContext.activePlugins = ['base-plugin'];

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(true);
    });

    it('should not activate plugin when required plugins are not active', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'dependent-plugin',
          version: '1.0.0',
          description: 'Dependent plugin',
          category: 'utility'
        },
        activation: {
          plugins: {
            requires: ['missing-plugin']
          }
        }
      };

      mockContext.activePlugins = [];

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(false);
    });

    it('should not activate plugin when conflicting plugins are active', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'conflicting-plugin',
          version: '1.0.0',
          description: 'Conflicting plugin',
          category: 'utility'
        },
        activation: {
          plugins: {
            conflicts: ['incompatible-plugin']
          }
        }
      };

      mockContext.activePlugins = ['incompatible-plugin'];

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(false);
    });

    it('should handle multiple activation conditions with AND logic', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'complex-plugin',
          version: '1.0.0',
          description: 'Complex plugin',
          category: 'utility'
        },
        activation: {
          techStack: {
            framework: ['vue3'],
            language: ['typescript']
          },
          files: {
            exists: ['tsconfig.json']
          }
        }
      };

      mockContext.hasFile = vi.fn().mockImplementation((path: string) => {
        return path === 'tsconfig.json';
      });

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(true);
    });

    it('should fail when any activation condition is not met', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'complex-plugin',
          version: '1.0.0',
          description: 'Complex plugin',
          category: 'utility'
        },
        activation: {
          techStack: {
            framework: ['vue3'],
            language: ['typescript']
          },
          files: {
            exists: ['missing-file.json']
          }
        }
      };

      mockContext.hasFile = vi.fn().mockReturnValue(false);

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(false);
    });

    it('should handle empty activation conditions', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'always-active-plugin',
          version: '1.0.0',
          description: 'Always active plugin',
          category: 'utility'
        },
        activation: {}
      };

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(true);
    });

    it('should handle array matching for tech stack', () => {
      const plugin: PluginConfig = {
        metadata: {
          name: 'multi-framework-plugin',
          version: '1.0.0',
          description: 'Multi-framework plugin',
          category: 'utility'
        },
        activation: {
          techStack: {
            framework: ['vue3', 'react', 'angular']
          }
        }
      };

      const result = activationEngine.shouldActivate(plugin, mockContext);
      expect(result).toBe(true);
    });
  });

  describe('getConditionDescription', () => {
    it('should generate description for tech stack conditions', () => {
      const condition = {
        techStack: {
          framework: ['vue3'],
          language: ['typescript']
        }
      };

      const description = activationEngine.getConditionDescription(condition);
      expect(description).toContain('vue3');
      expect(description).toContain('typescript');
    });

    it('should generate description for file conditions', () => {
      const condition = {
        files: {
          exists: ['package.json', 'tsconfig.json']
        }
      };

      const description = activationEngine.getConditionDescription(condition);
      expect(description).toContain('package.json');
      expect(description).toContain('tsconfig.json');
    });

    it('should generate description for plugin conditions', () => {
      const condition = {
        plugins: {
          requires: ['base-plugin'],
          conflicts: ['incompatible-plugin']
        }
      };

      const description = activationEngine.getConditionDescription(condition);
      expect(description).toContain('base-plugin');
      expect(description).toContain('incompatible-plugin');
    });

    it('should handle empty conditions', () => {
      const condition = {};

      const description = activationEngine.getConditionDescription(condition);
      expect(description).toBe('Always active');
    });
  });
});