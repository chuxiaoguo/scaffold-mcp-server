import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Vue Router 路由注入器
 * 优先级: 55 (在 UI 库之后，代码质量之前)
 */
export class VueRouterInjector extends AbstractUnifiedInjector {
  name = "vue-router";
  priority = 55;
  category = InjectorCategory.FRAMEWORK;

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "vue-router" || tool.toLowerCase() === "router"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始注入 Vue Router");

      // 检查是否是 Vue 项目
      const isVue2 = framework?.toLowerCase() === "vue2";
      const isVue3 = framework?.toLowerCase() === "vue3";

      if (!isVue2 && !isVue3) {
        this.addLog(logs, "⚠️  Vue Router 仅支持 Vue 项目，跳过注入");
        return {
          files,
          packageJson,
          logs,
          success: true,
        };
      }

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加依赖
      const routerVersion = isVue3 ? "^4.2.5" : "^3.6.5";
      this.mergeDependencies(packageJson, {
        "vue-router": routerVersion,
      });

      // 2. 创建路由配置
      const ext = isTypeScript ? "ts" : "js";
      files[`src/router/index.${ext}`] = this.generateRouterConfig(
        isVue3,
        isTypeScript
      );

      // 3. 创建页面组件
      if (!files["src/views/Home.vue"]) {
        files["src/views/Home.vue"] = this.generateHomeView();
      }
      if (!files["src/views/About.vue"]) {
        files["src/views/About.vue"] = this.generateAboutView();
      }

      // 4. 修改 main.ts/js
      const mainFile = `src/main.${ext}`;
      if (files[mainFile]) {
        files[mainFile] = this.injectRouterToMain(
          files[mainFile],
          isVue3,
          isTypeScript
        );
        this.addLog(logs, `更新 ${mainFile}，注册 Vue Router`);
      }

      // 5. 修改 App.vue，添加 <router-view>
      if (files["src/App.vue"]) {
        files["src/App.vue"] = this.updateAppVue(files["src/App.vue"]);
        this.addLog(logs, "更新 App.vue，添加 <router-view>");
      }

      this.addLog(logs, "✅ Vue Router 注入完成");
      this.addLog(logs, `  - 版本: ${routerVersion}`);
      this.addLog(logs, "  - 已创建路由配置");
      this.addLog(logs, "  - 已创建示例页面");

      return {
        files,
        packageJson,
        logs,
        success: true,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `❌ Vue Router 注入失败: ${errorMsg}`);
      return {
        files,
        packageJson,
        logs,
        success: false,
        errors: [errorMsg],
      };
    }
  }

  /**
   * 生成路由配置
   */
  private generateRouterConfig(isVue3: boolean, isTypeScript: boolean): string {
    if (isVue3) {
      return `import { createRouter, createWebHistory${isTypeScript ? ", RouteRecordRaw" : ""} } from 'vue-router'
import Home from '../views/Home.vue'

${isTypeScript ? "const routes: RouteRecordRaw[] = [" : "const routes = ["}
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    name: 'About',
    // 路由懒加载
    component: () => import('../views/About.vue'),
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
`;
    } else {
      // Vue 2
      return `import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home,
  },
  {
    path: '/about',
    name: 'About',
    // 路由懒加载
    component: () => import('../views/About.vue'),
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
`;
    }
  }

  /**
   * 生成 Home 页面
   */
  private generateHomeView(): string {
    return `<template>
  <div class="home">
    <h1>欢迎来到首页</h1>
    <p>这是使用 Vue Router 的示例应用</p>
    <router-link to="/about">前往关于页面</router-link>
  </div>
</template>

<script setup lang="ts">
// 首页逻辑
</script>

<style scoped>
.home {
  padding: 20px;
  text-align: center;
}

a {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

a:hover {
  text-decoration: underline;
}
</style>
`;
  }

  /**
   * 生成 About 页面
   */
  private generateAboutView(): string {
    return `<template>
  <div class="about">
    <h1>关于页面</h1>
    <p>这是一个使用路由懒加载的示例页面</p>
    <router-link to="/">返回首页</router-link>
  </div>
</template>

<script setup lang="ts">
// 关于页面逻辑
</script>

<style scoped>
.about {
  padding: 20px;
  text-align: center;
}

a {
  color: #42b983;
  text-decoration: none;
  font-weight: bold;
}

a:hover {
  text-decoration: underline;
}
</style>
`;
  }

  /**
   * 在 main.ts 中注入 Router
   */
  private injectRouterToMain(
    content: string,
    isVue3: boolean,
    isTypeScript: boolean
  ): string {
    // 添加 import
    if (!content.includes("import router from")) {
      const importLine = "import router from './router'\n";
      const createAppMatch = content.match(/import.*createApp.*from.*vue.*/);
      if (createAppMatch) {
        content = content.replace(
          createAppMatch[0],
          `${createAppMatch[0]}\n${importLine}`
        );
      } else {
        content = importLine + content;
      }
    }

    // 添加 use(router)
    if (isVue3) {
      if (!content.includes(".use(router)")) {
        const mountMatch = content.match(/\.mount\(['"]#app['"]\)/);
        if (mountMatch) {
          content = content.replace(
            mountMatch[0],
            `.use(router)\n${mountMatch[0]}`
          );
        }
      }
    } else {
      // Vue 2
      if (!content.includes("router,")) {
        const vueMatch = content.match(/new Vue\(\{/);
        if (vueMatch) {
          content = content.replace(vueMatch[0], `${vueMatch[0]}\n  router,`);
        }
      }
    }

    return content;
  }

  /**
   * 更新 App.vue
   */
  private updateAppVue(content: string): string {
    // 如果已有 router-view，跳过
    if (content.includes("<router-view")) {
      return content;
    }

    // 在 template 中添加 router-view
    const templateMatch = content.match(/<template>([\s\S]*?)<\/template>/);
    if (templateMatch) {
      const newTemplate = `<template>
  <div id="app">
    <router-view />
  </div>
</template>`;
      content = content.replace(templateMatch[0], newTemplate);
    }

    return content;
  }
}
