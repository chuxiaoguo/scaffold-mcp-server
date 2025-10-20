import * as semver from 'semver';
import type { 
  PluginConfig, 
  PluginContext, 
  MergedConfig, 
  ConflictResolution,
  PluginDependency,
  PluginScript,
  FileTemplate,
  PluginIntegration
} from './types';

/**
 * 配置合并器 - 负责合并多个插件的配置并处理冲突
 */
export class ConfigMerger {
  /**
   * 合并多个插件的配置
   */
  async merge(plugins: PluginConfig[], context: PluginContext): Promise<MergedConfig> {
    const mergedConfig: MergedConfig = {
      dependencies: {},
      scripts: {},
      files: [],
      integration: {},
      defaultConfig: {}
    };

    const conflicts: ConflictResolution[] = [];

    // 合并依赖
    await this.mergeDependencies(plugins, mergedConfig, conflicts, context);

    // 合并脚本
    await this.mergeScripts(plugins, mergedConfig, conflicts, context);

    // 合并文件模板
    await this.mergeFiles(plugins, mergedConfig, conflicts, context);

    // 合并集成配置
    await this.mergeIntegrations(plugins, mergedConfig, conflicts, context);

    // 合并默认配置
    await this.mergeDefaultConfigs(plugins, mergedConfig, conflicts, context);

    // 处理冲突
    await this.resolveConflicts(conflicts, mergedConfig, context);

    return mergedConfig;
  }

  /**
   * 合并依赖配置
   */
  private async mergeDependencies(
    plugins: PluginConfig[],
    mergedConfig: MergedConfig,
    conflicts: ConflictResolution[],
    context: PluginContext
  ): Promise<void> {
    if (!mergedConfig.dependencies) {
      mergedConfig.dependencies = {};
    }

    for (const plugin of plugins) {
      if (!plugin.dependencies) continue;

      for (const dep of plugin.dependencies) {
        if (!this.shouldIncludeDependency(dep, context)) continue;

        const existingDep = mergedConfig.dependencies![dep.name];
        if (existingDep) {
          // 处理版本冲突
          const resolvedVersion = this.resolveVersionConflict(
            existingDep.version,
            dep.version
          );

          if (resolvedVersion) {
            mergedConfig.dependencies![dep.name] = {
              ...dep,
              version: resolvedVersion
            };
          } else {
            conflicts.push({
              type: 'dependency',
              conflictingPlugins: [plugin.metadata.name],
              resolution: 'error',
              details: {
                dependency: dep.name,
                versions: [existingDep.version, dep.version]
              }
            });
          }
        } else {
          mergedConfig.dependencies![dep.name] = dep;
        }
      }
    }
  }

  /**
   * 合并脚本配置
   */
  private async mergeScripts(
    plugins: PluginConfig[],
    mergedConfig: MergedConfig,
    conflicts: ConflictResolution[],
    context: PluginContext
  ): Promise<void> {
    if (!mergedConfig.scripts) {
      mergedConfig.scripts = {};
    }

    for (const plugin of plugins) {
      if (!plugin.scripts) continue;

      for (const script of plugin.scripts) {
        if (!this.shouldIncludeScript(script, context)) continue;

        const existingScript = mergedConfig.scripts![script.name];
        if (existingScript) {
          // 处理脚本名冲突
          const newScriptName = this.resolveScriptNameConflict(
            script.name,
            plugin.metadata.name
          );
          mergedConfig.scripts![newScriptName] = script;

          conflicts.push({
            type: 'script',
            conflictingPlugins: [plugin.metadata.name],
            resolution: 'merge',
            details: {
              originalName: script.name,
              newName: newScriptName
            }
          });
        } else {
          mergedConfig.scripts![script.name] = script;
        }
      }
    }
  }

  /**
   * 合并文件模板
   */
  private async mergeFiles(
    plugins: PluginConfig[],
    mergedConfig: MergedConfig,
    conflicts: ConflictResolution[],
    context: PluginContext
  ): Promise<void> {
    if (!mergedConfig.files) {
      mergedConfig.files = [];
    }

    const fileGroups: Record<string, FileTemplate[]> = {};

    for (const plugin of plugins) {
      if (!plugin.files) continue;

      for (const file of plugin.files) {
        if (!this.shouldIncludeFile(file, context)) continue;

        if (!fileGroups[file.path]) {
          fileGroups[file.path] = [];
        }
        fileGroups[file.path]!.push(file);
      }
    }

    // 合并同路径的文件模板
    for (const [filePath, templates] of Object.entries(fileGroups)) {
      if (templates.length === 1) {
        const template = templates[0];
        if (template) {
          mergedConfig.files!.push(template);
        }
      } else {
        // 多个模板需要合并
        const mergedTemplate = await this.mergeFileTemplates(templates, context);
        mergedConfig.files!.push(mergedTemplate);

        conflicts.push({
          type: 'file',
          conflictingPlugins: templates.map(t => t.path),
          resolution: 'merge',
          details: {
            filePath,
            templateCount: templates.length
          }
        });
      }
    }
  }

  /**
   * 合并集成配置
   */
  private async mergeIntegrations(
    plugins: PluginConfig[],
    mergedConfig: MergedConfig,
    conflicts: ConflictResolution[],
    context: PluginContext
  ): Promise<void> {
    if (!mergedConfig.integration) {
      mergedConfig.integration = {};
    }

    for (const plugin of plugins) {
      if (!plugin.integration) continue;

      for (const [key, value] of Object.entries(plugin.integration)) {
        if (mergedConfig.integration![key]) {
          mergedConfig.integration![key] = this.deepMerge(
            mergedConfig.integration![key],
            value
          );
        } else {
          mergedConfig.integration![key] = value;
        }
      }
    }
  }

  /**
   * 合并默认配置
   */
  private async mergeDefaultConfigs(
    plugins: PluginConfig[],
    mergedConfig: MergedConfig,
    conflicts: ConflictResolution[],
    context: PluginContext
  ): Promise<void> {
    if (!mergedConfig.defaultConfig) {
      mergedConfig.defaultConfig = {};
    }

    for (const plugin of plugins) {
      if (!plugin.defaultConfig) continue;

      for (const [key, value] of Object.entries(plugin.defaultConfig)) {
        if (mergedConfig.defaultConfig![key]) {
          mergedConfig.defaultConfig![key] = this.deepMerge(
            mergedConfig.defaultConfig![key],
            value
          );
        } else {
          mergedConfig.defaultConfig![key] = value;
        }
      }
    }
  }

  /**
   * 解决版本冲突
   */
  private resolveVersionConflict(version1: string, version2: string): string | null {
    try {
      // 尝试找到兼容的版本范围
      const range1 = semver.validRange(version1);
      const range2 = semver.validRange(version2);

      if (!range1 || !range2) {
        return null;
      }

      // 如果两个版本范围有交集，使用更严格的版本
      if (semver.intersects(range1, range2)) {
        return semver.gt(version1, version2) ? version1 : version2;
      }

      return null;
    } catch (error) {
      console.error('Version conflict resolution failed:', error);
      return null;
    }
  }

  /**
   * 解决脚本名称冲突
   */
  private resolveScriptNameConflict(scriptName: string, pluginName: string): string {
    return `${pluginName}:${scriptName}`;
  }

  /**
   * 合并文件模板
   */
  private async mergeFileTemplates(
    templates: FileTemplate[],
    context: PluginContext
  ): Promise<FileTemplate> {
    // 按优先级排序（如果有的话）
    const sortedTemplates = templates.sort((a, b) => {
      const priorityA = (a as any).priority || 0;
      const priorityB = (b as any).priority || 0;
      return priorityB - priorityA;
    });

    // 以第一个模板为基础
    const baseTemplate = sortedTemplates[0];
    if (!baseTemplate) {
      throw new Error('No templates to merge');
    }

    let mergedContent = baseTemplate.content || '';
    const mergedVariables = this.mergeVariables(
      sortedTemplates.map(t => t.variables || {})
    );

    // 合并其他模板
    for (let i = 1; i < sortedTemplates.length; i++) {
      const template = sortedTemplates[i];
      if (!template) continue;

      const strategy = template.mergeStrategy || 'merge';
      const templateContent = template.content || '';

      switch (strategy) {
        case 'append':
          mergedContent += '\n' + templateContent;
          break;
        case 'prepend':
          mergedContent = templateContent + '\n' + mergedContent;
          break;
        case 'merge':
          mergedContent = this.smartMergeContent(mergedContent, templateContent);
          break;
        case 'replace':
          mergedContent = templateContent;
          break;
      }
    }

    return {
      ...baseTemplate,
      content: mergedContent,
      variables: mergedVariables
    };
  }

  /**
   * 智能内容合并
   */
  private smartMergeContent(content1: string, content2: string): string {
    try {
      // 尝试 JSON 合并
      const json1 = JSON.parse(content1);
      const json2 = JSON.parse(content2);
      return JSON.stringify(this.deepMerge(json1, json2), null, 2);
    } catch {
      // 如果不是 JSON，则简单拼接
      return content1 + '\n' + content2;
    }
  }

  /**
   * 合并变量
   */
  private mergeVariables(variablesList: Record<string, any>[]): Record<string, any> {
    return variablesList.reduce((merged, variables) => {
      return this.deepMerge(merged, variables);
    }, {});
  }

  /**
   * 深度合并对象
   */
  private deepMerge(target: any, source: any): any {
    if (source === null || source === undefined) {
      return target;
    }

    if (Array.isArray(source)) {
      return Array.isArray(target) ? [...target, ...source] : source;
    }

    if (typeof source === 'object') {
      const result = { ...target };
      for (const key in source) {
        if (source.hasOwnProperty(key)) {
          result[key] = this.deepMerge(result[key], source[key]);
        }
      }
      return result;
    }

    return source;
  }

  /**
   * 判断是否应该包含依赖
   */
  private shouldIncludeDependency(dep: PluginDependency, context: PluginContext): boolean {
    if (!dep.condition) return true;
    return this.evaluateCondition(dep.condition, context);
  }

  /**
   * 判断是否应该包含脚本
   */
  private shouldIncludeScript(script: PluginScript, context: PluginContext): boolean {
    if (!script.condition) return true;
    return this.evaluateCondition(script.condition, context);
  }

  /**
   * 判断是否应该包含文件
   */
  private shouldIncludeFile(file: FileTemplate, context: PluginContext): boolean {
    if (!file.condition) return true;
    return this.evaluateCondition(file.condition, context);
  }

  /**
   * 评估条件表达式
   */
  private evaluateCondition(condition: string, context: PluginContext): boolean {
    try {
      const func = new Function('context', `
        with (context) {
          return ${condition};
        }
      `);
      return Boolean(func(context));
    } catch (error) {
      console.error(`Condition evaluation failed: ${condition}`, error);
      return false;
    }
  }

  /**
   * 解决冲突
   */
  private async resolveConflicts(
    conflicts: ConflictResolution[],
    mergedConfig: MergedConfig,
    context: PluginContext
  ): Promise<void> {
    for (const conflict of conflicts) {
      if (conflict.resolution === 'error') {
        console.error(`Configuration conflict:`, conflict);
      } else {
        console.warn(`Configuration conflict resolved:`, conflict);
      }
    }
  }
}