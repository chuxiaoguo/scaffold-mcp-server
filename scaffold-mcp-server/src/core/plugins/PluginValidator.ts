import type { PluginConfig, PluginValidationResult } from './types';

export class PluginValidator {
  /**
   * 验证插件配置
   */
  static validate(config: PluginConfig): PluginValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // 验证元数据
    this.validateMetadata(config, errors);
    
    // 验证激活条件
    this.validateActivation(config, warnings);
    
    // 验证依赖
    this.validateDependencies(config, errors);
    
    // 验证脚本
    this.validateScripts(config, warnings);
    
    // 验证文件模板
    this.validateFiles(config, errors);

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateMetadata(config: PluginConfig, errors: string[]): void {
    const { metadata } = config;
    
    if (!metadata.name || typeof metadata.name !== 'string') {
      errors.push('Plugin name is required and must be a string');
    }
    
    if (!metadata.version || typeof metadata.version !== 'string') {
      errors.push('Plugin version is required and must be a string');
    }
    
    if (!this.isValidSemver(metadata.version)) {
      errors.push('Plugin version must be a valid semantic version');
    }
    
    if (!metadata.description || typeof metadata.description !== 'string') {
      errors.push('Plugin description is required and must be a string');
    }
    
    if (metadata.category && !this.isValidCategory(metadata.category)) {
      errors.push('Plugin category must be one of: linter, formatter, builder, framework, testing, utility');
    }
  }

  private static validateActivation(config: PluginConfig, warnings: string[]): void {
    const { activation } = config;
    
    if (!activation) {
      warnings.push('No activation conditions specified - plugin will always be active');
      return;
    }
    
    // 检查是否有至少一个激活条件
    const hasCondition = activation.techStack || 
                        activation.fileExists || 
                        activation.dependencies || 
                        activation.custom;
    
    if (!hasCondition) {
      warnings.push('No specific activation conditions found - plugin may be unnecessarily active');
    }
  }

  private static validateDependencies(config: PluginConfig, errors: string[]): void {
    const { dependencies } = config;
    
    if (!dependencies || !Array.isArray(dependencies)) {
      return;
    }
    
    dependencies.forEach((dep, index) => {
      if (!dep.name || typeof dep.name !== 'string') {
        errors.push(`Dependency ${index}: name is required and must be a string`);
      }
      
      if (!dep.version || typeof dep.version !== 'string') {
        errors.push(`Dependency ${index}: version is required and must be a string`);
      }
      
      if (dep.type && !['dependencies', 'devDependencies', 'peerDependencies'].includes(dep.type)) {
        errors.push(`Dependency ${index}: type must be one of dependencies, devDependencies, peerDependencies`);
      }
    });
  }

  private static validateScripts(config: PluginConfig, warnings: string[]): void {
    const { scripts } = config;
    
    if (!scripts || !Array.isArray(scripts)) {
      return;
    }
    
    const scriptNames = new Set<string>();
    
    scripts.forEach((script, index) => {
      if (!script.name || typeof script.name !== 'string') {
        warnings.push(`Script ${index}: name should be a string`);
      }
      
      if (scriptNames.has(script.name)) {
        warnings.push(`Duplicate script name: ${script.name}`);
      }
      scriptNames.add(script.name);
      
      if (!script.command || typeof script.command !== 'string') {
        warnings.push(`Script ${index}: command should be a string`);
      }
    });
  }

  private static validateFiles(config: PluginConfig, errors: string[]): void {
    const { files } = config;
    
    if (!files || !Array.isArray(files)) {
      return;
    }
    
    const filePaths = new Set<string>();
    
    files.forEach((file, index) => {
      if (!file.path || typeof file.path !== 'string') {
        errors.push(`File ${index}: path is required and must be a string`);
      }
      
      if (filePaths.has(file.path)) {
        errors.push(`Duplicate file path: ${file.path}`);
      }
      filePaths.add(file.path);
      
      if (file.mergeStrategy && !['replace', 'merge', 'append'].includes(file.mergeStrategy)) {
        errors.push(`File ${index}: mergeStrategy must be one of replace, merge, append`);
      }
    });
  }

  private static isValidSemver(version: string): boolean {
    const semverRegex = /^(\d+)\.(\d+)\.(\d+)(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?$/;
    return semverRegex.test(version);
  }

  private static isValidCategory(category: string): boolean {
    const validCategories = ['linter', 'formatter', 'builder', 'framework', 'testing', 'utility'];
    return validCategories.includes(category);
  }
}