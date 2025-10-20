import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class LintStagedInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // lint-staged 依赖
    result.devDependencies!['lint-staged'] = '^15.2.2';

    // 生成 lint-staged 配置
    result.files['.lintstagedrc.js'] = this.generateLintStagedConfig(techStack);

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // lint-staged 通常与 husky 一起使用，对代码质量有要求的项目推荐使用
    return true;
  }

  private generateLintStagedConfig(techStack: TechStack): string {
    const config: Record<string, string[]> = {};

    // JavaScript/TypeScript 文件
    const jsExtensions = techStack.language === 'typescript' 
      ? ['*.{js,jsx,ts,tsx}', '**/*.{js,jsx,ts,tsx}']
      : ['*.{js,jsx}', '**/*.{js,jsx}'];

    if (techStack.framework === 'vue3') {
      jsExtensions.push('*.vue', '**/*.vue');
    }

    config[jsExtensions.join(',')] = [
      'eslint --fix',
      'prettier --write'
    ];

    // 样式文件
    if (techStack.style) {
      const styleExtensions = this.getStyleExtensions(techStack);
      config[styleExtensions] = [
        'stylelint --fix',
        'prettier --write'
      ];
    }

    // JSON 和 Markdown 文件
    config['*.{json,md}'] = ['prettier --write'];

    return `module.exports = ${JSON.stringify(config, null, 2)};`;
  }

  private getStyleExtensions(techStack: TechStack): string {
    const extensions = ['*.css', '**/*.css'];
    
    if (techStack.style === 'sass') {
      extensions.push('*.{scss,sass}', '**/*.{scss,sass}');
    }
    
    if (techStack.style === 'less') {
      extensions.push('*.less', '**/*.less');
    }
    
    if (techStack.framework === 'vue3') {
      // Vue 文件的样式部分会被 ESLint 处理
      return extensions.join(',');
    }
    
    return extensions.join(',');
  }
}