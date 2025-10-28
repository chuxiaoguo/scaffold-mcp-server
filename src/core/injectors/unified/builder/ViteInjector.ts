import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Vite 构建工具注入器
 * 优先级: 30 (构建层)
 */
export class ViteInjector extends AbstractUnifiedInjector {
  name = "vite";
  priority = InjectorPriority.BUILDER;
  category = InjectorCategory.BUILDER;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "vite");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始配置 Vite 构建工具");

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 Vite 核心依赖
      this.mergeDependencies(packageJson, {
        vite: "^5.0.10",
      });

      // 2. 添加框架特定的 Vite 插件
      this.addFrameworkPlugins(packageJson, framework);

      // 3. 生成 vite.config 文件
      const configFile = isTypeScript ? "vite.config.ts" : "vite.config.js";
      this.addFile(
        files,
        configFile,
        this.generateViteConfig(framework, isTypeScript)
      );
      this.addLog(logs, `生成 ${configFile}`);

      // 4. 添加构建脚本
      this.mergeScripts(packageJson, {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      });
      this.addLog(logs, "添加构建脚本");

      // 5. 如果是 TypeScript，添加类型定义
      if (isTypeScript) {
        this.mergeDependencies(packageJson, {
          "@types/node": "^20.10.6",
        });
      }

      this.addLog(logs, "Vite 构建工具配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private addFrameworkPlugins(packageJson: any, framework?: string): void {
    const devDeps: Record<string, string> = {};

    switch (framework?.toLowerCase()) {
      case "vue2":
        devDeps["vite-plugin-vue2"] = "^2.0.3";
        break;
      case "vue3":
        devDeps["@vitejs/plugin-vue"] = "^5.0.2";
        break;
      case "react":
        devDeps["@vitejs/plugin-react"] = "^4.2.1";
        break;
    }

    if (Object.keys(devDeps).length > 0) {
      this.mergeDependencies(packageJson, devDeps);
    }
  }

  private generateViteConfig(
    framework?: string,
    isTypeScript?: boolean
  ): string {
    let imports = "import { defineConfig } from 'vite'";
    let plugins: string[] = [];

    // 根据框架添加相应的插件
    switch (framework?.toLowerCase()) {
      case "vue2":
        imports += "\nimport { createVuePlugin } from 'vite-plugin-vue2'";
        plugins.push("createVuePlugin()");
        break;
      case "vue3":
        imports += "\nimport vue from '@vitejs/plugin-vue'";
        plugins.push("vue()");
        break;
      case "react":
        imports += "\nimport react from '@vitejs/plugin-react'";
        plugins.push("react()");
        break;
    }

    if (isTypeScript) {
      imports += "\nimport path from 'path'";
    }

    const pluginArray = plugins.length > 0 ? `[${plugins.join(", ")}]` : "[]";

    const aliasConfig = isTypeScript
      ? `
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },`
      : "";

    return `${imports}

export default defineConfig({
  plugins: ${pluginArray},${aliasConfig}
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
`;
  }
}
