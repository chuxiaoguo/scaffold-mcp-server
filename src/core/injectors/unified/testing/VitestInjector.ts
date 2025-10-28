import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Vitest 测试框架注入器
 * 优先级: 70 (测试层)
 */
export class VitestInjector extends AbstractUnifiedInjector {
  name = "vitest";
  priority = InjectorPriority.TESTING;
  category = InjectorCategory.TESTING;

  override dependencies = ["vite"]; // Vitest 依赖 Vite

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "vitest");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework } = context;

    try {
      this.addLog(logs, "开始配置 Vitest 测试框架");

      // 1. 添加 Vitest 核心依赖
      const devDeps: Record<string, string> = {
        vitest: "^1.1.0",
        "@vitest/ui": "^1.1.0",
        jsdom: "^23.0.1",
      };

      // 2. 添加框架特定的测试工具
      switch (framework?.toLowerCase()) {
        case "vue2":
        case "vue3":
          devDeps["@vue/test-utils"] =
            framework === "vue3" ? "^2.4.3" : "^1.3.6";
          break;
        case "react":
          devDeps["@testing-library/react"] = "^14.1.2";
          devDeps["@testing-library/jest-dom"] = "^6.1.5";
          devDeps["@testing-library/user-event"] = "^14.5.1";
          break;
      }

      this.mergeDependencies(packageJson, devDeps);

      // 3. 更新 vite.config 以包含 Vitest 配置
      this.addLog(
        logs,
        "Vitest 会使用 vite.config 中的配置，请手动添加 test 字段"
      );

      // 4. 添加测试脚本
      this.mergeScripts(packageJson, {
        test: "vitest",
        "test:ui": "vitest --ui",
        "test:coverage": "vitest --coverage",
      });
      this.addLog(logs, "添加测试脚本");

      this.addLog(logs, "Vitest 测试框架配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }
}
