import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class EditorConfigInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // 生成 .editorconfig 文件
    result.files['.editorconfig'] = this.generateEditorConfig(techStack);

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // .editorconfig 对所有项目都是推荐的
    return true;
  }

  private generateEditorConfig(techStack: TechStack): string {
    const config: string[] = [];

    config.push('# EditorConfig is awesome: https://EditorConfig.org');
    config.push('');
    config.push('# top-most EditorConfig file');
    config.push('root = true');
    config.push('');

    // 通用配置
    config.push('# All files');
    config.push('[*]');
    config.push('charset = utf-8');
    config.push('end_of_line = lf');
    config.push('insert_final_newline = true');
    config.push('trim_trailing_whitespace = true');
    config.push('indent_style = space');
    config.push('indent_size = 2');
    config.push('');

    // JavaScript/TypeScript 文件
    const jsExtensions = techStack.language === 'typescript' 
      ? '*.{js,jsx,ts,tsx}'
      : '*.{js,jsx}';
    
    config.push(`# JavaScript/TypeScript files`);
    config.push(`[${jsExtensions}]`);
    config.push('indent_style = space');
    config.push('indent_size = 2');
    config.push('');

    // Vue 文件
    if (techStack.framework === 'vue3') {
      config.push('# Vue files');
      config.push('[*.vue]');
      config.push('indent_style = space');
      config.push('indent_size = 2');
      config.push('');
    }

    // 样式文件
    if (techStack.style) {
      const styleExtensions = this.getStyleExtensions(techStack);
      config.push('# Style files');
      config.push(`[${styleExtensions}]`);
      config.push('indent_style = space');
      config.push('indent_size = 2');
      config.push('');
    }

    // JSON 文件
    config.push('# JSON files');
    config.push('[*.json]');
    config.push('indent_style = space');
    config.push('indent_size = 2');
    config.push('');

    // Markdown 文件
    config.push('# Markdown files');
    config.push('[*.md]');
    config.push('trim_trailing_whitespace = false');
    config.push('');

    // YAML 文件
    config.push('# YAML files');
    config.push('[*.{yml,yaml}]');
    config.push('indent_style = space');
    config.push('indent_size = 2');

    return config.join('\n');
  }

  private getStyleExtensions(techStack: TechStack): string {
    const extensions = ['css'];
    
    if (techStack.style === 'sass') {
      extensions.push('scss', 'sass');
    }
    
    if (techStack.style === 'less') {
      extensions.push('less');
    }
    
    return `*.{${extensions.join(',')}}`;
  }
}