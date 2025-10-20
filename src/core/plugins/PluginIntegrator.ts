import type { 
  PluginConfig, 
  PluginContext, 
  MergedConfig,
  TechStack 
} from './types';
import { PluginManager } from './PluginManager';
import type { GenerateScaffoldParams } from '../../types/index';
import * as path from 'path';
import * as fs from 'fs/promises';

export interface PluginIntegrationResult {
  success: boolean;
  mergedConfig: MergedConfig | null;
  activePlugins: string[];
  errors: string[];
  warnings: string[];
}

/**
 * 插件集成器 - 负责将插件系统集成到现有的生成器中
 */
export class PluginIntegrator {
  private pluginManager: PluginManager;
  
  constructor(pluginManager?: PluginManager) {
    this.pluginManager = pluginManager || new PluginManager();
  }

  /**
   * 初始化插件系统
   */
  async initialize(): Promise<void> {
    // 添加默认插件搜索路径
    const defaultPluginPaths = [
      path.join(process.cwd(), 'configs/common/plugins'),
      path.join(__dirname, '../../../configs/common/plugins')
    ];

    for (const pluginPath of defaultPluginPaths) {
      try {
        await fs.access(pluginPath);
        this.pluginManager.addPluginPath(pluginPath);
      } catch {
        // 路径不存在，跳过
      }
    }

    // 发现并加载插件
    await this.pluginManager.discoverPlugins();
  }

  /**
   * 基于生成参数集成插件配置
   */
  async integratePlugins(params: GenerateScaffoldParams): Promise<PluginIntegrationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // 构建插件上下文
      const context = this.buildPluginContext(params);
      
      // 激活符合条件的插件
      const activationResult = await this.pluginManager.activatePlugins(context);
      
      if (!activationResult.success) {
        errors.push(...activationResult.errors);
        warnings.push(...activationResult.warnings);
      }

      // 合并激活插件的配置
      const mergedConfig = await this.pluginManager.getMergedConfig(context);
      
      return {
        success: errors.length === 0,
        mergedConfig,
        activePlugins: activationResult.activePlugins,
        errors,
        warnings
      };
    } catch (error) {
      errors.push(`插件集成失败: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        mergedConfig: null,
        activePlugins: [],
        errors,
        warnings
      };
    }
  }

  /**
   * 应用插件配置到项目生成过程
   */
  async applyPluginConfig(
    mergedConfig: MergedConfig,
    projectPath: string,
    projectName: string
  ): Promise<{
    success: boolean;
    appliedFiles: string[];
    appliedScripts: string[];
    appliedDependencies: string[];
    errors: string[];
  }> {
    const appliedFiles: string[] = [];
    const appliedScripts: string[] = [];
    const appliedDependencies: string[] = [];
    const errors: string[] = [];

    try {
      // 应用文件模板
      if (mergedConfig.files && mergedConfig.files.length > 0) {
        for (const fileTemplate of mergedConfig.files) {
          try {
            const filePath = path.join(projectPath, fileTemplate.path);
            const fileDir = path.dirname(filePath);
            
            // 确保目录存在
            await fs.mkdir(fileDir, { recursive: true });
            
            // 写入文件内容
            if (fileTemplate.content) {
              await fs.writeFile(filePath, fileTemplate.content, {
                encoding: fileTemplate.encoding || 'utf8'
              });
              appliedFiles.push(fileTemplate.path);
            }
          } catch (error) {
            errors.push(`应用文件模板失败 ${fileTemplate.path}: ${error instanceof Error ? error.message : String(error)}`);
          }
        }
      }

      // 应用依赖到 package.json
      if (mergedConfig.dependencies && Object.keys(mergedConfig.dependencies).length > 0) {
        try {
          await this.applyDependencies(projectPath, Object.values(mergedConfig.dependencies));
          appliedDependencies.push(...Object.values(mergedConfig.dependencies).map(dep => dep.name));
        } catch (error) {
          errors.push(`应用依赖失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      // 应用脚本到 package.json
      if (mergedConfig.scripts && Object.keys(mergedConfig.scripts).length > 0) {
        try {
          await this.applyScripts(projectPath, Object.values(mergedConfig.scripts));
          appliedScripts.push(...Object.values(mergedConfig.scripts).map(script => script.name));
        } catch (error) {
          errors.push(`应用脚本失败: ${error instanceof Error ? error.message : String(error)}`);
        }
      }

      return {
        success: errors.length === 0,
        appliedFiles,
        appliedScripts,
        appliedDependencies,
        errors
      };
    } catch (error) {
      errors.push(`应用插件配置失败: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        appliedFiles,
        appliedScripts,
        appliedDependencies,
        errors
      };
    }
  }

  /**
   * 获取插件统计信息
   */
  getPluginStats() {
    return this.pluginManager.getStats();
  }

  /**
   * 构建插件上下文
   */
  private buildPluginContext(params: GenerateScaffoldParams): PluginContext {
    // 解析技术栈
    const techStack = this.parseTechStack(params.tech_stack);
    
    return {
      techStack,
      projectName: params.project_name || 'my-project',
      outputDir: params.output_dir || '.',
      extraTools: params.extra_tools || [],
      userConfig: params.options || {},
      activePlugins: [], // 初始为空，会在激活过程中填充
      hasFile: (filePath: string) => {
        // 这里可以实现文件存在性检查
        // 暂时返回 false，实际使用时需要检查项目目录
        return false;
      }
    };
  }

  /**
   * 解析技术栈
   */
  private parseTechStack(techStack: string | string[]): TechStack {
    const stackArray = Array.isArray(techStack) ? techStack : [techStack];
    const stackStr = stackArray.join(' ').toLowerCase();

    return {
      language: this.extractLanguages(stackStr),
      framework: this.extractFrameworks(stackStr),
      builder: this.extractBuilders(stackStr),
      features: this.extractFeatures(stackStr)
    };
  }

  private extractLanguages(stackStr: string): string[] {
    const languages: string[] = [];
    if (stackStr.includes('typescript') || stackStr.includes('ts')) {
      languages.push('typescript');
    }
    if (stackStr.includes('javascript') || stackStr.includes('js')) {
      languages.push('javascript');
    }
    return languages;
  }

  private extractFrameworks(stackStr: string): string[] {
    const frameworks: string[] = [];
    if (stackStr.includes('react')) {
      frameworks.push('react');
    }
    if (stackStr.includes('vue3') || stackStr.includes('vue')) {
      frameworks.push('vue3');
    }
    return frameworks;
  }

  private extractBuilders(stackStr: string): string[] {
    const builders: string[] = [];
    if (stackStr.includes('vite')) {
      builders.push('vite');
    }
    if (stackStr.includes('webpack')) {
      builders.push('webpack');
    }
    if (stackStr.includes('electron-vite')) {
      builders.push('electron-vite');
    }
    if (stackStr.includes('umi')) {
      builders.push('umi');
    }
    return builders;
  }

  private extractFeatures(stackStr: string): string[] {
    const features: string[] = [];
    if (stackStr.includes('lint') || stackStr.includes('eslint')) {
      features.push('linting');
    }
    if (stackStr.includes('format') || stackStr.includes('prettier')) {
      features.push('formatting');
    }
    return features;
  }

  /**
   * 应用依赖到 package.json
   */
  private async applyDependencies(projectPath: string, dependencies: any[]): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // 初始化依赖对象
      if (!packageJson.dependencies) packageJson.dependencies = {};
      if (!packageJson.devDependencies) packageJson.devDependencies = {};
      if (!packageJson.peerDependencies) packageJson.peerDependencies = {};

      // 添加依赖
      for (const dep of dependencies) {
        const targetDeps = packageJson[dep.type || 'dependencies'];
        if (targetDeps) {
          targetDeps[dep.name] = dep.version;
        }
      }

      // 写回文件
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`更新 package.json 失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 应用脚本到 package.json
   */
  private async applyScripts(projectPath: string, scripts: any[]): Promise<void> {
    const packageJsonPath = path.join(projectPath, 'package.json');
    
    try {
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf8');
      const packageJson = JSON.parse(packageJsonContent);

      // 初始化脚本对象
      if (!packageJson.scripts) packageJson.scripts = {};

      // 添加脚本
      for (const script of scripts) {
        packageJson.scripts[script.name] = script.command;
      }

      // 写回文件
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2), 'utf8');
    } catch (error) {
      throw new Error(`更新 package.json 脚本失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}