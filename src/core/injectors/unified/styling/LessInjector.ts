import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Less 注入器
 * 优先级: 40 (样式层)
 */
export class LessInjector extends AbstractUnifiedInjector {
  name = "less";
  priority = InjectorPriority.STYLING;
  category = InjectorCategory.STYLING;

  override conflicts = ["sass", "scss", "tailwindcss"]; // Less 通常不与其他预处理器同时使用

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "less");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始注入 Less");

      // 1. 添加依赖
      this.mergeDependencies(packageJson, {
        less: "^4.2.0",
      });

      // 2. 生成样式入口文件
      const mainLess = `// Variables
@primary-color: #409eff;
@success-color: #67c23a;
@warning-color: #e6a23c;
@danger-color: #f56c6c;
@info-color: #909399;

// Base styles
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

// Import component styles
// @import './components';
`;
      this.addFile(files, "src/styles/main.less", mainLess);
      this.addLog(logs, "生成 src/styles/main.less");

      this.addLog(logs, "Less 注入完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `注入失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }
}
