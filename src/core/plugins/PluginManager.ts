import type { PluginConfig, PluginContext, PluginValidationResult, MergedConfig } from './types';
import { ActivationEngine } from './ActivationEngine.js';
import { ConfigMerger } from './ConfigMerger.js';
import { PluginValidator } from './PluginValidator.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 插件管理器 - 负责插件的发现、加载、激活和生命周期管理
 */
export class PluginManager {
  private plugins: Map<string, PluginConfig> = new Map();
  private activePlugins: Set<string> = new Set();
  private activationEngine: ActivationEngine;
  private configMerger: ConfigMerger;
  private pluginPaths: string[] = [];

  constructor() {
    this.activationEngine = new ActivationEngine();
    this.configMerger = new ConfigMerger();
  }

  /**
   * 添加插件搜索路径
   */
  addPluginPath(pluginPath: string): void {
    if (!this.pluginPaths.includes(pluginPath)) {
      this.pluginPaths.push(pluginPath);
    }
  }

  /**
   * 发现并加载所有插件
   */
  async discoverPlugins(): Promise<void> {
    this.plugins.clear();
    
    for (const pluginPath of this.pluginPaths) {
      await this.loadPluginsFromPath(pluginPath);
    }
  }

  /**
   * 从指定路径加载插件
   */
  private async loadPluginsFromPath(pluginPath: string): Promise<void> {
    if (!fs.existsSync(pluginPath)) {
      return;
    }

    const entries = fs.readdirSync(pluginPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile() && entry.name.endsWith('.json')) {
        const configPath = path.join(pluginPath, entry.name);
        await this.loadPlugin(configPath);
      } else if (entry.isDirectory()) {
        // 递归搜索子目录
        const subPath = path.join(pluginPath, entry.name);
        await this.loadPluginsFromPath(subPath);
      }
    }
  }

  /**
   * 加载单个插件配置
   */
  private async loadPlugin(configPath: string): Promise<void> {
    try {
      const configContent = fs.readFileSync(configPath, 'utf8');
      const config: PluginConfig = JSON.parse(configContent);
      
      // 验证插件配置
      const validation = PluginValidator.validate(config);
      if (!validation.isValid) {
        console.warn(`Plugin validation failed for ${configPath}:`, validation.errors);
        return;
      }

      this.plugins.set(config.metadata.name, config);
    } catch (error) {
      console.error(`Failed to load plugin from ${configPath}:`, error);
    }
  }

  /**
   * 获取所有可用插件
   */
  getAvailablePlugins(): PluginConfig[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取特定插件配置
   */
  getPlugin(name: string): PluginConfig | undefined {
    return this.plugins.get(name);
  }

  /**
   * 激活符合条件的插件
   */
  async activatePlugins(context: PluginContext): Promise<{
    success: boolean;
    activePlugins: string[];
    errors: string[];
    warnings: string[];
  }> {
    const activePlugins: string[] = [];
    const errors: string[] = [];
    const warnings: string[] = [];

    for (const [pluginName, plugin] of this.plugins.entries()) {
      try {
        const shouldActivate = await this.activationEngine.shouldActivate(plugin, context);
        
        if (shouldActivate) {
          activePlugins.push(pluginName);
          this.activePlugins.add(pluginName);
        }
      } catch (error) {
        errors.push(`激活插件 ${pluginName} 时出错: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    return {
      success: errors.length === 0,
      activePlugins,
      errors,
      warnings
    };
  }

  /**
   * 获取合并后的配置
   */
  async getMergedConfig(context: PluginContext): Promise<MergedConfig> {
    const activeConfigs: PluginConfig[] = [];
    
    for (const [pluginName, plugin] of this.plugins.entries()) {
      if (this.activePlugins.has(pluginName)) {
        activeConfigs.push(plugin);
      }
    }

    return this.configMerger.merge(activeConfigs, context);
  }

  /**
   * 激活单个插件
   */
  private async activatePlugin(pluginName: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    // 执行激活前钩子
    if (plugin.hooks?.beforeActivation) {
      await this.executeHook(plugin.hooks.beforeActivation, context);
    }

    this.activePlugins.add(pluginName);

    // 执行激活后钩子
    if (plugin.hooks?.afterActivation) {
      await this.executeHook(plugin.hooks.afterActivation, context);
    }
  }

  /**
   * 停用单个插件
   */
  async deactivatePlugin(pluginName: string, context: PluginContext): Promise<void> {
    const plugin = this.plugins.get(pluginName);
    if (!plugin) {
      throw new Error(`Plugin not found: ${pluginName}`);
    }

    // 执行停用前钩子
    if (plugin.hooks?.beforeDeactivation) {
      await this.executeHook(plugin.hooks.beforeDeactivation, context);
    }

    this.activePlugins.delete(pluginName);

    // 执行停用后钩子
    if (plugin.hooks?.afterDeactivation) {
      await this.executeHook(plugin.hooks.afterDeactivation, context);
    }
  }

  /**
   * 获取已激活的插件列表
   */
  getActivePlugins(): string[] {
    return Array.from(this.activePlugins);
  }

  /**
   * 合并配置（兼容旧接口）
   */
  async mergeConfigs(context: PluginContext): Promise<any> {
    const mergedConfig = await this.getMergedConfig(context);
    return {
      dependencies: mergedConfig.dependencies,
      scripts: mergedConfig.scripts,
      files: mergedConfig.files
    };
  }

  /**
   * 根据依赖关系排序插件
   */
  private sortPluginsByDependencies(): PluginConfig[] {
    const plugins = Array.from(this.plugins.values());
    const sorted: PluginConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (plugin: PluginConfig) => {
      if (visiting.has(plugin.metadata.name)) {
        throw new Error(`Circular dependency detected: ${plugin.metadata.name}`);
      }
      if (visited.has(plugin.metadata.name)) {
        return;
      }

      visiting.add(plugin.metadata.name);

      // 处理插件依赖
       if (plugin.activation.plugins?.requires) {
         for (const depName of plugin.activation.plugins.requires) {
           const depPlugin = this.plugins.get(depName);
           if (depPlugin) {
             visit(depPlugin);
           }
         }
       }

      visiting.delete(plugin.metadata.name);
      visited.add(plugin.metadata.name);
      sorted.push(plugin);
    };

    for (const plugin of plugins) {
      if (!visited.has(plugin.metadata.name)) {
        visit(plugin);
      }
    }

    return sorted;
  }

  /**
   * 执行插件钩子
   */
  private async executeHook(hook: string, context: PluginContext): Promise<void> {
    try {
      // 这里可以实现钩子的执行逻辑
      // 例如：执行脚本、调用函数等
      console.log(`Executing hook: ${hook}`);
    } catch (error) {
      console.error(`Hook execution failed: ${hook}`, error);
    }
  }

  /**
   * 重新加载所有插件
   */
  async reloadPlugins(): Promise<void> {
    this.plugins.clear();
    this.activePlugins.clear();
    await this.discoverPlugins();
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    total: number;
    active: number;
    byCategory: Record<string, number>;
  } {
    const byCategory: Record<string, number> = {};
    
    for (const plugin of this.plugins.values()) {
      const category = plugin.metadata.category || 'unknown';
      byCategory[category] = (byCategory[category] || 0) + 1;
    }

    return {
      total: this.plugins.size,
      active: this.activePlugins.size,
      byCategory
    };
  }
}