import type { ToolInjector } from "./ToolInjector";

/**
 * Vitest 工具注入器
 */
export class VitestInjector implements ToolInjector {
  name = "vitest";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    if (!updatedPackageJson.devDependencies) updatedPackageJson.devDependencies = {};
    if (!updatedPackageJson.scripts) updatedPackageJson.scripts = {};

    console.log("   - 添加 Vitest 测试依赖与脚本");
    updatedPackageJson.devDependencies["vitest"] = "^1.6.0";
    updatedPackageJson.scripts["test:unit"] = "vitest";
    updatedPackageJson.scripts["test:unit:watch"] = "vitest --watch";

    // 最简 vitest 配置
    updatedFiles["vitest.config.ts"] = `import { defineConfig } from 'vitest/config';
export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
  }
});`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}