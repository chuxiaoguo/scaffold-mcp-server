import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * Webpack 构建工具注入器
 * 负责配置 Webpack 构建工具相关的文件和依赖
 */
export class WebpackBuilderInjector extends AbstractCoreInjector {
  name = 'webpack-builder';
  priority = 4; // 构建工具注入器优先级
  type = InjectorType.BUILDER;

  canHandle(techStack: TechStack): boolean {
    return techStack.builder === 'webpack';
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, files, packageJson, logs } = context;
    
    this.addLog(logs, '配置 Webpack 构建工具');

    // 生成 Webpack 配置文件
    files['webpack.config.js'] = this.generateWebpackConfig(techStack);

    // 添加 Webpack 依赖
    this.addWebpackDependencies(packageJson, techStack);

    // 添加构建脚本
    this.mergeScripts(packageJson, {
      'dev': 'webpack serve --mode development',
      'build': 'webpack --mode production',
      'start': 'webpack serve --mode development --open'
    });

    this.addLog(logs, 'Webpack 构建工具配置完成');

    return { files, packageJson, logs };
  }

  private generateWebpackConfig(techStack: TechStack): string {
    const { framework, language } = techStack;
    const isTypeScript = language === 'typescript';
    
    let rules = '';
    let plugins = '';
    let entry = './src/main.js';

    // 根据语言设置入口文件
    if (isTypeScript) {
      entry = framework === 'react' ? './src/main.tsx' : './src/main.ts';
    } else {
      entry = framework === 'react' ? './src/main.jsx' : './src/main.js';
    }

    // 根据框架配置规则和插件
    switch (framework) {
      case 'vue2':
        rules = this.getVue2Rules(isTypeScript);
        plugins = this.getVue2Plugins();
        break;
      case 'vue3':
        rules = this.getVue3Rules(isTypeScript);
        plugins = this.getVue3Plugins();
        break;
      case 'react':
        rules = this.getReactRules(isTypeScript);
        plugins = this.getReactPlugins();
        break;
      default:
        rules = this.getBasicRules(isTypeScript);
        plugins = this.getBasicPlugins();
    }

    return `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
${framework && framework.startsWith('vue') ? "const { VueLoaderPlugin } = require('vue-loader');" : ''}

module.exports = {
  entry: '${entry}',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].[contenthash].js',
    clean: true
  },
  module: {
    rules: [
${rules}
    ]
  },
  plugins: [
${plugins}
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  devServer: {
    port: 3000,
    open: true,
    hot: true
  }
};`;
  }

  private getVue2Rules(isTypeScript: boolean): string {
    let rules = `      {
        test: /\\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\\.css$/,
        use: ['vue-style-loader', 'css-loader']
      },
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }`;

    if (isTypeScript) {
      rules += `,
      {
        test: /\\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\\.vue$/]
        }
      }`;
    }

    return rules;
  }

  private getVue3Rules(isTypeScript: boolean): string {
    let rules = `      {
        test: /\\.vue$/,
        loader: 'vue-loader'
      },
      {
        test: /\\.css$/,
        use: ['vue-style-loader', 'css-loader']
      },
      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      }`;

    if (isTypeScript) {
      rules += `,
      {
        test: /\\.ts$/,
        loader: 'ts-loader',
        options: {
          appendTsSuffixTo: [/\\.vue$/]
        }
      }`;
    }

    return rules;
  }

  private getReactRules(isTypeScript: boolean): string {
    const extensions = isTypeScript ? '[".js", ".jsx", ".ts", ".tsx"]' : '[".js", ".jsx"]';
    const presets = isTypeScript 
      ? "['@babel/preset-env', '@babel/preset-react', '@babel/preset-typescript']"
      : "['@babel/preset-env', '@babel/preset-react']";

    return `      {
        test: /\\.(js|jsx${isTypeScript ? '|ts|tsx' : ''})$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ${presets}
          }
        }
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }`;
  }

  private getBasicRules(isTypeScript: boolean): string {
    let rules = `      {
        test: /\\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env']
          }
        }
      },
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }`;

    if (isTypeScript) {
      rules += `,
      {
        test: /\\.ts$/,
        loader: 'ts-loader'
      }`;
    }

    return rules;
  }

  private getVue2Plugins(): string {
    return `    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html'
    })`;
  }

  private getVue3Plugins(): string {
    return `    new VueLoaderPlugin(),
    new HtmlWebpackPlugin({
      template: './index.html'
    })`;
  }

  private getReactPlugins(): string {
    return `    new HtmlWebpackPlugin({
      template: './index.html'
    })`;
  }

  private getBasicPlugins(): string {
    return `    new HtmlWebpackPlugin({
      template: './index.html'
    })`;
  }

  private addWebpackDependencies(packageJson: any, techStack: TechStack): void {
    const { framework, language } = techStack;
    const isTypeScript = language === 'typescript';

    // 基础 Webpack 依赖
    const devDeps: Record<string, string> = {
      'webpack': '^5.0.0',
      'webpack-cli': '^5.0.0',
      'webpack-dev-server': '^4.0.0',
      'html-webpack-plugin': '^5.0.0',
      'css-loader': '^6.0.0',
      'style-loader': '^3.0.0',
      '@babel/core': '^7.0.0',
      '@babel/preset-env': '^7.0.0',
      'babel-loader': '^9.0.0'
    };

    // 根据框架添加特定依赖
    switch (framework) {
      case 'vue2':
        devDeps['vue-loader'] = '^15.0.0';
        devDeps['vue-style-loader'] = '^4.0.0';
        devDeps['vue-template-compiler'] = '^2.7.0';
        break;
      case 'vue3':
        devDeps['vue-loader'] = '^17.0.0';
        devDeps['vue-style-loader'] = '^4.0.0';
        break;
      case 'react':
        devDeps['@babel/preset-react'] = '^7.0.0';
        if (isTypeScript) {
          devDeps['@babel/preset-typescript'] = '^7.0.0';
        }
        break;
    }

    // TypeScript 依赖
    if (isTypeScript) {
      devDeps['typescript'] = '^5.0.0';
      devDeps['ts-loader'] = '^9.0.0';
    }

    this.mergeDependencies(packageJson, devDeps);
  }
}