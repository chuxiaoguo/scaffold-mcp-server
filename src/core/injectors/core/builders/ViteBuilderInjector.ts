import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * Vite 构建工具注入器
 * 负责配置 Vite 构建工具相关的文件和依赖
 */
export class ViteBuilderInjector extends AbstractCoreInjector {
  name = 'vite-builder';
  priority = 4; // 构建工具注入器优先级
  type = InjectorType.BUILDER;

  canHandle(techStack: TechStack): boolean {
    return techStack.builder === 'vite';
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, files, packageJson, logs } = context;
    
    this.addLog(logs, '配置 Vite 构建工具');

    // 生成 Vite 配置文件
    files['vite.config.js'] = this.generateViteConfig(techStack);

    // 添加 Vite 依赖
    this.mergeDependencies(packageJson, {
      'vite': '^4.0.0'
    });

    // 添加框架特定的 Vite 插件
    this.addFrameworkPlugins(packageJson, techStack);

    // 添加构建脚本
    this.mergeScripts(packageJson, {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    });

    this.addLog(logs, 'Vite 构建工具配置完成');

    return { files, packageJson, logs };
  }

  private generateViteConfig(techStack: TechStack): string {
    const { framework, language } = techStack;
    const isTypeScript = language === 'typescript';
    
    let imports = '';
    let plugins = '';

    // 根据框架添加相应的插件
    switch (framework) {
      case 'vue2':
        imports = "import { createVuePlugin } from 'vite-plugin-vue2'";
        plugins = 'createVuePlugin()';
        break;
      case 'vue3':
        imports = "import vue from '@vitejs/plugin-vue'";
        plugins = 'vue()';
        break;
      case 'react':
        imports = "import react from '@vitejs/plugin-react'";
        plugins = 'react()';
        break;
      default:
        plugins = '';
    }

    return `import { defineConfig } from 'vite'
${imports}

export default defineConfig({
  plugins: [${plugins}],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }${isTypeScript ? ',\n  resolve: {\n    alias: {\n      \'@\': path.resolve(__dirname, \'src\')\n    }\n  }' : ''}
})`;
  }

  private addFrameworkPlugins(packageJson: any, techStack: TechStack): void {
    const { framework, language } = techStack;
    const devDeps: Record<string, string> = {};

    switch (framework) {
      case 'vue2':
        devDeps['vite-plugin-vue2'] = '^2.0.0';
        break;
      case 'vue3':
        devDeps['@vitejs/plugin-vue'] = '^4.0.0';
        break;
      case 'react':
        devDeps['@vitejs/plugin-react'] = '^4.0.0';
        break;
    }

    // 如果使用 TypeScript，添加相关依赖
    if (language === 'typescript') {
      devDeps['@types/node'] = '^20.0.0';
    }

    this.mergeDependencies(packageJson, devDeps);
  }
}