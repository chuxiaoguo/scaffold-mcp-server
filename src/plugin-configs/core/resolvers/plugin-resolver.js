/**
 * Plugin Resolver
 * Handles plugin loading, validation, and activation logic
 */

const fs = require('fs');
const path = require('path');
const Ajv = require('ajv');
const addFormats = require('ajv-formats');

class PluginResolver {
  constructor(configPath) {
    this.configPath = configPath;
    this.ajv = new Ajv({ allErrors: true });
    addFormats(this.ajv);
    this.schema = null;
    this.loadSchema();
  }

  /**
   * Load plugin schema for validation
   */
  loadSchema() {
    try {
      const schemaPath = path.join(this.configPath, 'core/schema/plugin-schema.json');
      this.schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
      this.validate = this.ajv.compile(this.schema);
    } catch (error) {
      console.warn('Plugin schema not found, validation disabled');
    }
  }

  /**
   * Load plugin configuration from file
   * @param {string} pluginPath - Path to plugin configuration file
   * @returns {Object} Plugin configuration
   */
  loadPlugin(pluginPath) {
    try {
      const config = JSON.parse(fs.readFileSync(pluginPath, 'utf8'));
      
      if (this.validate && !this.validate(config)) {
        throw new Error(`Plugin validation failed: ${JSON.stringify(this.validate.errors)}`);
      }
      
      return config;
    } catch (error) {
      throw new Error(`Failed to load plugin ${pluginPath}: ${error.message}`);
    }
  }

  /**
   * Check if plugin should be activated based on tech stack
   * @param {Object} plugin - Plugin configuration
   * @param {Object} techStack - Current tech stack
   * @returns {boolean} Whether plugin should be activated
   */
  shouldActivate(plugin, techStack) {
    if (!plugin.activation) return false;

    const activation = plugin.activation;
    
    // Check framework activation
    if (activation.framework && techStack.framework) {
      if (!activation.framework.some(f => techStack.framework.includes(f))) {
        return false;
      }
    }

    // Check UI framework activation
    if (activation.ui && techStack.ui) {
      if (!activation.ui.some(ui => techStack.ui.includes(ui))) {
        return false;
      }
    }

    // Check state management activation
    if (activation.stateManagement && techStack.stateManagement) {
      if (!activation.stateManagement.some(sm => techStack.stateManagement.includes(sm))) {
        return false;
      }
    }

    // Check builder activation
    if (activation.builder && techStack.builder) {
      if (!activation.builder.some(b => techStack.builder.includes(b))) {
        return false;
      }
    }

    // Check tech stack activation (nested structure)
    if (activation.techStack) {
      const { framework, builder, language, stateManagement } = activation.techStack;
      
      if (framework && techStack.framework) {
        if (!framework.some(f => techStack.framework.includes(f))) {
          return false;
        }
      }
      
      if (builder && techStack.builder) {
        if (!builder.some(b => techStack.builder.includes(b))) {
          return false;
        }
      }
      
      if (language && techStack.language) {
        if (!language.some(l => techStack.language.includes(l))) {
          return false;
        }
      }
      
      if (stateManagement && techStack.stateManagement) {
        if (!stateManagement.some(sm => techStack.stateManagement.includes(sm))) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * Discover all plugins in a directory
   * @param {string} pluginsDir - Directory containing plugin configurations
   * @returns {Array} Array of plugin configurations
   */
  discoverPlugins(pluginsDir) {
    const plugins = [];
    
    const scanDirectory = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      
      for (const item of items) {
        const itemPath = path.join(dir, item);
        const stat = fs.statSync(itemPath);
        
        if (stat.isDirectory()) {
          scanDirectory(itemPath);
        } else if (item.endsWith('.json')) {
          try {
            const plugin = this.loadPlugin(itemPath);
            plugins.push({
              ...plugin,
              _path: itemPath,
              _name: path.basename(item, '.json')
            });
          } catch (error) {
            console.warn(`Failed to load plugin ${itemPath}: ${error.message}`);
          }
        }
      }
    };
    
    scanDirectory(pluginsDir);
    return plugins;
  }

  /**
   * Get active plugins for a given tech stack
   * @param {string} pluginsDir - Directory containing plugin configurations
   * @param {Object} techStack - Current tech stack
   * @returns {Array} Array of active plugin configurations
   */
  getActivePlugins(pluginsDir, techStack) {
    const allPlugins = this.discoverPlugins(pluginsDir);
    return allPlugins.filter(plugin => this.shouldActivate(plugin, techStack));
  }

  /**
   * Merge plugin configurations
   * @param {Array} plugins - Array of plugin configurations
   * @returns {Object} Merged configuration
   */
  mergePluginConfigs(plugins) {
    const merged = {
      dependencies: [],
      scripts: {},
      files: [],
      viteConfig: {},
      webpackConfig: {},
      tsConfig: {},
      defaultConfig: {}
    };

    for (const plugin of plugins) {
      // Merge dependencies
      if (plugin.dependencies) {
        merged.dependencies.push(...plugin.dependencies);
      }

      // Merge scripts
      if (plugin.scripts) {
        Object.assign(merged.scripts, plugin.scripts);
      }

      // Merge files
      if (plugin.files) {
        merged.files.push(...plugin.files);
      }

      // Merge configurations (deep merge)
      ['viteConfig', 'webpackConfig', 'tsConfig', 'defaultConfig'].forEach(configKey => {
        if (plugin[configKey]) {
          merged[configKey] = this.deepMerge(merged[configKey], plugin[configKey]);
        }
      });
    }

    return merged;
  }

  /**
   * Deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   */
  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }
}

module.exports = PluginResolver;