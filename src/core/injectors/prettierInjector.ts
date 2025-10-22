import type { ToolInjector } from "./ToolInjector";

/**
 * Prettier 工具注入器
 */
export class PrettierInjector implements ToolInjector {
  name = "prettier";

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

    console.log(`   - 添加 Prettier 配置`);
    updatedPackageJson.devDependencies["prettier"] = "^3.0.0";
    updatedPackageJson.scripts["format"] = "prettier --write .";
    updatedPackageJson.scripts["format:check"] = "prettier --check .";

    // 添加 Prettier 配置文件
    updatedFiles[".prettierrc"] = JSON.stringify(
      {
        semi: true,
        trailingComma: "es5",
        singleQuote: true,
        printWidth: 80,
        tabWidth: 2,
      },
      null,
      2
    );

    updatedFiles[".prettierignore"] = `node_modules/
dist/
build/
*.min.js
*.min.css`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
