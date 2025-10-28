import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * React Router 路由注入器
 * 优先级: 55 (在 UI 库之后，代码质量之前)
 */
export class ReactRouterInjector extends AbstractUnifiedInjector {
  name = "react-router";
  priority = 55;
  category = InjectorCategory.FRAMEWORK;

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "react-router" ||
        tool.toLowerCase() === "react-router-dom" ||
        (tool.toLowerCase() === "router" &&
          tools.some((t) => t.toLowerCase() === "react"))
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始注入 React Router");

      // 只支持 React
      if (framework?.toLowerCase() !== "react") {
        this.addLog(logs, "⚠️  React Router 仅支持 React 项目，跳过注入");
        return {
          files,
          packageJson,
          logs,
          success: true,
        };
      }

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加依赖
      this.mergeDependencies(packageJson, {
        "react-router-dom": "^6.20.1",
      });

      if (isTypeScript) {
        if (!packageJson.devDependencies) {
          packageJson.devDependencies = {};
        }
        packageJson.devDependencies["@types/react-router-dom"] = "^5.3.3";
      }

      // 2. 创建页面组件
      const ext = isTypeScript ? "tsx" : "jsx";
      if (!files[`src/pages/Home.${ext}`]) {
        files[`src/pages/Home.${ext}`] = this.generateHomePage(isTypeScript);
      }
      if (!files[`src/pages/About.${ext}`]) {
        files[`src/pages/About.${ext}`] = this.generateAboutPage(isTypeScript);
      }

      // 3. 创建路由配置
      files[`src/routes.${ext}`] = this.generateRoutes(isTypeScript);

      // 4. 更新 App.tsx/jsx
      const appFile = `src/App.${ext}`;
      if (files[appFile]) {
        files[appFile] = this.updateApp(files[appFile], isTypeScript);
        this.addLog(logs, `更新 ${appFile}，添加路由配置`);
      }

      this.addLog(logs, "✅ React Router 注入完成");
      this.addLog(logs, "  - 版本: 6.x (最新版)");
      this.addLog(logs, "  - 已创建路由配置");
      this.addLog(logs, "  - 已创建示例页面");

      return {
        files,
        packageJson,
        logs,
        success: true,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `❌ React Router 注入失败: ${errorMsg}`);
      return {
        files,
        packageJson,
        logs,
        success: false,
        errors: [errorMsg],
      };
    }
  }

  /**
   * 生成 Home 页面
   */
  private generateHomePage(isTypeScript: boolean): string {
    const importReact = isTypeScript
      ? "import React from 'react'"
      : "import React from 'react'";

    return `${importReact}
import { Link } from 'react-router-dom'

${isTypeScript ? "const Home: React.FC = () => {" : "const Home = () => {"}
  return (
    <div className="home" style={{ padding: '20px', textAlign: 'center' }}>
      <h1>欢迎来到首页</h1>
      <p>这是使用 React Router 的示例应用</p>
      <Link to="/about" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>
        前往关于页面
      </Link>
    </div>
  )
}

export default Home
`;
  }

  /**
   * 生成 About 页面
   */
  private generateAboutPage(isTypeScript: boolean): string {
    const importReact = isTypeScript
      ? "import React from 'react'"
      : "import React from 'react'";

    return `${importReact}
import { Link } from 'react-router-dom'

${isTypeScript ? "const About: React.FC = () => {" : "const About = () => {"}
  return (
    <div className="about" style={{ padding: '20px', textAlign: 'center' }}>
      <h1>关于页面</h1>
      <p>这是一个使用路由懒加载的示例页面</p>
      <Link to="/" style={{ color: '#61dafb', textDecoration: 'none', fontWeight: 'bold' }}>
        返回首页
      </Link>
    </div>
  )
}

export default About
`;
  }

  /**
   * 生成路由配置
   */
  private generateRoutes(isTypeScript: boolean): string {
    if (isTypeScript) {
      return `import React from 'react'
import { RouteObject } from 'react-router-dom'

// 懒加载页面组件
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))

export const routes: RouteObject[] = [
  {
    path: '/',
    element: (
      <React.Suspense fallback={<div>加载中...</div>}>
        <Home />
      </React.Suspense>
    ),
  },
  {
    path: '/about',
    element: (
      <React.Suspense fallback={<div>加载中...</div>}>
        <About />
      </React.Suspense>
    ),
  },
  {
    path: '*',
    element: <div>404 - 页面不存在</div>,
  },
]
`;
    } else {
      return `import React from 'react'

// 懒加载页面组件
const Home = React.lazy(() => import('./pages/Home'))
const About = React.lazy(() => import('./pages/About'))

export const routes = [
  {
    path: '/',
    element: (
      <React.Suspense fallback={<div>加载中...</div>}>
        <Home />
      </React.Suspense>
    ),
  },
  {
    path: '/about',
    element: (
      <React.Suspense fallback={<div>加载中...</div>}>
        <About />
      </React.Suspense>
    ),
  },
  {
    path: '*',
    element: <div>404 - 页面不存在</div>,
  },
]
`;
    }
  }

  /**
   * 更新 App.tsx/jsx
   */
  private updateApp(content: string, isTypeScript: boolean): string {
    // 添加 imports
    const imports = [
      "import { BrowserRouter, Routes, Route } from 'react-router-dom'",
      "import { routes } from './routes'",
    ];

    for (const imp of imports) {
      const importName = imp.split(" from ")[0];
      if (importName && !content.includes(importName)) {
        const reactMatch = content.match(/import.*React.*from.*react.*/);
        if (reactMatch) {
          content = content.replace(reactMatch[0], `${reactMatch[0]}\n${imp}`);
        } else {
          content = imp + "\n" + content;
        }
      }
    }

    // 替换 App 组件内容
    const functionMatch = content.match(
      /function App\(\)[\s\S]*?return \(([\s\S]*?)\)/
    );
    if (functionMatch) {
      const newReturn = `function App() {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </div>
    </BrowserRouter>
  )
}`;
      content = content.replace(functionMatch[0], newReturn);
    } else {
      // 尝试箭头函数
      const arrowMatch = content.match(
        /const App.*?=.*?\(\).*?=>[\s\S]*?return \(([\s\S]*?)\)/
      );
      if (arrowMatch) {
        const newReturn = `const App${isTypeScript ? ": React.FC" : ""} = () => {
  return (
    <BrowserRouter>
      <div className="app">
        <Routes>
          {routes.map((route, index) => (
            <Route key={index} path={route.path} element={route.element} />
          ))}
        </Routes>
      </div>
    </BrowserRouter>
  )
}`;
        content = content.replace(arrowMatch[0], newReturn);
      }
    }

    return content;
  }
}
