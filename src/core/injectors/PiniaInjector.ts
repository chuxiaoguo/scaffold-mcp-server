import type { ToolInjector } from "./ToolInjector";

/**
 * Pinia 工具注入器（Vue3 状态管理）
 */
export class PiniaInjector implements ToolInjector {
  name = "pinia";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    if (!updatedPackageJson.dependencies) updatedPackageJson.dependencies = {};

    console.log("   - 添加 Pinia 依赖");
    updatedPackageJson.dependencies["pinia"] = "^2.1.7";

    // 提供一个基础 store 文件，不修改入口
    updatedFiles["src/store/README.md"] = `# Pinia Store
如需启用 Pinia，请在 Vue3 项目入口：\n\nimport { createPinia } from 'pinia'\napp.use(createPinia())`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}