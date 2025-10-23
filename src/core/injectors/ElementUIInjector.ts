import type { ToolInjector } from "./ToolInjector";

/**
 * Element UI 工具注入器
 */
export class ElementUIInjector implements ToolInjector {
  name = "element-ui";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    // 确保 dependencies 存在
    if (!updatedPackageJson.dependencies) {
      updatedPackageJson.dependencies = {};
    }

    // 确保 devDependencies 存在
    if (!updatedPackageJson.devDependencies) {
      updatedPackageJson.devDependencies = {};
    }

    console.log(`   - 添加 Element UI`);

    // 添加 Element UI 依赖
    updatedPackageJson.dependencies["element-ui"] = "^2.15.14";

    // 如果是 Vue 2 项目，添加 Element UI 的正确导入
    if (
      updatedPackageJson.dependencies["vue"] &&
      updatedPackageJson.dependencies["vue"].startsWith("^2")
    ) {
      // 修改 main.js 文件以引入 Element UI
      if (updatedFiles["src/main.js"]) {
        const mainJsContent = updatedFiles["src/main.js"];
        // 在 Vue 导入之后，Vue 实例之前添加 Element UI 的引入和使用
        const modifiedMainJs = mainJsContent
          .replace(
            "import Vue from 'vue'\nimport App from './App.vue'",
            "import Vue from 'vue'\nimport App from './App.vue'\nimport ElementUI from 'element-ui'\nimport 'element-ui/lib/theme-chalk/index.css'"
          )
          .replace(
            "Vue.config.productionTip = false\n\nnew Vue({",
            "Vue.config.productionTip = false\n\nVue.use(ElementUI)\n\nnew Vue({"
          );
        updatedFiles["src/main.js"] = modifiedMainJs;
      }

      // 修改 App.vue 文件以添加 Element UI 示例
      if (updatedFiles["src/App.vue"]) {
        const appVueContent = updatedFiles["src/App.vue"];
        // 在模板中添加 Element UI 组件示例
        const modifiedAppVue = appVueContent
          .replace(
            '<template>\n  <div id="app">\n    <h1>{{ title }}</h1>\n    <p>欢迎使用 Vue 2 项目！</p>\n  </div>\n</template>',
            '<template>\n  <div id="app">\n    <el-container>\n      <el-header>\n        <h1>{{ title }}</h1>\n      </el-header>\n      <el-main>\n        <p>欢迎使用 Vue 2 项目！</p>\n        <el-button type="primary">Element UI 按钮</el-button>\n      </el-main>\n    </el-container>\n  </div>\n</template>'
          )
          .replace(
            "<style scoped>\n#app {\n  font-family: Avenir, Helvetica, Arial, sans-serif;\n  text-align: center;\n  color: #2c3e50;\n  margin-top: 60px;\n}\n</style>",
            "<style scoped>\n#app {\n  font-family: Avenir, Helvetica, Arial, sans-serif;\n  text-align: center;\n  color: #2c3e50;\n  margin-top: 60px;\n}\n</style>"
          );
        updatedFiles["src/App.vue"] = modifiedAppVue;
      }
    }

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
