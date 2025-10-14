import type { TechStack, GenerateOptions } from '../../types/index.js';
import type { IBuilder, BuilderResult } from './index.js';

export class ViteBuilder implements IBuilder {
  async build(techStack: TechStack, projectName: string, options?: GenerateOptions): Promise<BuilderResult> {
    const framework = techStack.framework || 'vue3';
    const language = techStack.language || 'typescript';
    const packageManager = techStack.packageManager || 'pnpm';

    const files: Record<string, string> = {};
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const scripts: Record<string, string> = {};

    // 基础依赖
    devDependencies['vite'] = '^5.0.0';
    
    if (language === 'typescript') {
      devDependencies['typescript'] = '^5.3.0';
      devDependencies['@types/node'] = '^20.10.0';
    }

    // 框架相关配置
    if (framework === 'vue3') {
      this.setupVue3(techStack, files, dependencies, devDependencies);
    } else if (framework === 'react') {
      this.setupReact(techStack, files, dependencies, devDependencies);
    }

    // 基础脚本
    scripts['dev'] = 'vite';
    scripts['build'] = language === 'typescript' ? 'tsc && vite build' : 'vite build';
    scripts['preview'] = 'vite preview';
    scripts['lint'] = 'eslint src --ext .ts,.tsx,.js,.jsx,.vue';
    scripts['format'] = 'prettier --write src';
    scripts['test'] = options?.testRunner === 'vitest' ? 'vitest' : 'jest';

    // 生成基础文件
    files['vite.config.ts'] = this.generateViteConfig(techStack);
    files['index.html'] = this.generateIndexHtml(projectName, framework);
    files['.gitignore'] = this.generateGitignore();
    files['README.md'] = this.generateReadme(projectName, techStack, packageManager);

    // 生成源码文件
    if (framework === 'vue3') {
      files['src/main.ts'] = this.generateVue3Main(techStack);
      files['src/App.vue'] = this.generateVue3App(techStack);
    } else if (framework === 'react') {
      files['src/main.tsx'] = this.generateReactMain(techStack);
      files['src/App.tsx'] = this.generateReactApp(techStack);
    }

    return { files, dependencies, devDependencies, scripts };
  }

  private setupVue3(techStack: TechStack, files: Record<string, string>, dependencies: Record<string, string>, devDependencies: Record<string, string>): void {
    dependencies['vue'] = '^3.4.0';
    devDependencies['@vitejs/plugin-vue'] = '^5.0.0';
    
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

    if (techStack.style === 'tailwindcss') {
      devDependencies['tailwindcss'] = '^3.4.0';
      devDependencies['autoprefixer'] = '^10.4.0';
      devDependencies['postcss'] = '^8.4.0';
    }
  }

  private setupReact(techStack: TechStack, files: Record<string, string>, dependencies: Record<string, string>, devDependencies: Record<string, string>): void {
    dependencies['react'] = '^18.2.0';
    dependencies['react-dom'] = '^18.2.0';
    devDependencies['@vitejs/plugin-react'] = '^4.2.0';
    
    if (techStack.language === 'typescript') {
      devDependencies['@types/react'] = '^18.2.0';
      devDependencies['@types/react-dom'] = '^18.2.0';
    }

    if (techStack.router === 'react-router') {
      dependencies['react-router-dom'] = '^6.20.0';
    }

    if (techStack.ui === 'antd') {
      dependencies['antd'] = '^5.12.0';
    }

    if (techStack.style === 'less') {
      devDependencies['less'] = '^4.2.0';
    }
  }

  private generateViteConfig(techStack: TechStack): string {
    const framework = techStack.framework || 'vue3';
    const plugins = [];

    if (framework === 'vue3') {
      plugins.push('vue()');
    } else if (framework === 'react') {
      plugins.push('react()');
    }

    return `import { defineConfig } from 'vite'
${framework === 'vue3' ? "import vue from '@vitejs/plugin-vue'" : "import react from '@vitejs/plugin-react'"}

export default defineConfig({
  plugins: [${plugins.join(', ')}],
  resolve: {
    alias: {
      '@': '/src'
    }
  }
})`;
  }

  private generateIndexHtml(projectName: string, framework: string): string {
    const scriptType = framework === 'vue3' ? 'src/main.ts' : 'src/main.tsx';
    
    return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${projectName}</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/${scriptType}"></script>
  </body>
</html>`;
  }

  private generateGitignore(): string {
    return `# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

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
    const framework = techStack.framework || 'vue3';
    const language = techStack.language || 'typescript';
    
    return `# ${projectName}

A ${framework} + Vite + ${language} project.

## Tech Stack

- ${framework === 'vue3' ? 'Vue 3' : 'React'}
- Vite
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

# Preview production build
${packageManager} run preview

# Run tests
${packageManager} run test

# Lint code
${packageManager} run lint

# Format code
${packageManager} run format
\`\`\``;
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

    if (techStack.style === 'tailwindcss') {
      imports.push("import './style/index.css'");
    }

    return `${imports.join('\n')}

const app = createApp(App)

${appSetup.join('\n')}

app.mount('#app')`;
  }

  private generateVue3App(techStack: TechStack): string {
    return `<template>
  <div id="app">
    <h1>Welcome to ${techStack.framework || 'Vue 3'}</h1>
    <p>This is a ${techStack.framework || 'Vue 3'} + Vite + ${techStack.language || 'TypeScript'} project.</p>
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

  private generateReactMain(techStack: TechStack): string {
    const imports = ["import React from 'react'"];
    imports.push("import ReactDOM from 'react-dom/client'");
    imports.push("import App from './App.tsx'");

    if (techStack.style === 'less') {
      imports.push("import './index.less'");
    } else {
      imports.push("import './index.css'");
    }

    return `${imports.join('\n')}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
  }

  private generateReactApp(techStack: TechStack): string {
    return `import React from 'react'

function App() {
  return (
    <div className="App">
      <h1>Welcome to React</h1>
      <p>This is a React + Vite + ${techStack.language || 'TypeScript'} project.</p>
    </div>
  )
}

export default App`;
  }
}