import { TechStack } from '../../../types/index.js';

/**
 * 注入上下文
 */
export interface InjectionContext {
  techStack: TechStack;
  projectName: string;
  files: Record<string, string>;
  packageJson: any;
  logs: string[];
}

/**
 * 注入结果
 */
export interface InjectionResult {
  files: Record<string, string>;
  packageJson: any;
  logs: string[];
}

/**
 * 核心注入器接口
 */
export interface CoreInjector {
  name: string;
  priority: number;
  type: InjectorType;
  canHandle(techStack: TechStack): boolean;
  inject(context: InjectionContext): InjectionResult;
}

/**
 * 注入器类型枚举
 */
export enum InjectorType {
  BASE = 'base',
  LANGUAGE = 'language', 
  FRAMEWORK = 'framework',
  BUILDER = 'builder'
}

/**
 * 抽象核心注入器基类
 */
export abstract class AbstractCoreInjector implements CoreInjector {
  abstract name: string;
  abstract priority: number;
  abstract type: InjectorType;

  abstract canHandle(techStack: TechStack): boolean;
  abstract inject(context: InjectionContext): InjectionResult;

  /**
   * 合并package.json依赖
   */
  protected mergeDependencies(
    target: any,
    dependencies: Record<string, string>,
    type: 'dependencies' | 'devDependencies' = 'devDependencies'
  ): void {
    if (!target[type]) {
      target[type] = {};
    }
    Object.assign(target[type], dependencies);
  }

  /**
   * 合并package.json脚本
   */
  protected mergeScripts(target: any, scripts: Record<string, string>): void {
    if (!target.scripts) {
      target.scripts = {};
    }
    Object.assign(target.scripts, scripts);
  }

  /**
   * 添加日志
   */
  protected addLog(logs: string[], message: string): void {
    logs.push(`   - ${this.name}: ${message}`);
    console.log(`   - ${this.name}: ${message}`);
  }
}