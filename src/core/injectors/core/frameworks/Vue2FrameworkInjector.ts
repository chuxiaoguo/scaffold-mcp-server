import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * Vue2 框架注入器
 * 负责生成 Vue2 项目的核心文件和依赖
 */
export class Vue2FrameworkInjector extends AbstractCoreInjector {
  name = 'vue2-framework';
  priority = 3; // 框架注入器优先级
  type = InjectorType.FRAMEWORK;

  canHandle(techStack: TechStack): boolean {
    return techStack.framework === 'vue2';
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, projectName, files, packageJson, logs } = context;
    
    this.addLog(logs, '生成 Vue 2 项目结构');

    // 生成主入口文件
    files['src/main.js'] = this.generateMainJs();
    
    // 生成 App 组件
    files['src/App.vue'] = this.generateAppVue(projectName);
    
    // 生成 HTML 模板
    files['index.html'] = this.generateIndexHtml(projectName);

    // 添加 Vue2 依赖
    this.mergeDependencies(packageJson, {
      'vue': '^2.7.14'
    }, 'dependencies');

    // 根据构建工具添加不同的依赖和脚本
    if (techStack.builder === 'webpack') {
      this.addWebpackDependencies(packageJson);
    } else {
      // 默认使用 Vite (Vue 2.7+ 支持)
      this.addViteDependencies(packageJson);
    }

    this.addLog(logs, 'Vue 2 项目结构生成完成');

    return { files, packageJson, logs };
  }

  private generateMainJs(): string {
    return `import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
}).$mount('#app')`;
  }

  private generateAppVue(projectName: string): string {
    return `<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 2 项目！</p>
  </div>
</template>

<script>
export default {
  name: 'App',
  data() {
    return {
      title: '${projectName}'
    }
  }
}
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

  private generateIndexHtml(projectName: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script src="/src/main.js"></script>
</body>
</html>`;
  }

  private addWebpackDependencies(packageJson: any): void {
    this.mergeDependencies(packageJson, {
      'webpack': '^5.0.0',
      'webpack-cli': '^5.0.0',
      'webpack-dev-server': '^4.0.0',
      'vue-loader': '^15.10.0',
      'vue-template-compiler': '^2.7.14',
      'html-webpack-plugin': '^5.0.0',
      'css-loader': '^6.0.0',
      'vue-style-loader': '^4.1.3'
    });

    this.mergeScripts(packageJson, {
      'dev': 'webpack serve --mode development',
      'build': 'webpack --mode production'
    });
  }

  private addViteDependencies(packageJson: any): void {
    this.mergeDependencies(packageJson, {
      '@vitejs/plugin-vue2': '^2.0.0',
      'vite': '^4.0.0'
    });

    this.mergeScripts(packageJson, {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    });
  }
}