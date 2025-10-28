import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Jest 测试框架注入器
 * 优先级: 70 (测试层)
 */
export class JestInjector extends AbstractUnifiedInjector {
  name = "jest";
  priority = InjectorPriority.TESTING;
  category = InjectorCategory.TESTING;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "jest");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始配置 Jest 测试框架");

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 Jest 核心依赖
      const devDeps: Record<string, string> = {
        jest: "^29.7.0",
        "@types/jest": "^29.5.11",
      };

      if (isTypeScript) {
        devDeps["ts-jest"] = "^29.1.1";
      }

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

      // 3. 生成 jest.config.js
      const configFile = isTypeScript ? "jest.config.ts" : "jest.config.js";
      this.addFile(
        files,
        configFile,
        this.generateJestConfig(framework, isTypeScript)
      );
      this.addLog(logs, `生成 ${configFile}`);

      // 4. 添加测试脚本
      this.mergeScripts(packageJson, {
        test: "jest",
        "test:watch": "jest --watch",
        "test:coverage": "jest --coverage",
      });
      this.addLog(logs, "添加测试脚本");

      this.addLog(logs, "Jest 测试框架配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generateJestConfig(
    framework?: string,
    isTypeScript?: boolean
  ): string {
    const config: any = {
      testEnvironment: "jsdom",
      roots: ["<rootDir>/src"],
      testMatch: [
        "**/__tests__/**/*.+(ts|tsx|js)",
        "**/?(*.)+(spec|test).+(ts|tsx|js)",
      ],
      collectCoverageFrom: [
        "src/**/*.{js,jsx,ts,tsx}",
        "!src/**/*.d.ts",
        "!src/main.{js,ts,jsx,tsx}",
      ],
    };

    if (isTypeScript) {
      config.preset = "ts-jest";
      config.transform = {
        "^.+\\.tsx?$": "ts-jest",
      };
    }

    switch (framework?.toLowerCase()) {
      case "vue2":
      case "vue3":
        config.moduleFileExtensions = ["js", "ts", "json", "vue"];
        config.transform = {
          ...config.transform,
          "^.+\\.vue$": "@vue/vue3-jest",
        };
        break;
      case "react":
        config.setupFilesAfterEnv = ["<rootDir>/src/setupTests.ts"];
        break;
    }

    const exportStatement = isTypeScript
      ? "export default "
      : "module.exports = ";
    return exportStatement + JSON.stringify(config, null, 2);
  }
}
