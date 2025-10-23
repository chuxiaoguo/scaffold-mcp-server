import { CoreInjector, InjectionContext, InjectionResult, InjectorType } from './interfaces.js';
import { TechStack } from '../../../types/index.js';

// 导入所有核心注入器
import { BaseInjector } from './base/BaseInjector.js';
import { Vue2FrameworkInjector } from './frameworks/Vue2FrameworkInjector.js';
import { Vue3FrameworkInjector } from './frameworks/Vue3FrameworkInjector.js';
import { ReactFrameworkInjector } from './frameworks/ReactFrameworkInjector.js';
import { ViteBuilderInjector } from './builders/ViteBuilderInjector.js';
import { WebpackBuilderInjector } from './builders/WebpackBuilderInjector.js';
import { TypeScriptInjector } from './languages/TypeScriptInjector.js';
import { JavaScriptInjector } from './languages/JavaScriptInjector.js';

/**
 * 核心注入器管理器
 * 负责管理和协调所有核心注入器的执行
 */
export class CoreInjectorManager {
  private injectors: CoreInjector[] = [];

  constructor() {
    this.initializeInjectors();
  }

  /**
   * 初始化所有核心注入器
   */
  private initializeInjectors(): void {
    this.injectors = [
      // 基础注入器 - 优先级 1
      new BaseInjector(),
      
      // 语言注入器 - 优先级 2
      new TypeScriptInjector(),
      new JavaScriptInjector(),
      
      // 框架注入器 - 优先级 3
      new Vue2FrameworkInjector(),
      new Vue3FrameworkInjector(),
      new ReactFrameworkInjector(),
      
      // 构建工具注入器 - 优先级 4
      new ViteBuilderInjector(),
      new WebpackBuilderInjector()
    ];

    // 按优先级排序
    this.injectors.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 执行核心项目结构生成
   * @param techStack 技术栈配置
   * @param projectName 项目名称
   * @returns 生成结果
   */
  async generateCoreStructure(
    techStack: TechStack,
    projectName: string
  ): Promise<InjectionResult> {
    const context: InjectionContext = {
      techStack,
      projectName,
      files: {},
      packageJson: {
        name: projectName,
        version: '1.0.0',
        private: true,
        scripts: {},
        dependencies: {},
        devDependencies: {}
      },
      logs: []
    };

    // 获取适用的注入器
    const applicableInjectors = this.getApplicableInjectors(techStack);
    
    console.log(`[CoreInjectorManager] 找到 ${applicableInjectors.length} 个适用的注入器`);
    
    // 按优先级顺序执行注入器
    for (const injector of applicableInjectors) {
      try {
        console.log(`[CoreInjectorManager] 执行注入器: ${injector.name}`);
        const result = injector.inject(context);
        
        // 更新上下文
        context.files = result.files;
        context.packageJson = result.packageJson;
        context.logs = result.logs;
        
        console.log(`[CoreInjectorManager] 注入器 ${injector.name} 执行完成`);
      } catch (error) {
        const errorMessage = `注入器 ${injector.name} 执行失败: ${error}`;
        console.error(`[CoreInjectorManager] ${errorMessage}`);
        context.logs.push(errorMessage);
        throw new Error(errorMessage);
      }
    }

    console.log(`[CoreInjectorManager] 核心结构生成完成，生成了 ${Object.keys(context.files).length} 个文件`);
    
    return {
      files: context.files,
      packageJson: context.packageJson,
      logs: context.logs
    };
  }

  /**
   * 获取适用于指定技术栈的注入器
   * @param techStack 技术栈配置
   * @returns 适用的注入器列表
   */
  private getApplicableInjectors(techStack: TechStack): CoreInjector[] {
    return this.injectors.filter(injector => injector.canHandle(techStack));
  }

  /**
   * 获取指定类型的注入器
   * @param type 注入器类型
   * @returns 指定类型的注入器列表
   */
  getInjectorsByType(type: InjectorType): CoreInjector[] {
    return this.injectors.filter(injector => injector.type === type);
  }

  /**
   * 获取所有注入器
   * @returns 所有注入器列表
   */
  getAllInjectors(): CoreInjector[] {
    return [...this.injectors];
  }

  /**
   * 添加自定义注入器
   * @param injector 要添加的注入器
   */
  addInjector(injector: CoreInjector): void {
    this.injectors.push(injector);
    // 重新排序
    this.injectors.sort((a, b) => a.priority - b.priority);
  }

  /**
   * 移除注入器
   * @param name 注入器名称
   */
  removeInjector(name: string): void {
    this.injectors = this.injectors.filter(injector => injector.name !== name);
  }

  /**
   * 验证技术栈配置
   * @param techStack 技术栈配置
   * @returns 验证结果
   */
  validateTechStack(techStack: TechStack): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // 检查是否有对应的框架注入器
    const frameworkInjectors = this.getInjectorsByType(InjectorType.FRAMEWORK);
    const hasFrameworkSupport = frameworkInjectors.some(injector => injector.canHandle(techStack));
    
    if (!hasFrameworkSupport) {
      errors.push(`不支持的框架: ${techStack.framework}`);
    }

    // 检查是否有对应的构建工具注入器
    const builderInjectors = this.getInjectorsByType(InjectorType.BUILDER);
    const hasBuilderSupport = builderInjectors.some(injector => injector.canHandle(techStack));
    
    if (!hasBuilderSupport) {
      errors.push(`不支持的构建工具: ${techStack.builder}`);
    }

    // 检查是否有对应的语言注入器
    const languageInjectors = this.getInjectorsByType(InjectorType.LANGUAGE);
    const hasLanguageSupport = languageInjectors.some(injector => injector.canHandle(techStack));
    
    if (!hasLanguageSupport) {
      errors.push(`不支持的语言: ${techStack.language}`);
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}