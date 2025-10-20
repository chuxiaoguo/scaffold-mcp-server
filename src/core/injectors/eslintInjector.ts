import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class EslintInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // 基础 ESLint 依赖
    result.devDependencies!['eslint'] = '^8.57.0';

    // 根据技术栈添加相应的配置和依赖
    if (techStack.framework === 'vue3') {
      result.devDependencies!['@vue/eslint-config-typescript'] = '^12.0.0';
      result.devDependencies!['vue-eslint-parser'] = '^9.4.2';
      result.devDependencies!['eslint-plugin-vue'] = '^9.20.1';
    } else if (techStack.framework === 'react') {
      result.devDependencies!['@typescript-eslint/eslint-plugin'] = '^6.21.0';
      result.devDependencies!['@typescript-eslint/parser'] = '^6.21.0';
      result.devDependencies!['eslint-plugin-react'] = '^7.33.2';
      result.devDependencies!['eslint-plugin-react-hooks'] = '^4.6.0';
    }

    if (techStack.language === 'typescript') {
      result.devDependencies!['@typescript-eslint/eslint-plugin'] = '^6.21.0';
      result.devDependencies!['@typescript-eslint/parser'] = '^6.21.0';
    }

    // 生成 ESLint 配置文件
    result.files['.eslintrc.js'] = this.generateEslintConfig(techStack);
    result.files['.eslintignore'] = this.generateEslintIgnore();

    // 添加脚本
    result.scripts!['lint'] = 'eslint . --ext .js,.jsx,.ts,.tsx,.vue --fix';
    result.scripts!['lint:check'] = 'eslint . --ext .js,.jsx,.ts,.tsx,.vue';

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // ESLint 对所有项目都是推荐的
    return true;
  }

  private generateEslintConfig(techStack: TechStack): string {
    const config: any = {
      env: {
        browser: true,
        es2021: true,
        node: true
      },
      extends: [],
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      plugins: [],
      rules: {
        'no-console': 'warn',
        'no-debugger': 'warn',
        'no-unused-vars': 'warn',
        'prefer-const': 'error',
        'no-var': 'error'
      }
    };

    if (techStack.language === 'typescript') {
      config.parser = '@typescript-eslint/parser';
      config.extends.push('@typescript-eslint/recommended');
      config.plugins.push('@typescript-eslint');
      config.parserOptions.parser = '@typescript-eslint/parser';
      
      // TypeScript 特定规则
      config.rules['@typescript-eslint/no-unused-vars'] = 'warn';
      config.rules['@typescript-eslint/no-explicit-any'] = 'warn';
      config.rules['@typescript-eslint/explicit-function-return-type'] = 'off';
    }

    if (techStack.framework === 'vue3') {
      config.parser = 'vue-eslint-parser';
      config.extends.push(
        'plugin:vue/vue3-essential',
        'plugin:vue/vue3-strongly-recommended',
        'plugin:vue/vue3-recommended'
      );
      config.plugins.push('vue');
      
      if (techStack.language === 'typescript') {
        config.extends.push('@vue/typescript/recommended');
        config.parserOptions.parser = '@typescript-eslint/parser';
      }
    } else if (techStack.framework === 'react') {
      config.extends.push(
        'plugin:react/recommended',
        'plugin:react-hooks/recommended'
      );
      config.plugins.push('react', 'react-hooks');
      config.parserOptions.ecmaFeatures = { jsx: true };
      config.settings = {
        react: {
          version: 'detect'
        }
      };
      
      // React 特定规则
      config.rules['react/react-in-jsx-scope'] = 'off'; // React 17+ 不需要
      config.rules['react/prop-types'] = 'off'; // 使用 TypeScript 时关闭
    }

    return `module.exports = ${JSON.stringify(config, null, 2)};`;
  }

  private generateEslintIgnore(): string {
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

# Temporary files
*.tmp
*.temp
`;
  }
}