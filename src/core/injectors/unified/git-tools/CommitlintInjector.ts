import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Commitlint 注入器
 * 优先级: 81 (Git工具层，在 Husky 之后)
 */
export class CommitlintInjector extends AbstractUnifiedInjector {
  name = "commitlint";
  priority = InjectorPriority.GIT_TOOLS + 1;
  category = InjectorCategory.GIT_TOOLS;

  override dependencies = ["husky"]; // Commitlint 通常与 Husky 一起使用

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "commitlint");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始配置 Commitlint");

      // 1. 添加 Commitlint 依赖
      this.mergeDependencies(packageJson, {
        "@commitlint/cli": "^18.4.4",
        "@commitlint/config-conventional": "^18.4.4",
      });

      // 2. 生成 commitlint.config.js
      this.addFile(
        files,
        "commitlint.config.js",
        this.generateCommitlintConfig()
      );
      this.addLog(logs, "生成 commitlint.config.js");

      // 3. 生成 commit-msg hook
      this.addFile(files, ".husky/commit-msg", this.generateCommitMsgHook());
      this.addLog(logs, "生成 .husky/commit-msg");

      this.addLog(logs, "Commitlint 配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generateCommitlintConfig(): string {
    return `module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',     // 新功能
        'fix',      // 修复bug
        'docs',     // 文档更新
        'style',    // 代码格式（不影响代码运行的变动）
        'refactor', // 重构
        'perf',     // 性能优化
        'test',     // 测试相关
        'chore',    // 构建过程或辅助工具的变动
        'revert',   // 回退
        'build',    // 构建系统或外部依赖的变更
        'ci'        // CI配置文件和脚本的变更
      ]
    ],
    'subject-case': [0] // 允许任意大小写
  }
};
`;
  }

  private generateCommitMsgHook(): string {
    return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1
`;
  }
}
