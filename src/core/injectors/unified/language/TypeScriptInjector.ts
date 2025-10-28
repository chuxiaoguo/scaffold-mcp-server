import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * TypeScript 注入器
 * 优先级: 10 (语言层)
 */
export class TypeScriptInjector extends AbstractUnifiedInjector {
  name = "typescript";
  priority = InjectorPriority.LANGUAGE;
  category = InjectorCategory.LANGUAGE;

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "typescript" || tool.toLowerCase() === "ts"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, buildTool } = context;

    try {
      this.addLog(logs, "开始配置 TypeScript");

      // 1. 添加 TypeScript 依赖
      this.mergeDependencies(packageJson, {
        typescript: "^5.3.3",
      });

      // 2. 生成 tsconfig.json
      const tsConfig = this.generateTsConfig(framework, buildTool);
      this.addFile(files, "tsconfig.json", JSON.stringify(tsConfig, null, 2));
      this.addLog(logs, "生成 tsconfig.json");

      // 3. 添加框架特定的类型定义
      this.addFrameworkTypes(packageJson, framework);

      this.addLog(logs, "TypeScript 配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generateTsConfig(framework?: string, buildTool?: string): any {
    const baseConfig: any = {
      compilerOptions: {
        target: "ES2020",
        lib: ["ES2020", "DOM", "DOM.Iterable"],
        allowJs: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        module: "ESNext",
        moduleResolution: "node", // Webpack 需要 node
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: buildTool === "vite", // Vite 使用 noEmit，Webpack 不使用
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        baseUrl: ".",
        paths: {
          "@/*": ["src/*"],
        },
      },
      include: ["src/**/*"],
      exclude: ["node_modules", "dist"],
    };

    // 根据框架调整配置
    switch (framework?.toLowerCase()) {
      case "vue2":
        baseConfig.compilerOptions.jsx = "preserve";
        baseConfig.compilerOptions.lib.push("ScriptHost");
        baseConfig.compilerOptions.types = ["webpack-env"];
        baseConfig.compilerOptions.experimentalDecorators = true; // vue-property-decorator 需要
        baseConfig.compilerOptions.emitDecoratorMetadata = true;
        baseConfig.include = ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"];
        break;
      case "vue3":
        baseConfig.compilerOptions.jsx = "preserve";
        baseConfig.include.push("*.vue");
        break;
      case "react":
        baseConfig.compilerOptions.jsx = "react-jsx";
        break;
    }

    return baseConfig;
  }

  private addFrameworkTypes(packageJson: any, framework?: string): void {
    const devDeps: Record<string, string> = {
      "@types/node": "^20.10.6",
    };

    switch (framework?.toLowerCase()) {
      case "vue2":
        devDeps["@types/vue"] = "^2.0.0";
        break;
      case "vue3":
        // Vue 3 自带类型定义
        break;
      case "react":
        devDeps["@types/react"] = "^18.2.45";
        devDeps["@types/react-dom"] = "^18.2.18";
        break;
    }

    this.mergeDependencies(packageJson, devDeps);
    this.addLog([], `添加类型定义: ${Object.keys(devDeps).join(", ")}`);
  }
}
