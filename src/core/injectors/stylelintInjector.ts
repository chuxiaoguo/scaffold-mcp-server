import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class StylelintInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // 基础 Stylelint 依赖
    result.devDependencies!['stylelint'] = '^16.2.1';
    result.devDependencies!['stylelint-config-standard'] = '^36.0.0';

    // 根据样式预处理器添加相应配置
    if (techStack.style === 'sass') {
      result.devDependencies!['stylelint-config-standard-scss'] = '^13.0.0';
      result.devDependencies!['stylelint-scss'] = '^6.1.0';
    }

    if (techStack.framework === 'vue3') {
      result.devDependencies!['stylelint-config-standard-vue'] = '^1.0.0';
    }

    // 生成 Stylelint 配置文件
    result.files['.stylelintrc.js'] = this.generateStylelintConfig(techStack);
    result.files['.stylelintignore'] = this.generateStylelintIgnore();

    // 添加脚本
    const extensions = this.getStyleExtensions(techStack);
    result.scripts!['lint:style'] = `stylelint "src/**/*.{${extensions}}" --fix`;
    result.scripts!['lint:style:check'] = `stylelint "src/**/*.{${extensions}}"`;

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // 当项目使用 CSS 预处理器或有样式文件时推荐使用
    return techStack.style !== undefined;
  }

  private generateStylelintConfig(techStack: TechStack): string {
    const config: any = {
      extends: ['stylelint-config-standard'],
      plugins: [],
      rules: {
        'selector-class-pattern': null,
        'custom-property-pattern': null,
        'keyframes-name-pattern': null,
        'at-rule-no-unknown': null,
        'no-descending-specificity': null
      }
    };

    if (techStack.style === 'sass') {
      config.extends.push('stylelint-config-standard-scss');
      config.plugins.push('stylelint-scss');
      config.rules['scss/at-rule-no-unknown'] = true;
    }

    if (techStack.framework === 'vue3') {
      config.extends.push('stylelint-config-standard-vue');
      config.overrides = [
        {
          files: ['*.vue', '**/*.vue'],
          customSyntax: 'postcss-html'
        }
      ];
    }

    return `module.exports = ${JSON.stringify(config, null, 2)};`;
  }

  private generateStylelintIgnore(): string {
    return `# Dependencies
node_modules/

# Build outputs
dist/
build/
out/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db

# Logs
*.log

# Coverage
coverage/

# Temporary files
*.tmp
*.temp
`;
  }

  private getStyleExtensions(techStack: TechStack): string {
    const extensions = ['css'];
    
    if (techStack.style === 'sass') {
      extensions.push('scss', 'sass');
    }
    
    if (techStack.style === 'less') {
      extensions.push('less');
    }
    
    if (techStack.framework === 'vue3') {
      extensions.push('vue');
    }
    
    return extensions.join(',');
  }
}