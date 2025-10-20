import type { TechStack, GenerateOptions } from '../../types/index.js';
import type { IBuilder, BuilderResult } from './index.js';

export class UmiBuilder implements IBuilder {
  async build(techStack: TechStack, projectName: string, options?: GenerateOptions): Promise<BuilderResult> {
    const language = techStack.language || 'typescript';
    const packageManager = techStack.packageManager || 'pnpm';

    const files: Record<string, string> = {};
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const scripts: Record<string, string> = {};

    // Umi 基础依赖
    dependencies['umi'] = '^4.0.0';
    dependencies['react'] = '^18.0.0';
    dependencies['react-dom'] = '^18.0.0';
    
    if (language === 'typescript') {
      devDependencies['typescript'] = '^5.0.0';
      devDependencies['@types/react'] = '^18.0.0';
      devDependencies['@types/react-dom'] = '^18.0.0';
    }

    // 样式相关
    if (techStack.style === 'less') {
      devDependencies['less'] = '^4.1.0';
    } else if (techStack.style === 'sass') {
      devDependencies['sass'] = '^1.60.0';
    } else if (techStack.style === 'tailwindcss') {
      devDependencies['tailwindcss'] = '^3.3.0';
      devDependencies['autoprefixer'] = '^10.4.0';
      devDependencies['postcss'] = '^8.4.0';
    }

    // UI 库
    if (techStack.ui === 'antd') {
      dependencies['antd'] = '^5.0.0';
      dependencies['@ant-design/icons'] = '^5.0.0';
    }

    // 状态管理
    if (techStack.state === 'redux') {
      dependencies['@reduxjs/toolkit'] = '^1.9.0';
      dependencies['react-redux'] = '^8.0.0';
    } else if (techStack.state === 'zustand') {
      dependencies['zustand'] = '^4.3.0';
    }

    // 基础脚本
    scripts['dev'] = 'umi dev';
    scripts['build'] = 'umi build';
    scripts['postinstall'] = 'umi setup';
    scripts['setup'] = 'umi setup';
    scripts['start'] = 'npm run dev';
    scripts['lint'] = 'eslint src --ext .ts,.tsx,.js,.jsx';
    scripts['format'] = 'prettier --write src';
    scripts['test'] = 'umi test';

    // 生成基础文件
    files['.umirc.ts'] = this.generateUmiConfig(techStack);
    files['src/pages/index.tsx'] = this.generateIndexPage(projectName);
    files['src/layouts/index.tsx'] = this.generateLayout();
    files['src/app.ts'] = this.generateAppConfig();
    files['typings.d.ts'] = this.generateTypings();
    files['README.md'] = this.generateReadme(projectName);
    files['.gitignore'] = this.generateGitignore();

    // 如果使用 TypeScript，生成 tsconfig.json
    if (language === 'typescript') {
      files['tsconfig.json'] = this.generateTsConfig();
    }

    // 如果使用 Tailwind CSS，生成配置文件
    if (techStack.style === 'tailwindcss') {
      files['tailwind.config.js'] = this.generateTailwindConfig();
      files['postcss.config.js'] = this.generatePostcssConfig();
    }

    return {
      files,
      dependencies,
      devDependencies,
      scripts
    };
  }

  private generateUmiConfig(techStack: TechStack): string {
    const config: any = {
      npmClient: techStack.packageManager || 'pnpm',
      routes: [
        { path: '/', component: 'index' }
      ]
    };

    if (techStack.ui === 'antd') {
      config.antd = {};
    }

    if (techStack.style === 'tailwindcss') {
      config.tailwindcss = {};
    }

    if (techStack.state === 'redux') {
      config.dva = {};
    }

    return `import { defineConfig } from 'umi';

export default defineConfig(${JSON.stringify(config, null, 2)});
`;
  }

  private generateIndexPage(projectName: string): string {
    return `import React from 'react';
import { Button } from 'antd';
import './index.less';

const HomePage: React.FC = () => {
  return (
    <div className="home-page">
      <h1>欢迎使用 ${projectName}</h1>
      <p>这是一个基于 Umi 4 的 React 项目</p>
      <Button type="primary">开始使用</Button>
    </div>
  );
};

export default HomePage;
`;
  }

  private generateLayout(): string {
    return `import React from 'react';
import { Outlet } from 'umi';

const Layout: React.FC = () => {
  return (
    <div>
      <header style={{ padding: '16px', background: '#f0f0f0' }}>
        <h2>应用标题</h2>
      </header>
      <main style={{ padding: '16px' }}>
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
`;
  }

  private generateAppConfig(): string {
    return `export const dva = {
  config: {
    onError(err: any) {
      err.preventDefault();
      console.error(err.message);
    },
  },
};

export const request = {
  timeout: 1000,
  errorConfig: {
    errorThrower: (res: any) => {
      const { success, data, errorCode, errorMessage, showMessage } = res;
      if (!success) {
        const error: any = new Error(errorMessage);
        error.name = 'BizError';
        error.info = { errorCode, errorMessage, showMessage, data };
        throw error;
      }
    },
  },
};
`;
  }

  private generateTypings(): string {
    return `declare module '*.css';
declare module '*.less';
declare module '*.scss';
declare module '*.sass';
declare module '*.svg';
declare module '*.png';
declare module '*.jpg';
declare module '*.jpeg';
declare module '*.gif';
declare module '*.bmp';
declare module '*.tiff';
`;
  }

  private generateReadme(projectName: string): string {
    return `# ${projectName}

基于 Umi 4 的 React 项目

## 开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
\`\`\`

## 构建

\`\`\`bash
# 构建生产版本
npm run build
\`\`\`

## 特性

- ⚡️ Umi 4
- 📦 React 18
- 🎨 Ant Design
- 💪 TypeScript
- 🔥 热重载
- 📱 响应式设计

## 目录结构

\`\`\`
src/
├── pages/          # 页面组件
├── layouts/        # 布局组件
├── components/     # 公共组件
├── services/       # API 服务
├── models/         # 数据模型
└── utils/          # 工具函数
\`\`\`
`;
  }

  private generateGitignore(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# Production
/dist
/build

# Generated files
.umi
.umi-production
.umi-test

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Logs
logs
*.log

# Runtime data
pids
*.pid
*.seed
*.pid.lock

# Coverage directory used by tools like istanbul
coverage/
*.lcov

# Environment variables
.env
.env.local
.env.development.local
.env.test.local
.env.production.local

# Temporary folders
tmp/
temp/
`;
  }

  private generateTsConfig(): string {
    return `{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["DOM", "DOM.Iterable", "ES6"],
    "allowJs": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "strict": true,
    "forceConsistentCasingInFileNames": true,
    "module": "ESNext",
    "moduleResolution": "Node",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "declaration": false,
    "declarationMap": false,
    "incremental": true,
    "baseUrl": "./",
    "paths": {
      "@/*": ["src/*"],
      "@@/*": ["src/.umi/*"]
    }
  },
  "include": [
    "mock/**/*",
    "src/**/*",
    "config/**/*",
    ".umirc.ts",
    "typings.d.ts"
  ],
  "exclude": [
    "node_modules",
    "lib",
    "es",
    "dist",
    "typings",
    "**/*.d.ts"
  ]
}
`;
  }

  private generateTailwindConfig(): string {
    return `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
    './src/**/*.less',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  corePlugins: {
    preflight: false,
  },
};
`;
  }

  private generatePostcssConfig(): string {
    return `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
  }
}