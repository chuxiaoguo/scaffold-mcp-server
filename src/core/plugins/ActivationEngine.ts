import * as fs from 'fs';
import * as path from 'path';
import type { PluginConfig, PluginContext, ActivationCondition } from './types';

/**
 * 激活引擎 - 负责判断插件是否应该被激活
 */
export class ActivationEngine {
  /**
   * 判断插件是否应该被激活
   */
  async shouldActivate(plugin: PluginConfig, context: PluginContext): Promise<boolean> {
    const condition = plugin.activation;
    
    // 检查技术栈条件
    if (condition.techStack && !this.checkTechStackCondition(condition.techStack, context)) {
      return false;
    }

    // 检查文件条件
    if (condition.files && !this.checkFileCondition(condition.files, context)) {
      return false;
    }

    // 检查插件依赖条件
    if (condition.plugins && !this.checkPluginCondition(condition.plugins, context)) {
      return false;
    }

    // 检查自定义条件
    if (condition.custom && !await this.checkCustomCondition(condition.custom, context)) {
      return false;
    }

    return true;
  }

  /**
   * 检查技术栈条件
   */
  private checkTechStackCondition(
    techStackCondition: NonNullable<ActivationCondition['techStack']>,
    context: PluginContext
  ): boolean {
    const { framework = [], builder = [], language = [], features = [] } = context.techStack;

    // 检查框架
    if (techStackCondition.framework && 
        !techStackCondition.framework.some(f => framework.includes(f))) {
      return false;
    }

    // 检查构建工具
    if (techStackCondition.builder && 
        !techStackCondition.builder.some(b => builder.includes(b))) {
      return false;
    }

    // 检查语言
    if (techStackCondition.language && 
        !techStackCondition.language.some(l => language.includes(l))) {
      return false;
    }

    // 检查特性
    if (techStackCondition.features && 
        !techStackCondition.features.some(feature => features.includes(feature))) {
      return false;
    }

    return true;
  }

  /**
   * 检查文件条件
   */
  private checkFileCondition(
    fileCondition: NonNullable<ActivationCondition['files']>,
    context: PluginContext
  ): boolean {
    // 检查必须存在的文件
    if (fileCondition.exists) {
      for (const filePath of fileCondition.exists) {
        if (!context.hasFile(filePath)) {
          return false;
        }
      }
    }

    // 检查不应存在的文件
    if (fileCondition.notExists) {
      for (const filePath of fileCondition.notExists) {
        if (context.hasFile(filePath)) {
          return false;
        }
      }
    }

    // 检查文件模式匹配
    if (fileCondition.patterns) {
      // 这里可以实现更复杂的模式匹配逻辑
      // 暂时简化处理
      return true;
    }

    return true;
  }

  /**
   * 检查插件依赖条件
   */
  private checkPluginCondition(
    pluginCondition: NonNullable<ActivationCondition['plugins']>,
    context: PluginContext
  ): boolean {
    const { activePlugins } = context;

    // 检查必需的插件
    if (pluginCondition.requires) {
      for (const requiredPlugin of pluginCondition.requires) {
        if (!activePlugins.includes(requiredPlugin)) {
          return false;
        }
      }
    }

    // 检查冲突的插件
    if (pluginCondition.conflicts) {
      for (const conflictPlugin of pluginCondition.conflicts) {
        if (activePlugins.includes(conflictPlugin)) {
          return false;
        }
      }
    }

    return true;
  }

  /**
   * 检查自定义条件
   */
  private async checkCustomCondition(
    customCondition: string,
    context: PluginContext
  ): Promise<boolean> {
    try {
      // 创建安全的执行上下文
      const executionContext = {
        techStack: context.techStack,
        activePlugins: context.activePlugins,
        userConfig: context.userConfig,
        projectName: context.projectName,
        outputDir: context.outputDir,
        extraTools: context.extraTools,
        // 提供一些实用函数
        hasFile: context.hasFile,
        hasPlugin: (pluginName: string) => context.activePlugins.includes(pluginName),
        getConfig: (key: string) => context.userConfig[key]
      };

      // 使用 Function 构造器创建安全的执行环境
      const func = new Function('context', `
        with (context) {
          return ${customCondition};
        }
      `);

      const result = func(executionContext);
      return Boolean(result);
    } catch (error) {
      console.warn(`自定义条件执行失败: ${customCondition}`, error);
      return false;
    }
  }

  /**
   * 获取激活条件的描述
   */
  getConditionDescription(condition: ActivationCondition): string {
    const descriptions: string[] = [];

    if (condition.techStack) {
      const techStack = condition.techStack;
      if (techStack.framework) {
        descriptions.push(`Framework: ${techStack.framework.join(', ')}`);
      }
      if (techStack.builder) {
        descriptions.push(`Builder: ${techStack.builder.join(', ')}`);
      }
      if (techStack.language) {
        descriptions.push(`Language: ${techStack.language.join(', ')}`);
      }
      if (techStack.features) {
        descriptions.push(`Features: ${techStack.features.join(', ')}`);
      }
    }

    if (condition.files) {
      const files = condition.files;
      if (files.exists) {
        descriptions.push(`Requires files: ${files.exists.join(', ')}`);
      }
      if (files.notExists) {
        descriptions.push(`Excludes files: ${files.notExists.join(', ')}`);
      }
      if (files.patterns) {
        descriptions.push(`File patterns: ${files.patterns.join(', ')}`);
      }
    }

    if (condition.plugins) {
      const plugins = condition.plugins;
      if (plugins.requires) {
        descriptions.push(`Requires plugins: ${plugins.requires.join(', ')}`);
      }
      if (plugins.conflicts) {
        descriptions.push(`Conflicts with: ${plugins.conflicts.join(', ')}`);
      }
    }

    if (condition.custom) {
      descriptions.push(`Custom condition: ${condition.custom}`);
    }

    return descriptions.join('; ');
  }
}