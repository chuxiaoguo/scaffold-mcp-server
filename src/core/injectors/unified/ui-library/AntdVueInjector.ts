import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Ant Design Vue 注入器
 * 优先级: 50 (UI库层)
 * 支持 Vue 2 的 Ant Design Vue 1.x
 */
export class AntdVueInjector extends AbstractUnifiedInjector {
  name = "antd-vue";
  priority = InjectorPriority.UI_LIBRARY;
  category = InjectorCategory.UI_LIBRARY;

  override dependencies = ["vue2"]; // 依赖 Vue2

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "antd-vue" ||
        tool.toLowerCase() === "ant-design-vue"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, projectName } = context;

    try {
      this.addLog(logs, "开始注入 Ant Design Vue");

      const isVue2 =
        context.framework?.toLowerCase() === "vue2" ||
        context.tools.some((t) => t.toLowerCase() === "vue2");

      // 1. 添加 Ant Design Vue 依赖
      if (isVue2) {
        // Vue 2 使用 ant-design-vue@1.x
        this.mergeDependencies(packageJson, {
          "ant-design-vue": "^1.7.8",
        });
      } else {
        // Vue 3 使用 ant-design-vue@3.x 或更高版本
        this.mergeDependencies(packageJson, {
          "ant-design-vue": "^3.2.20",
        });
      }

      // 2. 更新/生成 main 文件以引入 Ant Design Vue
      const language = context.language || "javascript";
      const mainExt = language === "typescript" ? "ts" : "js";
      const mainFile = `src/main.${mainExt}`;

      // 生成带 Ant Design Vue 的 main 文件
      const mainContent = isVue2
        ? `import Vue from 'vue';
import App from './App.vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

Vue.use(Antd);
Vue.config.productionTip = false;

new Vue({
  render: h => h(App),
}).$mount('#app');
`
        : `import { createApp } from 'vue';
import App from './App.vue';
import Antd from 'ant-design-vue';
import 'ant-design-vue/dist/antd.css';

const app = createApp(App);
app.use(Antd);
app.mount('#app');
`;

      // 如果 main 文件已存在且包含基础 Vue 代码，进行增强；否则创建新文件
      if (files[mainFile] && !files[mainFile].includes("ant-design-vue")) {
        this.addLog(logs, `增强 ${mainFile}，添加 Ant Design Vue`);
        files[mainFile] = mainContent;
      } else if (!files[mainFile]) {
        this.addLog(logs, `创建 ${mainFile}，集成 Ant Design Vue`);
        files[mainFile] = mainContent;
      }

      // 3. 更新/生成 App.vue 使用 Ant Design 组件
      const appVueContent = isVue2
        ? `<template>
  <div id="app">
    <a-config-provider :locale="locale">
      <div class="container">
        <a-card title="${projectName}">
          <p>欢迎使用 Vue 2 + Ant Design Vue 项目！</p>
          <a-button type="primary" @click="handleClick">点击我</a-button>
        </a-card>
      </div>
    </a-config-provider>
  </div>
</template>

<script${language === "typescript" ? ' lang="ts"' : ""}>
${
  language === "typescript"
    ? `import { Component, Vue } from 'vue-property-decorator';
import zhCN from 'ant-design-vue/lib/locale-provider/zh_CN';

@Component
export default class App extends Vue {
  locale = zhCN;

  handleClick() {
    this.$message.success('按钮点击成功！');
  }
}`
    : `import zhCN from 'ant-design-vue/lib/locale-provider/zh_CN';

export default {
  name: 'App',
  data() {
    return {
      locale: zhCN
    }
  },
  methods: {
    handleClick() {
      this.$message.success('按钮点击成功！');
    }
  }
}`
}
</script>

<style scoped>
.container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
`
        : `<template>
  <div id="app">
    <a-config-provider :locale="locale">
      <div class="container">
        <a-card title="${projectName}">
          <p>欢迎使用 Vue 3 + Ant Design Vue 项目！</p>
          <a-button type="primary" @click="handleClick">点击我</a-button>
        </a-card>
      </div>
    </a-config-provider>
  </div>
</template>

<script${language === "typescript" ? ' setup lang="ts"' : " setup"}>
import { ref } from 'vue';
import zhCN from 'ant-design-vue/locale/zh_CN';

const locale = ref(zhCN);

const handleClick = () => {
  message.success('按钮点击成功！');
};
</script>

<style scoped>
.container {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}
</style>
`;

      // 如果 App.vue 已存在且不包含 Ant Design 组件，进行替换；否则创建新文件
      if (files["src/App.vue"] && !files["src/App.vue"].includes("a-card")) {
        this.addLog(logs, "增强 src/App.vue，使用 Ant Design 组件");
        files["src/App.vue"] = appVueContent;
      } else if (!files["src/App.vue"]) {
        this.addLog(logs, "创建 src/App.vue，使用 Ant Design 组件");
        files["src/App.vue"] = appVueContent;
      }

      // 4. 确保 index.html 存在
      if (!files["index.html"]) {
        this.addLog(logs, "创建 index.html");
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
      }

      // 5. 如果使用 TypeScript，添加类型声明
      if (language === "typescript" && !files["src/shims-antd.d.ts"]) {
        files["src/shims-antd.d.ts"] =
          `declare module 'ant-design-vue/lib/locale-provider/zh_CN';
`;
      }

      this.addLog(logs, "✅ Ant Design Vue 注入完成");

      return {
        files,
        packageJson,
        logs,
        success: true,
      };
    } catch (error) {
      this.addLog(logs, `❌ Ant Design Vue 注入失败: ${error}`);
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
