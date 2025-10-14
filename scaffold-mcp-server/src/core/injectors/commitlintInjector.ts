import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class CommitlintInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // Commitlint 依赖
    result.devDependencies!['@commitlint/cli'] = '^18.6.1';
    result.devDependencies!['@commitlint/config-conventional'] = '^18.6.2';

    // 生成 Commitlint 配置文件
    result.files['commitlint.config.js'] = this.generateCommitlintConfig();

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // Commitlint 对团队协作项目很有用
    return false; // 默认不强制，可选
  }

  private generateCommitlintConfig(): string {
    const config = {
      extends: ['@commitlint/config-conventional'],
      rules: {
        'type-enum': [
          2,
          'always',
          [
            'feat',     // 新功能
            'fix',      // 修复
            'docs',     // 文档
            'style',    // 格式（不影响代码运行的变动）
            'refactor', // 重构
            'perf',     // 性能优化
            'test',     // 增加测试
            'chore',    // 构建过程或辅助工具的变动
            'revert',   // 回滚
            'build',    // 构建系统或外部依赖项的更改
            'ci'        // CI 配置文件和脚本的更改
          ]
        ],
        'type-case': [2, 'always', 'lower-case'],
        'type-empty': [2, 'never'],
        'scope-case': [2, 'always', 'lower-case'],
        'subject-case': [2, 'never', ['sentence-case', 'start-case', 'pascal-case', 'upper-case']],
        'subject-empty': [2, 'never'],
        'subject-full-stop': [2, 'never', '.'],
        'header-max-length': [2, 'always', 100],
        'body-leading-blank': [1, 'always'],
        'body-max-line-length': [2, 'always', 100],
        'footer-leading-blank': [1, 'always'],
        'footer-max-line-length': [2, 'always', 100]
      }
    };

    return `module.exports = ${JSON.stringify(config, null, 2)};`;
  }
}