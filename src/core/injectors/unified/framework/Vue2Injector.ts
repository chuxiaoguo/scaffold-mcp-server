import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Vue2 框架注入器
 * 优先级: 20 (框架层)
 */
export class Vue2Injector extends AbstractUnifiedInjector {
  name = "vue2";
  priority = InjectorPriority.FRAMEWORK;
  category = InjectorCategory.FRAMEWORK;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "vue2");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, projectName, language } = context;

    try {
      this.addLog(logs, "开始生成 Vue 2 项目结构");

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 Vue 2 依赖
      this.mergeDependencies(packageJson, {
        vue: "^2.7.16",
      });

      if (isTypeScript) {
        this.mergeDependencies(
          packageJson,
          {
            "@types/vue": "^2.0.0",
            "vue-class-component": "^7.2.6",
            "vue-property-decorator": "^9.1.2",
          },
          "devDependencies"
        );
      }

      // 2. 生成入口文件
      const mainExt = isTypeScript ? "ts" : "js";
      const mainFile = `src/main.${mainExt}`;

      if (isTypeScript) {
        files[mainFile] = `import Vue from 'vue';
import App from './App.vue';

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
`;
      } else {
        files[mainFile] = `import Vue from 'vue';
import App from './App.vue';

Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
`;
      }

      // 3. 生成 App.vue
      files["src/App.vue"] = `<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 2 项目！</p>
  </div>
</template>

<script${isTypeScript ? ' lang="ts"' : ""}>
${
  isTypeScript
    ? `import { Component, Vue } from 'vue-property-decorator';

@Component
export default class App extends Vue {
  title = '${projectName}';
}`
    : `export default {
  name: 'App',
  data() {
    return {
      title: '${projectName}'
    }
  }
}`
}
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
`;

      // 4. 生成 index.html
      files["index.html"] = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
</body>
</html>
`;

      // 5. 如果是 TypeScript，生成类型声明文件
      if (isTypeScript) {
        files["src/shims-vue.d.ts"] = `declare module '*.vue' {
  import Vue from 'vue';
  export default Vue;
}
`;

        // 生成 tsconfig.json（如果还没有）
        if (!files["tsconfig.json"]) {
          files["tsconfig.json"] = JSON.stringify(
            {
              compilerOptions: {
                target: "ES2015",
                module: "ESNext",
                strict: true,
                jsx: "preserve",
                moduleResolution: "node",
                skipLibCheck: true,
                esModuleInterop: true,
                allowSyntheticDefaultImports: true,
                forceConsistentCasingInFileNames: true,
                useDefineForClassFields: true,
                sourceMap: true,
                baseUrl: ".",
                types: ["webpack-env"],
                paths: {
                  "@/*": ["src/*"],
                },
                lib: ["ES2015", "DOM", "DOM.Iterable", "ScriptHost"],
                experimentalDecorators: true,
                emitDecoratorMetadata: true,
              },
              include: ["src/**/*.ts", "src/**/*.tsx", "src/**/*.vue"],
              exclude: ["node_modules"],
            },
            null,
            2
          );
        }
      }

      this.addLog(logs, "✅ Vue 2 框架注入完成");

      return {
        files,
        packageJson,
        logs,
        success: true,
      };
    } catch (error) {
      this.addLog(logs, `❌ Vue 2 注入失败: ${error}`);
      return {
        files,
        packageJson,
        logs,
        success: false,
        errors: [error instanceof Error ? error.message : String(error)],
      };
    }
  }
}
