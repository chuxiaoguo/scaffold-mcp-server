import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class HuskyInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // Husky 依赖
    result.devDependencies!['husky'] = '^9.0.11';

    // 生成 Husky 配置文件
    result.files['.husky/pre-commit'] = this.generatePreCommitHook();
    result.files['.husky/commit-msg'] = this.generateCommitMsgHook();
    result.files['.husky/pre-push'] = this.generatePrePushHook();

    // 添加脚本
    result.scripts!['prepare'] = 'husky install';

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // Husky 对需要代码质量控制的项目很有用
    return true;
  }

  private generatePreCommitHook(): string {
    return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 运行 lint-staged 进行代码检查和格式化
npx lint-staged

# 运行类型检查（如果是 TypeScript 项目）
if [ -f "tsconfig.json" ]; then
  echo "Running TypeScript type check..."
  npx tsc --noEmit
fi
`;
  }

  private generateCommitMsgHook(): string {
    return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# 检查提交信息格式（如果安装了 commitlint）
if command -v npx >/dev/null 2>&1 && npx --help | grep -q commitlint; then
  npx --no-install commitlint --edit "$1"
fi
`;
  }

  private generatePrePushHook(): string {
    return `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

echo "Running pre-push checks..."

# 运行测试
if [ -f "package.json" ] && grep -q '"test"' package.json; then
  echo "Running tests..."
  npm run test
fi

# 运行构建检查
if [ -f "package.json" ] && grep -q '"build"' package.json; then
  echo "Running build check..."
  npm run build
fi

echo "Pre-push checks completed successfully!"
`;
  }
}