import type { ToolInjector } from "./ToolInjector";

/**
 * Element Plus 工具注入器（Vue3 UI 库）
 */
export class ElementPlusInjector implements ToolInjector {
  name = "element-plus";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    if (!updatedPackageJson.dependencies) updatedPackageJson.dependencies = {};

    console.log("   - 添加 Element Plus 依赖");
    updatedPackageJson.dependencies["element-plus"] = "^2.7.0";

    // 生成一个简单的使用说明文件，避免侵入框架入口
    updatedFiles["docs/ui-element-plus.md"] = `# Element Plus
此项目包含 Element Plus UI 库依赖。
如需在 Vue3 项目中启用，请在 main.ts 中按需或全量引入。`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}