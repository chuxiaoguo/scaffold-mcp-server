import type { ToolInjector } from "./ToolInjector";

/**
 * Husky 工具注入器
 */
export class HuskyInjector implements ToolInjector {
  name = "husky";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    // 确保 devDependencies 存在
    if (!updatedPackageJson.devDependencies) {
      updatedPackageJson.devDependencies = {};
    }

    // 确保 scripts 存在
    if (!updatedPackageJson.scripts) {
      updatedPackageJson.scripts = {};
    }

    console.log(`   - 添加 Husky Git hooks`);
    updatedPackageJson.devDependencies["husky"] = "^8.0.0";
    updatedPackageJson.devDependencies["lint-staged"] = "^13.0.0";
    updatedPackageJson.scripts["prepare"] = "husky install";

    // 添加 lint-staged 配置
    updatedPackageJson["lint-staged"] = {
      "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
      "*.{json,md}": ["prettier --write"],
    };

    // 添加 pre-commit hook
    updatedFiles[".husky/pre-commit"] = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
