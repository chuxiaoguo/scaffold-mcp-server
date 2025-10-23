import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * React 框架注入器
 * 负责生成 React 项目的核心文件和依赖
 */
export class ReactFrameworkInjector extends AbstractCoreInjector {
  name = 'react-framework';
  priority = 3; // 框架注入器优先级
  type = InjectorType.FRAMEWORK;

  canHandle(techStack: TechStack): boolean {
    return techStack.framework === 'react';
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, projectName, files, packageJson, logs } = context;
    
    this.addLog(logs, '生成 React 项目结构');

    // 根据语言类型生成不同的文件
    const isTypeScript = techStack.language === 'typescript';
    const mainFile = isTypeScript ? 'src/main.tsx' : 'src/main.jsx';
    const appFile = isTypeScript ? 'src/App.tsx' : 'src/App.jsx';

    // 生成主入口文件
    files[mainFile] = this.generateMainFile(isTypeScript);
    
    // 生成 App 组件
    files[appFile] = this.generateAppComponent(projectName, isTypeScript);
    
    // 生成样式文件
    files['src/App.css'] = this.generateAppCss();
    files['src/index.css'] = this.generateIndexCss();
    
    // 生成 HTML 模板
    files['index.html'] = this.generateIndexHtml(projectName, mainFile);

    // 添加 React 依赖
    this.mergeDependencies(packageJson, {
      'react': '^18.2.0',
      'react-dom': '^18.2.0'
    }, 'dependencies');

    // 添加构建工具依赖
    this.addBuildDependencies(packageJson, isTypeScript);

    this.addLog(logs, 'React 项目结构生成完成');

    return { files, packageJson, logs };
  }

  private generateMainFile(isTypeScript: boolean): string {
    if (isTypeScript) {
      return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
    } else {
      return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;
    }
  }

  private generateAppComponent(projectName: string, isTypeScript: boolean): string {
    if (isTypeScript) {
      return `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <h1>${projectName}</h1>
      <p>欢迎使用 React 项目！</p>
    </div>
  )
}

export default App`;
    } else {
      return `import React from 'react'
import './App.css'

function App() {
  return (
    <div className="App">
      <h1>${projectName}</h1>
      <p>欢迎使用 React 项目！</p>
    </div>
  )
}

export default App`;
    }
  }

  private generateAppCss(): string {
    return `.App {
  text-align: center;
  padding: 2rem;
}

.App h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}

.App p {
  color: #666;
  font-size: 1.1rem;
}`;
  }

  private generateIndexCss(): string {
    return `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

code {
  font-family: source-code-pro, Menlo, Monaco, Consolas, 'Courier New',
    monospace;
}

#root {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}`;
  }

  private generateIndexHtml(projectName: string, mainFile: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/${mainFile}"></script>
</body>
</html>`;
  }

  private addBuildDependencies(packageJson: any, isTypeScript: boolean): void {
    // 默认使用 Vite
    const devDeps: Record<string, string> = {
      '@vitejs/plugin-react': '^4.0.0',
      'vite': '^4.0.0'
    };

    if (isTypeScript) {
      devDeps['typescript'] = '^5.0.0';
      devDeps['@types/react'] = '^18.2.0';
      devDeps['@types/react-dom'] = '^18.2.0';
    }

    this.mergeDependencies(packageJson, devDeps);

    this.mergeScripts(packageJson, {
      'dev': 'vite',
      'build': 'vite build',
      'preview': 'vite preview'
    });
  }
}