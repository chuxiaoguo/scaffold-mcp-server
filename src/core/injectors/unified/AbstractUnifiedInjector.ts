import {
  UnifiedInjector,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
  InjectorCategory,
} from "../../../types/index.js";

/**
 * 统一注入器抽象基类
 * 提供通用的工具方法和默认实现
 */
export abstract class AbstractUnifiedInjector implements UnifiedInjector {
  abstract name: string;
  abstract priority: number;
  abstract category: InjectorCategory;

  dependencies?: string[];
  conflicts?: string[];

  /**
   * 判断是否需要执行注入
   * 子类可以重写此方法实现更复杂的判断逻辑
   */
  canHandle(tools: string[]): boolean {
    // 默认实现：检查工具集中是否包含当前注入器的名称（小写）
    return tools.some((tool) => tool.toLowerCase() === this.name.toLowerCase());
  }

  /**
   * 执行注入（抽象方法，子类必须实现）
   */
  abstract inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult>;

  /**
   * 合并 package.json 依赖
   */
  protected mergeDependencies(
    packageJson: any,
    dependencies: Record<string, string>,
    type: "dependencies" | "devDependencies" = "devDependencies"
  ): void {
    if (!packageJson[type]) {
      packageJson[type] = {};
    }
    Object.assign(packageJson[type], dependencies);
  }

  /**
   * 合并 package.json 脚本
   */
  protected mergeScripts(
    packageJson: any,
    scripts: Record<string, string>
  ): void {
    if (!packageJson.scripts) {
      packageJson.scripts = {};
    }
    Object.assign(packageJson.scripts, scripts);
  }

  /**
   * 添加文件
   */
  protected addFile(
    files: Record<string, string>,
    filePath: string,
    content: string
  ): void {
    files[filePath] = content;
  }

  /**
   * 添加日志
   */
  protected addLog(logs: string[], message: string): void {
    const logMessage = `[${this.category}] ${this.name}: ${message}`;
    logs.push(logMessage);
    console.log(`   - ${logMessage}`);
  }

  /**
   * 创建成功的注入结果
   */
  protected createSuccessResult(
    files: Record<string, string>,
    packageJson: any,
    logs: string[]
  ): UnifiedInjectionResult {
    return {
      files,
      packageJson,
      logs,
      success: true,
    };
  }

  /**
   * 创建失败的注入结果
   */
  protected createErrorResult(
    files: Record<string, string>,
    packageJson: any,
    logs: string[],
    errors: string[]
  ): UnifiedInjectionResult {
    return {
      files,
      packageJson,
      logs,
      success: false,
      errors,
    };
  }

  /**
   * 检查依赖是否满足
   */
  protected checkDependencies(tools: string[]): boolean {
    if (!this.dependencies || this.dependencies.length === 0) {
      return true;
    }
    return this.dependencies.every((dep) =>
      tools.some((tool) => tool.toLowerCase() === dep.toLowerCase())
    );
  }

  /**
   * 检查是否存在冲突
   */
  protected checkConflicts(tools: string[]): string[] {
    if (!this.conflicts || this.conflicts.length === 0) {
      return [];
    }
    return this.conflicts.filter((conflict) =>
      tools.some((tool) => tool.toLowerCase() === conflict.toLowerCase())
    );
  }
}
