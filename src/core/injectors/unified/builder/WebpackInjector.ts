import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Webpack 构建工具注入器
 * 优先级: 30 (构建层)
 */
export class WebpackInjector extends AbstractUnifiedInjector {
  name = "webpack";
  priority = InjectorPriority.BUILDER;
  category = InjectorCategory.BUILDER;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "webpack");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始配置 Webpack 构建工具");
      this.addLog(logs, `  检测到框架: ${framework || "未指定"}`);
      this.addLog(logs, `  检测到语言: ${language || "未指定"}`);
      this.addLog(logs, `  工具列表: ${context.tools.join(", ")}`);

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 Webpack 核心依赖
      this.mergeDependencies(packageJson, {
        webpack: "^5.89.0",
        "webpack-cli": "^5.1.4",
        "webpack-dev-server": "^4.15.1",
        "html-webpack-plugin": "^5.6.0",
      });

      // 2. 添加 Loader
      this.addLoaders(packageJson, framework, isTypeScript);

      // 3. 生成 webpack.config.js
      this.addFile(
        files,
        "webpack.config.js",
        this.generateWebpackConfig(framework, isTypeScript)
      );
      this.addLog(logs, "生成 webpack.config.js");

      // 4. 添加构建脚本
      this.mergeScripts(packageJson, {
        dev: "webpack serve --mode development",
        build: "webpack --mode production",
      });
      this.addLog(logs, "添加构建脚本");

      this.addLog(logs, "Webpack 构建工具配置完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `配置失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private addLoaders(
    packageJson: any,
    framework?: string,
    isTypeScript?: boolean
  ): void {
    const devDeps: Record<string, string> = {
      "style-loader": "^3.3.3",
      "css-loader": "^6.8.1",
      "less-loader": "^11.1.0", // 添加 less-loader
    };

    if (isTypeScript) {
      devDeps["ts-loader"] = "^9.5.1";
    } else {
      devDeps["babel-loader"] = "^9.1.3";
      devDeps["@babel/core"] = "^7.23.6";
      devDeps["@babel/preset-env"] = "^7.23.6";
    }

    switch (framework?.toLowerCase()) {
      case "vue2":
        devDeps["vue-loader"] = "^15.10.1"; // Vue 2 使用 15.x 版本
        devDeps["vue-template-compiler"] = "^2.7.16";
        break;
      case "vue3":
        devDeps["vue-loader"] = "^17.4.0"; // Vue 3 使用 17.x 版本
        break;
      case "react":
        if (!isTypeScript) {
          devDeps["@babel/preset-react"] = "^7.23.3";
        }
        break;
    }

    this.mergeDependencies(packageJson, devDeps);
  }

  private generateWebpackConfig(
    framework?: string,
    isTypeScript?: boolean
  ): string {
    const extensions = isTypeScript
      ? "'.ts', '.tsx', '.js', '.jsx', '.vue'"
      : "'.js', '.jsx', '.vue'";

    const isVue =
      framework?.toLowerCase() === "vue2" ||
      framework?.toLowerCase() === "vue3";

    // 引入语句
    let imports = `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');`;

    if (isVue) {
      imports += `
const { VueLoaderPlugin } = require('vue-loader');`;
    }

    let rules = "";

    // Vue loader (必须放在最前面)
    if (isVue) {
      rules += `
      {
        test: /\\.vue$/,
        use: 'vue-loader'
      },`;
    }

    // TypeScript/JavaScript loader
    if (isTypeScript) {
      // 如果是 Vue 项目，需要添加 appendTsSuffixTo 选项
      const tsLoaderOptions = isVue
        ? `
        loader: 'ts-loader',
        exclude: /node_modules/,
        options: {
          appendTsSuffixTo: [/\\.vue$/]
        }`
        : `
        use: 'ts-loader',
        exclude: /node_modules/`;

      rules += `
      {
        test: /\\.tsx?$/,${tsLoaderOptions}
      },`;
    } else {
      rules += `
      {
        test: /\\.jsx?$/,
        use: 'babel-loader',
        exclude: /node_modules/
      },`;
    }

    // CSS loader
    rules += `
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }`;

    // Less loader (如果需要)
    rules += `,
      {
        test: /\\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }`;

    // Plugins
    let plugins = `
    new HtmlWebpackPlugin({
      template: './index.html'
    })`;

    if (isVue) {
      plugins += `,
    new VueLoaderPlugin()`;
    }

    return `${imports}

module.exports = {
  entry: './src/main.${isTypeScript ? "ts" : "js"}',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true
  },
  resolve: {
    extensions: [${extensions}],
    alias: {
      '@': path.resolve(__dirname, 'src')${
        isVue && framework?.toLowerCase() === "vue2"
          ? `,
      'vue$': 'vue/dist/vue.esm.js'`
          : ""
      }
    }
  },
  module: {
    rules: [${rules}
    ]
  },
  plugins: [${plugins}
  ],
  devServer: {
    port: 3000,
    open: true,
    hot: true
  }
};
`;
  }
}
