import type { ToolInjector } from "./ToolInjector";

/**
 * React Router 工具注入器
 */
export class ReactRouterInjector implements ToolInjector {
  name = "react-router";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    if (!updatedPackageJson.dependencies) updatedPackageJson.dependencies = {};

    console.log("   - 添加 React Router DOM 依赖");
    // 实际依赖为 react-router-dom
    updatedPackageJson.dependencies["react-router-dom"] = "^6.27.0";

    updatedFiles["src/router/react-router-README.md"] = `# React Router
如需启用 React Router，请在应用中使用 BrowserRouter 进行配置。`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}