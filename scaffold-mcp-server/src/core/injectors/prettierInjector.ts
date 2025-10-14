import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class PrettierInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // 基础 Prettier 依赖
    result.devDependencies!['prettier'] = '^3.2.5';
    result.devDependencies!['eslint-config-prettier'] = '^9.1.0';
    result.devDependencies!['eslint-plugin-prettier'] = '^5.1.3';

    // 生成 Prettier 配置文件
    result.files['.prettierrc'] = this.generatePrettierConfig(techStack);
    result.files['.prettierignore'] = this.generatePrettierIgnore();

    // 添加脚本
    result.scripts!['format'] = 'prettier --write "src/**/*.{js,jsx,ts,tsx,vue,json,css,scss,md}"';
    result.scripts!['format:check'] = 'prettier --check "src/**/*.{js,jsx,ts,tsx,vue,json,css,scss,md}"';

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // Prettier 对所有项目都是推荐的
    return true;
  }

  private generatePrettierConfig(techStack: TechStack): string {
    const config = {
      semi: true,
      trailingComma: 'es5' as const,
      singleQuote: true,
      printWidth: 100,
      tabWidth: 2,
      useTabs: false,
      bracketSpacing: true,
      arrowParens: 'avoid' as const,
      endOfLine: 'lf' as const,
      ...(techStack.framework === 'vue3' && {
        vueIndentScriptAndStyle: false
      })
    };

    return JSON.stringify(config, null, 2);
  }

  private generatePrettierIgnore(): string {
    return `# Dependencies
node_modules/

# Build outputs
dist/
build/
out/

# Environment files
.env
.env.local
.env.*.local

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Coverage
coverage/
*.lcov

# Package files
package-lock.json
yarn.lock
pnpm-lock.yaml

# Temporary files
*.tmp
*.temp

# Generated files
*.d.ts
`;
  }
}