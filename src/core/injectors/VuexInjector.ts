import type { ToolInjector } from "./ToolInjector";

/**
 * Vuex 工具注入器（Vue2/Vue3 状态管理）
 */
export class VuexInjector implements ToolInjector {
  name = "vuex";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    if (!updatedPackageJson.dependencies) updatedPackageJson.dependencies = {};

    console.log("   - 添加 Vuex 依赖");
    updatedPackageJson.dependencies["vuex"] = "^4.1.0";

    updatedFiles["src/store/vuex-README.md"] = `# Vuex Store
如需启用 Vuex，请在项目入口创建并注册 store。`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}