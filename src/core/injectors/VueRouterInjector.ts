import type { ToolInjector } from "./ToolInjector";

/**
 * Vue Router 工具注入器
 */
export class VueRouterInjector implements ToolInjector {
  name = "vue-router";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    if (!updatedPackageJson.dependencies) updatedPackageJson.dependencies = {};

    console.log("   - 添加 Vue Router 依赖");
    updatedPackageJson.dependencies["vue-router"] = "^4.3.0";

    updatedFiles["src/router/README.md"] = `# Vue Router
如需启用 Vue Router，请在入口创建并注册路由。`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}