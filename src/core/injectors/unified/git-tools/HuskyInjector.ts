import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Husky Git Hooks 注入器
 * 优先级: 80 (Git工具层)
 */
export class HuskyInjector extends AbstractUnifiedInjector {
  name = "husky";
  priority = InjectorPriority.GIT_TOOLS;
  category = InjectorCategory.GIT_TOOLS;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "husky");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始配置 Husky Git Hooks");

      // 1. 添加 Husky 依赖
      this.mergeDependencies(packageJson, {
        husky: "^8.0.3",
      });

      // 2. 添加 prepare 脚本
      this.mergeScripts(packageJson, {
        prepare: "husky install",
      });
      this.addLog(logs, "添加 prepare 脚本");

      // 3. 生成 .husky 目录和 pre-commit hook
      this.addFile(
        files,
        ".husky/pre-commit",
        this.generatePreCommitHook(context)
      );
      this.addLog(logs, "生成 .husky/pre-commit");

      // 4. 生成 husky install 说明
      this.addFile(files, ".husky/_/.gitignore", "*");
      this.addLog(logs, "生成 .husky/_/.gitignore");

      this.addLog(logs, "Husky Git Hooks 配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generatePreCommitHook(context: UnifiedInjectionContext): string {
    const hasLintStaged = context.tools.some(
      (t) => t.toLowerCase() === "lint-staged"
    );
    const hasESLint = context.tools.some((t) => t.toLowerCase() === "eslint");

    let hookContent = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

`;

    if (hasLintStaged) {
      hookContent += "npx lint-staged\n";
    } else if (hasESLint) {
      hookContent += "npm run lint\n";
    } else {
      hookContent += "# Add your pre-commit commands here\n";
    }

    return hookContent;
  }
}
