import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * TypeScript 语言注入器
 * 负责配置 TypeScript 相关的文件和依赖
 */
export class TypeScriptInjector extends AbstractCoreInjector {
  name = 'typescript-language';
  priority = 2; // 语言注入器优先级，在基础注入器之后，框架注入器之前
  type = InjectorType.LANGUAGE;

  canHandle(techStack: TechStack): boolean {
    return techStack.language === 'typescript';
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, files, packageJson, logs } = context;
    
    this.addLog(logs, '配置 TypeScript 支持');

    // 生成 TypeScript 配置文件
    files['tsconfig.json'] = this.generateTsConfig(techStack);

    // 添加 TypeScript 依赖
    this.mergeDependencies(packageJson, {
      'typescript': '^5.0.0'
    });

    // 根据框架添加特定的类型定义
    this.addFrameworkTypes(packageJson, techStack);

    this.addLog(logs, 'TypeScript 配置完成');

    return { files, packageJson, logs };
  }

  private generateTsConfig(techStack: TechStack): string {
    const { framework } = techStack;
    
    const baseConfig: any = {
      compilerOptions: {
        target: 'ES2020',
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        allowJs: false,
        skipLibCheck: true,
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
        forceConsistentCasingInFileNames: true,
        module: 'ESNext',
        moduleResolution: 'node',
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        declaration: false,
        declarationMap: false,
        sourceMap: true,
        baseUrl: '.',
        paths: {
          '@/*': ['src/*']
        }
      },
      include: ['src/**/*'],
      exclude: ['node_modules', 'dist']
    };

    // 根据框架调整配置
    switch (framework) {
      case 'vue2':
      case 'vue3':
        baseConfig.compilerOptions.jsx = 'preserve';
        baseConfig.include.push('*.vue');
        break;
      case 'react':
        baseConfig.compilerOptions.jsx = 'react-jsx';
        break;
    }

    return JSON.stringify(baseConfig, null, 2);
  }

  private addFrameworkTypes(packageJson: any, techStack: TechStack): void {
    const { framework } = techStack;
    const devDeps: Record<string, string> = {
      '@types/node': '^20.0.0'
    };

    switch (framework) {
      case 'vue2':
        devDeps['@types/vue'] = '^2.0.0';
        break;
      case 'vue3':
        // Vue 3 自带类型定义
        break;
      case 'react':
        devDeps['@types/react'] = '^18.2.0';
        devDeps['@types/react-dom'] = '^18.2.0';
        break;
    }

    this.mergeDependencies(packageJson, devDeps);
  }
}