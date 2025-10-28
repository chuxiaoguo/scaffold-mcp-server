import {
  UnifiedInjector,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../types/index.js";

/**
 * 统一注入器管理器
 * 负责注册、排序、执行所有注入器
 */
export class UnifiedInjectorManager {
  private injectors: Map<string, UnifiedInjector> = new Map();

  /**
   * 注册注入器
   */
  register(injector: UnifiedInjector): void {
    if (this.injectors.has(injector.name)) {
      console.warn(
        `Injector ${injector.name} already registered, will be replaced.`
      );
    }
    this.injectors.set(injector.name, injector);
  }

  /**
   * 批量注册注入器
   */
  registerAll(injectors: UnifiedInjector[]): void {
    injectors.forEach((injector) => this.register(injector));
  }

  /**
   * 获取所有注册的注入器
   */
  getAllInjectors(): UnifiedInjector[] {
    return Array.from(this.injectors.values());
  }

  /**
   * 执行统一注入
   */
  async injectAll(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const logs: string[] = [];
    const errors: string[] = [];

    logs.push("\n========== 开始统一注入流程 ==========");
    logs.push(`项目名称: ${context.projectName}`);
    logs.push(`工具集合: ${context.tools.join(", ")}`);

    try {
      // 1. 选择需要执行的注入器
      const selectedInjectors = this.selectInjectors(context.tools);
      logs.push(`\n选中注入器数量: ${selectedInjectors.length}`);

      // 2. 检查冲突
      const conflicts = this.detectConflicts(selectedInjectors, context.tools);
      if (conflicts.length > 0) {
        const conflictMsg = `检测到工具冲突: ${conflicts.join(", ")}`;
        logs.push(`⚠️  ${conflictMsg}`);
        errors.push(conflictMsg);
      }

      // 3. 依赖排序（拓扑排序）
      const sortedInjectors = this.sortByDependencies(selectedInjectors);
      logs.push("\n注入器执行顺序:");
      sortedInjectors.forEach((injector, index) => {
        logs.push(
          `  ${index + 1}. [${injector.category}] ${injector.name} (priority: ${injector.priority})`
        );
      });

      // 4. 依次执行注入
      let currentFiles = { ...context.files };
      let currentPackageJson = { ...context.packageJson };
      const allLogs = [...logs];

      logs.push("\n========== 执行注入 ==========");

      for (const injector of sortedInjectors) {
        try {
          logs.push(`\n>>> 执行: ${injector.name}`);

          const injectionContext: UnifiedInjectionContext = {
            ...context,
            files: currentFiles,
            packageJson: currentPackageJson,
            logs: [],
          };

          const result = await injector.inject(injectionContext);

          if (result.success) {
            currentFiles = result.files;
            currentPackageJson = result.packageJson;
            allLogs.push(...result.logs);
            logs.push(`✓ ${injector.name} 注入成功`);
          } else {
            const errorMsg = `${injector.name} 注入失败: ${result.errors?.join(", ")}`;
            logs.push(`✗ ${errorMsg}`);
            errors.push(errorMsg);
            allLogs.push(...result.logs);
          }
        } catch (error) {
          const errorMsg = `${injector.name} 执行异常: ${error instanceof Error ? error.message : String(error)}`;
          logs.push(`✗ ${errorMsg}`);
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      logs.push("\n========== 统一注入流程完成 ==========");

      const finalResult: UnifiedInjectionResult = {
        files: currentFiles,
        packageJson: currentPackageJson,
        logs: allLogs,
        success: errors.length === 0,
      };

      if (errors.length > 0) {
        finalResult.errors = errors;
      }

      return finalResult;
    } catch (error) {
      const errorMsg = `统一注入流程异常: ${error instanceof Error ? error.message : String(error)}`;
      logs.push(`\n✗ ${errorMsg}`);
      errors.push(errorMsg);
      console.error(errorMsg, error);

      return {
        files: context.files,
        packageJson: context.packageJson,
        logs,
        success: false,
        errors,
      };
    }
  }

  /**
   * 选择需要执行的注入器
   */
  private selectInjectors(tools: string[]): UnifiedInjector[] {
    return this.getAllInjectors().filter((injector) =>
      injector.canHandle(tools)
    );
  }

  /**
   * 检测工具冲突
   */
  private detectConflicts(
    injectors: UnifiedInjector[],
    tools: string[]
  ): string[] {
    const conflicts: string[] = [];

    for (const injector of injectors) {
      if (!injector.conflicts || injector.conflicts.length === 0) {
        continue;
      }

      const foundConflicts = injector.conflicts.filter((conflict) =>
        tools.some((tool) => tool.toLowerCase() === conflict.toLowerCase())
      );

      if (foundConflicts.length > 0) {
        conflicts.push(`${injector.name} 与 ${foundConflicts.join(", ")} 冲突`);
      }
    }

    return conflicts;
  }

  /**
   * 依赖排序（拓扑排序 + 优先级排序）
   */
  private sortByDependencies(injectors: UnifiedInjector[]): UnifiedInjector[] {
    // 1. 先按优先级排序
    const sortedByPriority = [...injectors].sort(
      (a, b) => a.priority - b.priority
    );

    // 2. 构建依赖图
    const graph = new Map<string, Set<string>>();
    const inDegree = new Map<string, number>();

    sortedByPriority.forEach((injector) => {
      graph.set(injector.name, new Set());
      inDegree.set(injector.name, 0);
    });

    sortedByPriority.forEach((injector) => {
      if (injector.dependencies) {
        injector.dependencies.forEach((dep) => {
          // 只处理当前选中的注入器之间的依赖
          if (graph.has(dep)) {
            graph.get(dep)?.add(injector.name);
            inDegree.set(injector.name, (inDegree.get(injector.name) || 0) + 1);
          }
        });
      }
    });

    // 3. 拓扑排序
    const result: UnifiedInjector[] = [];
    const queue: string[] = [];
    const nameToInjector = new Map(
      sortedByPriority.map((inj) => [inj.name, inj])
    );

    // 找出所有入度为0的节点
    inDegree.forEach((degree, name) => {
      if (degree === 0) {
        queue.push(name);
      }
    });

    // 按优先级排序入度为0的节点
    queue.sort((a, b) => {
      const priorityA = nameToInjector.get(a)?.priority || 0;
      const priorityB = nameToInjector.get(b)?.priority || 0;
      return priorityA - priorityB;
    });

    while (queue.length > 0) {
      const current = queue.shift()!;
      const injector = nameToInjector.get(current);
      if (injector) {
        result.push(injector);
      }

      const neighbors = graph.get(current) || new Set();
      neighbors.forEach((neighbor) => {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      });

      // 重新排序队列
      queue.sort((a, b) => {
        const priorityA = nameToInjector.get(a)?.priority || 0;
        const priorityB = nameToInjector.get(b)?.priority || 0;
        return priorityA - priorityB;
      });
    }

    // 检查是否有循环依赖
    if (result.length !== sortedByPriority.length) {
      console.warn("检测到循环依赖，使用优先级排序");
      return sortedByPriority;
    }

    return result;
  }
}
