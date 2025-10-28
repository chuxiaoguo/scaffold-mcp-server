import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Lint-staged 注入器
 * 优先级: 82 (Git工具层，在 Husky 之后)
 */
export class LintStagedInjector extends AbstractUnifiedInjector {
  name = "lint-staged";
  priority = InjectorPriority.GIT_TOOLS + 2;
  category = InjectorCategory.GIT_TOOLS;

  override dependencies = ["husky"]; // Lint-staged 通常与 Husky 一起使用

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "lint-staged" ||
        tool.toLowerCase() === "lintstaged"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始配置 Lint-staged");

      // 1. 添加 Lint-staged 依赖
      this.mergeDependencies(packageJson, {
        "lint-staged": "^15.2.0",
      });

      // 2. 在 package.json 中添加 lint-staged 配置
      const lintStagedConfig = this.generateLintStagedConfig(context);
      if (!packageJson["lint-staged"]) {
        packageJson["lint-staged"] = lintStagedConfig;
        this.addLog(logs, "添加 lint-staged 配置到 package.json");
      }

      // 3. 更新 pre-commit hook（如果存在）
      if (files[".husky/pre-commit"]) {
        files[".husky/pre-commit"] = this.updatePreCommitHook(
          files[".husky/pre-commit"]
        );
        this.addLog(logs, "更新 .husky/pre-commit 以包含 lint-staged");
      }

      this.addLog(logs, "Lint-staged 配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generateLintStagedConfig(
    context: UnifiedInjectionContext
  ): Record<string, string[]> {
    const hasESLint = context.tools.some((t) => t.toLowerCase() === "eslint");
    const hasPrettier = context.tools.some(
      (t) => t.toLowerCase() === "prettier"
    );

    const config: Record<string, string[]> = {};

    // JavaScript/TypeScript files
    const jsCommands: string[] = [];
    if (hasESLint) {
      jsCommands.push("eslint --fix");
    }
    if (hasPrettier) {
      jsCommands.push("prettier --write");
    }

    if (jsCommands.length > 0) {
      config["*.{js,jsx,ts,tsx,vue}"] = jsCommands;
    }

    // Other files
    if (hasPrettier) {
      config["*.{json,md,yml,yaml,css,scss,less}"] = ["prettier --write"];
    }

    return config;
  }

  private updatePreCommitHook(existingHook: string): string {
    // 如果已经包含 lint-staged，不重复添加
    if (existingHook.includes("lint-staged")) {
      return existingHook;
    }

    // 在文件末尾添加 lint-staged
    return existingHook.trimEnd() + "\nnpx lint-staged\n";
  }
}
