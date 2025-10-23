import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * Vue3 框架注入器
 * 负责生成 Vue3 项目的核心文件和依赖
 */
export class Vue3FrameworkInjector extends AbstractCoreInjector {
  name = 'vue3-framework';
  priority = 3; // 框架注入器优先级
  type = InjectorType.FRAMEWORK;

  canHandle(techStack: TechStack): boolean {
    return techStack.framework === 'vue3';
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, projectName, files, packageJson, logs } = context;
    
    this.addLog(logs, '生成 Vue 3 项目结构');

    // 根据语言类型生成不同的入口文件
    const isTypeScript = techStack.language === 'typescript';
    const mainFile = isTypeScript ? 'src/main.ts' : 'src/main.js';
    const appFile = isTypeScript ? 'src/App.vue' : 'src/App.vue';

    // 生成主入口文件
    files[mainFile] = this.generateMainFile(isTypeScript);
    
    // 生成 App 组件
    files[appFile] = this.generateAppVue(projectName, isTypeScript);
    
    // 生成 HTML 模板
    files['index.html'] = this.generateIndexHtml(projectName, mainFile);

    // 添加 Vue3 依赖
    this.mergeDependencies(packageJson, {
      'vue': '^3.3.0'
    }, 'dependencies');

    // 添加构建工具依赖
    this.addBuildDependencies(packageJson, isTypeScript);

    this.addLog(logs, 'Vue 3 项目结构生成完成');

    return { files, packageJson, logs };
  }

  private generateMainFile(isTypeScript: boolean): string {
    if (isTypeScript) {
      return `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')`;
    } else {
      return `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')`;
    }
  }

  private generateAppVue(projectName: string, isTypeScript: boolean): string {
    if (isTypeScript) {
      return `<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 3 项目！</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('${projectName}')
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`;
    } else {
      return `<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 3 项目！</p>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const title = ref('${projectName}')
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`;
    }
  }

  private generateIndexHtml(projectName: string, mainFile: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/${mainFile}"></script>
</body>
</html>`;
  }

  private addBuildDependencies(packageJson: any, isTypeScript: boolean): void {
    // 默认使用 Vite
    const devDeps: Record<string, string> = {
      '@vitejs/plugin-vue': '^4.0.0',
      'vite': '^4.0.0'
    };

    if (isTypeScript) {
      devDeps['typescript'] = '^5.0.0';
    }

    this.mergeDependencies(packageJson, devDeps);

    this.mergeScripts(packageJson, {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    });
  }
}