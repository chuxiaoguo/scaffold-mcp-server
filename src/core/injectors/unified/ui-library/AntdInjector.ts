import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Ant Design (React) 注入器
 * 优先级: 50 (UI库层)
 */
export class AntdInjector extends AbstractUnifiedInjector {
  name = "antd";
  priority = InjectorPriority.UI_LIBRARY;
  category = InjectorCategory.UI_LIBRARY;

  override dependencies = ["react"]; // 依赖 React

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "antd" || tool.toLowerCase() === "ant-design"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始注入 Ant Design");

      // 1. 添加依赖
      this.mergeDependencies(
        packageJson,
        {
          antd: "^5.12.8",
          "@ant-design/icons": "^5.2.6",
        },
        "dependencies"
      );

      this.addLog(logs, "Ant Design 注入完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `注入失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }
}
