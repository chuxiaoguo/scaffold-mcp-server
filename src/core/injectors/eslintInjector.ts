import type { ToolInjector } from "./ToolInjector";

/**
 * ESLint 工具注入器
 */
export class ESLintInjector implements ToolInjector {
  name = "eslint";

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

    console.log(`   - 添加 ESLint 配置`);
    updatedPackageJson.devDependencies["eslint"] = "^8.0.0";
    updatedPackageJson.devDependencies["@typescript-eslint/eslint-plugin"] =
      "^6.0.0";
    updatedPackageJson.devDependencies["@typescript-eslint/parser"] = "^6.0.0";
    updatedPackageJson.scripts["lint"] = "eslint . --ext .ts,.tsx,.js,.jsx";
    updatedPackageJson.scripts["lint:fix"] =
      "eslint . --ext .ts,.tsx,.js,.jsx --fix";

    // 添加 ESLint 配置文件
    updatedFiles[".eslintrc.json"] = JSON.stringify(
      {
        extends: ["eslint:recommended", "@typescript-eslint/recommended"],
        parser: "@typescript-eslint/parser",
        plugins: ["@typescript-eslint"],
        root: true,
        env: {
          node: true,
          browser: true,
        },
        rules: {
          "@typescript-eslint/no-unused-vars": "warn",
          "@typescript-eslint/no-explicit-any": "warn",
        },
      },
      null,
      2
    );

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
