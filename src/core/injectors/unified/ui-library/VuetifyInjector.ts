import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Vuetify 注入器
 * 优先级: 50 (UI库层)
 */
export class VuetifyInjector extends AbstractUnifiedInjector {
  name = "vuetify";
  priority = InjectorPriority.UI_LIBRARY;
  category = InjectorCategory.UI_LIBRARY;

  override dependencies = ["vue3"]; // 依赖 Vue3

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "vuetify");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始注入 Vuetify");

      // 1. 添加依赖
      this.mergeDependencies(
        packageJson,
        {
          vuetify: "^3.4.9",
          "@mdi/font": "^7.4.47",
        },
        "dependencies"
      );

      this.mergeDependencies(packageJson, {
        "vite-plugin-vuetify": "^2.0.1",
      });

      this.addLog(logs, "Vuetify 注入完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `注入失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }
}
