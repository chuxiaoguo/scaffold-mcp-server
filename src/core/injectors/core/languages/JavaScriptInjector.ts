import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * JavaScript 语言注入器
 * 负责配置 JavaScript 相关的文件和依赖
 */
export class JavaScriptInjector extends AbstractCoreInjector {
  name = 'javascript-language';
  priority = 2; // 语言注入器优先级，在基础注入器之后，框架注入器之前
  type = InjectorType.LANGUAGE;

  canHandle(techStack: TechStack): boolean {
    return techStack.language === 'javascript';
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, files, packageJson, logs } = context;
    
    this.addLog(logs, '配置 JavaScript 支持');

    // 生成 Babel 配置文件（如果需要）
    if (this.needsBabelConfig(techStack)) {
      files['.babelrc'] = this.generateBabelConfig(techStack);
    }

    // 生成 JSConfig 文件（用于 VS Code 智能提示）
    files['jsconfig.json'] = this.generateJsConfig();

    // 添加 Babel 依赖（如果需要）
    if (this.needsBabelConfig(techStack)) {
      this.addBabelDependencies(packageJson, techStack);
    }

    this.addLog(logs, 'JavaScript 配置完成');

    return { files, packageJson, logs };
  }

  private needsBabelConfig(techStack: TechStack): boolean {
    // 如果使用 Webpack 或者是 React 项目，需要 Babel 配置
    return techStack.builder === 'webpack' || techStack.framework === 'react';
  }

  private generateBabelConfig(techStack: TechStack): string {
    const { framework } = techStack;
    
    const presets = ['@babel/preset-env'];
    
    if (framework === 'react') {
      presets.push('@babel/preset-react');
    }

    return JSON.stringify({
      presets,
      plugins: []
    }, null, 2);
  }

  private generateJsConfig(): string {
    return JSON.stringify({
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        allowJs: true,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        module: 'ESNext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        baseUrl: '.',
        paths: {
          '@/*': ['src/*']
        }
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    }, null, 2);
  }

  private addBabelDependencies(packageJson: any, techStack: TechStack): void {
    const { framework } = techStack;
    
    const devDeps: Record<string, string> = {
      '@babel/core': '^7.0.0',
      '@babel/preset-env': '^7.0.0'
    };

    if (framework === 'react') {
      devDeps['@babel/preset-react'] = '^7.0.0';
    }

    this.mergeDependencies(packageJson, devDeps);
  }
}