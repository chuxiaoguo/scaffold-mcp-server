import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Prettier 注入器
 * 优先级: 61 (代码质量层，在 ESLint 之后)
 */
export class PrettierInjector extends AbstractUnifiedInjector {
  name = "prettier";
  priority = InjectorPriority.CODE_QUALITY + 1;
  category = InjectorCategory.CODE_QUALITY;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "prettier");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始配置 Prettier");

      // 1. 添加 Prettier 依赖
      this.mergeDependencies(packageJson, {
        prettier: "^3.1.1",
      });

      // 2. 如果有 ESLint，添加集成插件
      if (context.tools.some((t) => t.toLowerCase() === "eslint")) {
        this.mergeDependencies(packageJson, {
          "eslint-config-prettier": "^9.1.0",
          "eslint-plugin-prettier": "^5.1.2",
        });
        this.addLog(logs, "添加 ESLint + Prettier 集成");
      }

      // 3. 生成 .prettierrc
      const prettierConfig = {
        semi: true,
        trailingComma: "es5" as const,
        singleQuote: true,
        printWidth: 100,
        tabWidth: 2,
        useTabs: false,
        endOfLine: "lf" as const,
      };
      this.addFile(
        files,
        ".prettierrc",
        JSON.stringify(prettierConfig, null, 2)
      );
      this.addLog(logs, "生成 .prettierrc");

      // 4. 生成 .prettierignore
      this.addFile(files, ".prettierignore", this.generatePrettierIgnore());
      this.addLog(logs, "生成 .prettierignore");

      // 5. 添加脚本
      this.mergeScripts(packageJson, {
        format: "prettier --write .",
        "format:check": "prettier --check .",
      });
      this.addLog(logs, "添加 format 脚本");

      this.addLog(logs, "Prettier 配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generatePrettierIgnore(): string {
    return `node_modules/
dist/
build/
coverage/
*.min.js
*.min.css
package-lock.json
yarn.lock
pnpm-lock.yaml
`;
  }
}
