import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Vue3 框架注入器
 * 优先级: 20 (框架层)
 */
export class Vue3Injector extends AbstractUnifiedInjector {
  name = "vue3";
  priority = InjectorPriority.FRAMEWORK;
  category = InjectorCategory.FRAMEWORK;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "vue3");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, projectName, language } = context;

    try {
      this.addLog(logs, "开始生成 Vue 3 项目结构");

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 Vue3 核心依赖
      this.mergeDependencies(
        packageJson,
        {
          vue: "^3.4.3",
        },
        "dependencies"
      );

      // 2. 生成主入口文件
      const mainFile = isTypeScript ? "src/main.ts" : "src/main.js";
      this.addFile(files, mainFile, this.generateMainFile());
      this.addLog(logs, `生成 ${mainFile}`);

      // 3. 生成 App.vue
      this.addFile(
        files,
        "src/App.vue",
        this.generateAppVue(projectName || "Vue3 App", isTypeScript)
      );
      this.addLog(logs, "生成 src/App.vue");

      // 4. 生成 index.html
      this.addFile(
        files,
        "index.html",
        this.generateIndexHtml(projectName || "Vue3 App", mainFile)
      );
      this.addLog(logs, "生成 index.html");

      // 5. 添加 shims-vue.d.ts (TypeScript 项目)
      if (isTypeScript) {
        this.addFile(files, "src/shims-vue.d.ts", this.generateShimsVue());
        this.addLog(logs, "生成 src/shims-vue.d.ts");
      }

      this.addLog(logs, "Vue 3 项目结构生成完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `生成失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generateMainFile(): string {
    return `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')
`;
  }

  private generateAppVue(projectName: string, isTypeScript: boolean): string {
    const scriptLang = isTypeScript ? ' lang="ts"' : "";
    return `<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 3 + Vite 项目！</p>
  </div>
</template>

<script setup${scriptLang}>
import { ref } from 'vue'

const title = ref('${projectName}')
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}

h1 {
  font-size: 2.5em;
  margin-bottom: 0.5em;
}
</style>
`;
  }

  private generateIndexHtml(projectName: string, mainFile: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/vite.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/${mainFile}"></script>
</body>
</html>
`;
  }

  private generateShimsVue(): string {
    return `declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}
`;
  }
}
