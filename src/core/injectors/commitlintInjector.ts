import type { ToolInjector } from "./ToolInjector";

/**
 * Commitlint 工具注入器
 */
export class CommitlintInjector implements ToolInjector {
  name = "commitlint";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    // 确保 devDependencies 存在
    if (!updatedPackageJson.devDependencies) {
      updatedPackageJson.devDependencies = {};
    }

    console.log(`   - 添加 Commitlint 配置`);
    updatedPackageJson.devDependencies["@commitlint/cli"] = "^17.0.0";
    updatedPackageJson.devDependencies["@commitlint/config-conventional"] =
      "^17.0.0";

    // 添加 commitlint 配置文件
    updatedFiles["commitlint.config.js"] = `module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert'
      ]
    ]
  }
};`;

    // 添加 commit-msg hook
    updatedFiles[".husky/commit-msg"] = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
