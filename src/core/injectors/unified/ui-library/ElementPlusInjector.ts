import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Element Plus 注入器
 * 优先级: 50 (UI库层)
 */
export class ElementPlusInjector extends AbstractUnifiedInjector {
  name = "element-plus";
  priority = InjectorPriority.UI_LIBRARY;
  category = InjectorCategory.UI_LIBRARY;

  override dependencies = ["vue3"]; // 依赖 Vue3

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "element-plus" ||
        tool.toLowerCase() === "elementplus"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始注入 Element Plus");

      // 1. 添加依赖
      this.mergeDependencies(
        packageJson,
        {
          "element-plus": "^2.5.4",
          "@element-plus/icons-vue": "^2.3.1",
        },
        "dependencies"
      );

      // 2. 添加自动导入插件（如果使用 Vite）
      if (context.buildTool?.toLowerCase() === "vite") {
        this.mergeDependencies(packageJson, {
          "unplugin-vue-components": "^0.26.0",
          "unplugin-auto-import": "^0.17.3",
        });
        this.addLog(logs, "添加 Vite 自动导入插件");
      }

      this.addLog(logs, "Element Plus 注入完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `注入失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }
}
