import type { ToolInjector } from "./ToolInjector";

/**
 * Ant Design 工具注入器（React UI 库）
 */
export class AntdInjector implements ToolInjector {
  name = "antd";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    if (!updatedPackageJson.dependencies) updatedPackageJson.dependencies = {};

    console.log("   - 添加 Ant Design 依赖");
    updatedPackageJson.dependencies["antd"] = "^5.14.0";

    updatedFiles["docs/ui-antd.md"] = `# Ant Design
此项目包含 Ant Design 依赖。
如需在 React 项目中启用，请在入口文件中引入样式：\n\nimport 'antd/dist/reset.css';`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}