import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * React 框架注入器
 * 优先级: 20 (框架层)
 */
export class ReactInjector extends AbstractUnifiedInjector {
  name = "react";
  priority = InjectorPriority.FRAMEWORK;
  category = InjectorCategory.FRAMEWORK;

  override canHandle(tools: string[]): boolean {
    return tools.some((tool) => tool.toLowerCase() === "react");
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, projectName, language } = context;

    try {
      this.addLog(logs, "开始生成 React 项目结构");

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加 React 核心依赖
      this.mergeDependencies(
        packageJson,
        {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
        },
        "dependencies"
      );

      // 2. 生成主入口文件
      const mainFile = isTypeScript ? "src/main.tsx" : "src/main.jsx";
      this.addFile(files, mainFile, this.generateMainFile(isTypeScript));
      this.addLog(logs, `生成 ${mainFile}`);

      // 3. 生成 App 组件
      const appFile = isTypeScript ? "src/App.tsx" : "src/App.jsx";
      this.addFile(
        files,
        appFile,
        this.generateAppComponent(projectName || "React App", isTypeScript)
      );
      this.addLog(logs, `生成 ${appFile}`);

      // 4. 生成 index.html
      this.addFile(
        files,
        "index.html",
        this.generateIndexHtml(projectName || "React App")
      );
      this.addLog(logs, "生成 index.html");

      // 5. 生成 App.css
      this.addFile(files, "src/App.css", this.generateAppCss());
      this.addLog(logs, "生成 src/App.css");

      // 6. 添加 TypeScript 类型定义
      if (isTypeScript) {
        this.mergeDependencies(packageJson, {
          "@types/react": "^18.2.45",
          "@types/react-dom": "^18.2.18",
        });
      }

      this.addLog(logs, "React 项目结构生成完成");

      return this.createSuccessResult(files, packageJson, logs);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `生成失败: ${errorMsg}`);
      return this.createErrorResult(files, packageJson, logs, [errorMsg]);
    }
  }

  private generateMainFile(isTypeScript: boolean): string {
    return `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App${isTypeScript ? ".tsx" : ".jsx"}'
import './App.css'

ReactDOM.createRoot(document.getElementById('root')${isTypeScript ? "!" : ""}).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
  }

  private generateAppComponent(
    projectName: string,
    isTypeScript: boolean
  ): string {
    const typeAnnotation = isTypeScript ? ": React.FC" : "";
    return `import React from 'react'
import './App.css'

const App${typeAnnotation} = () => {
  return (
    <div className="App">
      <header className="App-header">
        <h1>${projectName}</h1>
        <p>欢迎使用 React + Vite 项目！</p>
      </header>
    </div>
  )
}

export default App
`;
  }

  private generateIndexHtml(projectName: string): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <link rel="icon" type="image/svg+xml" href="/vite.svg">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>
`;
  }

  private generateAppCss(): string {
    return `.App {
  text-align: center;
}

.App-header {
  background-color: #282c34;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  font-size: calc(10px + 2vmin);
  color: white;
}

h1 {
  margin-bottom: 1rem;
}

p {
  margin: 0;
}
`;
  }
}
