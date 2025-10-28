import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * ESLint 注入器
 * 优先级: 60 (代码质量层)
 */
export class ESLintInjector extends AbstractUnifiedInjector {
  name = "eslint";
  priority = InjectorPriority.CODE_QUALITY;
  category = InjectorCategory.CODE_QUALITY;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "eslint");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始配置 ESLint");

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 ESLint 核心依赖
      const devDeps: Record<string, string> = {
        eslint: "^8.56.0",
      };

      // 2. 添加 TypeScript 支持
      if (isTypeScript) {
        devDeps["@typescript-eslint/eslint-plugin"] = "^6.17.0";
        devDeps["@typescript-eslint/parser"] = "^6.17.0";
      }

      // 3. 添加框架特定的插件
      switch (framework?.toLowerCase()) {
        case "vue2":
        case "vue3":
          devDeps["eslint-plugin-vue"] = "^9.19.2";
          break;
        case "react":
          devDeps["eslint-plugin-react"] = "^7.33.2";
          devDeps["eslint-plugin-react-hooks"] = "^4.6.0";
          break;
      }

      this.mergeDependencies(packageJson, devDeps);

      // 4. 生成 .eslintrc.json
      const eslintConfig = this.generateESLintConfig(framework, isTypeScript);
      this.addFile(
        files,
        ".eslintrc.json",
        JSON.stringify(eslintConfig, null, 2)
      );
      this.addLog(logs, "生成 .eslintrc.json");

      // 5. 生成 .eslintignore
      this.addFile(files, ".eslintignore", this.generateESLintIgnore());
      this.addLog(logs, "生成 .eslintignore");

      // 6. 添加脚本
      this.mergeScripts(packageJson, {
        lint: "eslint . --ext .js,.jsx,.ts,.tsx,.vue",
        "lint:fix": "eslint . --ext .js,.jsx,.ts,.tsx,.vue --fix",
      });
      this.addLog(logs, "添加 lint 脚本");

      this.addLog(logs, "ESLint 配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generateESLintConfig(
    framework?: string,
    isTypeScript?: boolean
  ): any {
    const config: any = {
      root: true,
      env: {
        browser: true,
        es2021: true,
        node: true,
      },
      extends: ["eslint:recommended"],
    };

    if (isTypeScript) {
      config.parser = "@typescript-eslint/parser";
      config.plugins = ["@typescript-eslint"];
      config.extends.push("plugin:@typescript-eslint/recommended");
    }

    switch (framework?.toLowerCase()) {
      case "vue2":
        config.extends.push("plugin:vue/essential");
        break;
      case "vue3":
        config.extends.push("plugin:vue/vue3-recommended");
        break;
      case "react":
        config.extends.push("plugin:react/recommended");
        config.extends.push("plugin:react-hooks/recommended");
        config.settings = {
          react: {
            version: "detect",
          },
        };
        break;
    }

    config.rules = {
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
    };

    return config;
  }

  private generateESLintIgnore(): string {
    return `node_modules/
dist/
build/
*.min.js
*.min.css
.vscode/
.idea/
`;
  }
}
