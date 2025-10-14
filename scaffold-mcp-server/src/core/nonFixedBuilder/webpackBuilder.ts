import type { TechStack, GenerateOptions } from '../../types/index.js';
import type { IBuilder, BuilderResult } from './index.js';

export class WebpackBuilder implements IBuilder {
  async build(techStack: TechStack, projectName: string, options?: GenerateOptions): Promise<BuilderResult> {
    const framework = techStack.framework || 'react';
    const language = techStack.language || 'typescript';
    const packageManager = techStack.packageManager || 'pnpm';

    const files: Record<string, string> = {};
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const scripts: Record<string, string> = {};

    // Webpack 基础依赖
    devDependencies['webpack'] = '^5.89.0';
    devDependencies['webpack-cli'] = '^5.1.0';
    devDependencies['webpack-dev-server'] = '^4.15.0';
    devDependencies['html-webpack-plugin'] = '^5.6.0';
    devDependencies['css-loader'] = '^6.8.0';
    devDependencies['style-loader'] = '^3.3.0';

    if (language === 'typescript') {
      devDependencies['typescript'] = '^5.3.0';
      devDependencies['ts-loader'] = '^9.5.0';
      devDependencies['@types/node'] = '^20.10.0';
    }

    // 框架相关配置
    if (framework === 'react') {
      this.setupReact(techStack, files, dependencies, devDependencies);
    } else if (framework === 'vue3') {
      this.setupVue3(techStack, files, dependencies, devDependencies);
    }

    // 基础脚本
    scripts['dev'] = 'webpack serve --mode development';
    scripts['build'] = 'webpack --mode production';
    scripts['lint'] = 'eslint src --ext .ts,.tsx,.js,.jsx,.vue';
    scripts['format'] = 'prettier --write src';
    scripts['test'] = 'jest';

    // 生成配置文件
    files['webpack.config.js'] = this.generateWebpackConfig(techStack);
    files['.gitignore'] = this.generateGitignore();
    files['README.md'] = this.generateReadme(projectName, techStack, packageManager);

    // 生成源码文件
    if (framework === 'react') {
      files['src/index.tsx'] = this.generateReactIndex(techStack);
      files['src/App.tsx'] = this.generateReactApp(techStack);
      files['public/index.html'] = this.generateReactHtml(projectName);
    } else if (framework === 'vue3') {
      files['src/main.ts'] = this.generateVue3Main(techStack);
      files['src/App.vue'] = this.generateVue3App(techStack);
      files['public/index.html'] = this.generateVue3Html(projectName);
    }

    return { files, dependencies, devDependencies, scripts };
  }

  private setupReact(techStack: TechStack, files: Record<string, string>, dependencies: Record<string, string>, devDependencies: Record<string, string>): void {
    dependencies['react'] = '^18.2.0';
    dependencies['react-dom'] = '^18.2.0';
    devDependencies['@babel/core'] = '^7.23.0';
    devDependencies['@babel/preset-env'] = '^7.23.0';
    devDependencies['@babel/preset-react'] = '^7.23.0';
    devDependencies['babel-loader'] = '^9.1.0';

    if (techStack.language === 'typescript') {
      devDependencies['@types/react'] = '^18.2.0';
      devDependencies['@types/react-dom'] = '^18.2.0';
      devDependencies['@babel/preset-typescript'] = '^7.23.0';
    }

    if (techStack.router === 'react-router') {
      dependencies['react-router-dom'] = '^6.20.0';
    }

    if (techStack.ui === 'antd') {
      dependencies['antd'] = '^5.12.0';
    }

    if (techStack.style === 'less') {
      devDependencies['less'] = '^4.2.0';
      devDependencies['less-loader'] = '^11.1.0';
    }
  }

  private setupVue3(techStack: TechStack, files: Record<string, string>, dependencies: Record<string, string>, devDependencies: Record<string, string>): void {
    dependencies['vue'] = '^3.4.0';
    devDependencies['vue-loader'] = '^17.4.0';
    devDependencies['@vue/compiler-sfc'] = '^3.4.0';

    if (techStack.language === 'typescript') {
      devDependencies['vue-tsc'] = '^1.8.0';
    }

    if (techStack.router === 'vue-router') {
      dependencies['vue-router'] = '^4.2.0';
    }

    if (techStack.state === 'pinia') {
      dependencies['pinia'] = '^2.1.0';
    }

    if (techStack.ui === 'element-plus') {
      dependencies['element-plus'] = '^2.4.0';
    }
  }

  private generateWebpackConfig(techStack: TechStack): string {
    const framework = techStack.framework || 'react';
    const language = techStack.language || 'typescript';
    const isTypeScript = language === 'typescript';

    const entry = framework === 'react' ? './src/index.tsx' : './src/main.ts';
    const extensions = isTypeScript ? ['.tsx', '.ts', '.js', '.jsx'] : ['.js', '.jsx'];
    
    if (framework === 'vue3') {
      extensions.unshift('.vue');
    }

    const rules = [];

    // TypeScript/JavaScript rules
    if (isTypeScript) {
      rules.push(`
      {
        test: /\\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      }`);
    }

    // Babel rules for React
    if (framework === 'react') {
      rules.push(`
      {
        test: /\\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              '@babel/preset-env',
              '@babel/preset-react'${isTypeScript ? ",\n              '@babel/preset-typescript'" : ''}
            ]
          }
        }
      }`);
    }

    // Vue rules
    if (framework === 'vue3') {
      rules.push(`
      {
        test: /\\.vue$/,
        loader: 'vue-loader'
      }`);
    }

    // CSS rules
    rules.push(`
      {
        test: /\\.css$/,
        use: ['style-loader', 'css-loader']
      }`);

    // Less rules
    if (techStack.style === 'less') {
      rules.push(`
      {
        test: /\\.less$/,
        use: ['style-loader', 'css-loader', 'less-loader']
      }`);
    }

    const plugins = ["new HtmlWebpackPlugin({ template: './public/index.html' })"];
    
    if (framework === 'vue3') {
      plugins.unshift("new VueLoaderPlugin()");
    }

    return `const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');${framework === 'vue3' ? "\nconst { VueLoaderPlugin } = require('vue-loader');" : ''}

module.exports = {
  entry: '${entry}',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    clean: true,
  },
  resolve: {
    extensions: [${extensions.map(ext => `'${ext}'`).join(', ')}],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [${rules.join(',')}
    ],
  },
  plugins: [
    ${plugins.join(',\n    ')}
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
    },
    compress: true,
    port: 3000,
    hot: true,
  },
};`;
  }

  private generateGitignore(): string {
    return `# Dependencies
node_modules/

# Production build
dist/

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?`;
  }

  private generateReadme(projectName: string, techStack: TechStack, packageManager: string): string {
    const framework = techStack.framework || 'react';
    const language = techStack.language || 'typescript';
    
    return `# ${projectName}

A ${framework} + Webpack + ${language} project.

## Tech Stack

- ${framework === 'react' ? 'React' : 'Vue 3'}
- Webpack
- ${language === 'typescript' ? 'TypeScript' : 'JavaScript'}
${techStack.router ? `- ${techStack.router}` : ''}
${techStack.state ? `- ${techStack.state}` : ''}
${techStack.ui ? `- ${techStack.ui}` : ''}
${techStack.style ? `- ${techStack.style}` : ''}

## Development

\`\`\`bash
# Install dependencies
${packageManager} install

# Start dev server
${packageManager} run dev

# Build for production
${packageManager} run build

# Run tests
${packageManager} run test

# Lint code
${packageManager} run lint

# Format code
${packageManager} run format
\`\`\``;
  }

  private generateReactIndex(techStack: TechStack): string {
    const imports = ["import React from 'react'"];
    imports.push("import { createRoot } from 'react-dom/client'");
    imports.push("import App from './App'");

    if (techStack.style === 'less') {
      imports.push("import './index.less'");
    } else {
      imports.push("import './index.css'");
    }

    return `${imports.join('\n')}

const container = document.getElementById('root');
const root = createRoot(container!);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
  }

  private generateReactApp(techStack: TechStack): string {
    return `import React from 'react';

function App() {
  return (
    <div className="App">
      <h1>Welcome to React</h1>
      <p>This is a React + Webpack + ${techStack.language || 'TypeScript'} project.</p>
    </div>
  );
}

export default App;`;
  }

  private generateReactHtml(projectName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${projectName}</title>
  </head>
  <body>
    <noscript>You need to enable JavaScript to run this app.</noscript>
    <div id="root"></div>
  </body>
</html>`;
  }

  private generateVue3Main(techStack: TechStack): string {
    const imports = ["import { createApp } from 'vue'"];
    const appSetup = [];

    imports.push("import App from './App.vue'");

    if (techStack.router === 'vue-router') {
      imports.push("import router from './router'");
      appSetup.push('app.use(router)');
    }

    if (techStack.state === 'pinia') {
      imports.push("import { createPinia } from 'pinia'");
      appSetup.push('app.use(createPinia())');
    }

    if (techStack.ui === 'element-plus') {
      imports.push("import ElementPlus from 'element-plus'");
      imports.push("import 'element-plus/dist/index.css'");
      appSetup.push('app.use(ElementPlus)');
    }

    return `${imports.join('\n')}

const app = createApp(App)

${appSetup.join('\n')}

app.mount('#app')`;
  }

  private generateVue3App(techStack: TechStack): string {
    return `<template>
  <div id="app">
    <h1>Welcome to Vue 3</h1>
    <p>This is a Vue 3 + Webpack + ${techStack.language || 'TypeScript'} project.</p>
  </div>
</template>

<script setup lang="ts">
// Your component logic here
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`;
  }

  private generateVue3Html(projectName: string): string {
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
  </body>
</html>`;
  }
}