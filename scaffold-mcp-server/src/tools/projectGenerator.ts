import * as path from "path";
import { fileURLToPath } from 'url';
import type { TechStack } from "../types/index.js";
import {
  parseTechStack,
  techStackToArray,
  normalizeTechStack,
} from "./techStackParser.js";
import {
  generateFromFixedTemplate,
  generateFromLocalTemplate,
  type TemplateResult,
} from "./templateDownloader.js";
import {
  createProjectFiles,
  installDependencies,
  generateDirectoryTree,
  generateFileSummary,
} from "./fileOperations.js";

// 固定模板配置
const FIXED_TEMPLATES = [
  {
    name: "vue3-vite",
    framework: "vue3",
    builder: "vite",
    language: "typescript",
    description: "Vue 3 + Vite + TypeScript 项目模板",
  },
  {
    name: "electron-vite-vue3",
    framework: "vue3",
    builder: "electron-vite",
    language: "typescript",
    description: "electron + vite + + vue3 + TypeScript 项目模板",
  },
  {
    name: "react-webpack-typescript",
    framework: "react",
    builder: "webpack",
    language: "typescript",
    description: "React + Webpack + TypeScript 项目模板",
  },
  {
    name: "umijs",
    framework: "react",
    builder: "umi",
    language: "typescript",
    description: "React + umi + TypeScript 项目模板",
  },
];

/**
 * 匹配固定模板
 */
export function matchFixedTemplate(techStack: TechStack, logs: string[] = []): any | null {
  logs.push(`🔍 匹配固定模板...`);
  logs.push(`   - 框架: ${techStack.framework}`);
  logs.push(`   - 构建工具: ${techStack.builder}`);
  logs.push(`   - 语言: ${techStack.language}`);
  
  console.log(`🔍 匹配固定模板...`);
  console.log(`   - 框架: ${techStack.framework}`);
  console.log(`   - 构建工具: ${techStack.builder}`);
  console.log(`   - 语言: ${techStack.language}`);

  const template = FIXED_TEMPLATES.find(
    (t) =>
      t.framework === techStack.framework &&
      t.builder === techStack.builder &&
      t.language === techStack.language
  );

  if (template) {
    logs.push(`✅ 找到匹配的固定模板: ${template.name}`);
    logs.push(`   - 描述: ${template.description}`);
    console.log(`✅ 找到匹配的固定模板: ${template.name}`);
    console.log(`   - 描述: ${template.description}`);
    return template;
  }

  logs.push(`❌ 未找到匹配的固定模板`);
  console.log(`❌ 未找到匹配的固定模板`);
  return null;
}

/**
 * 根据固定模板填充默认值
 */
function fillDefaultValues(techStack: TechStack, logs: string[] = []): TechStack {
  logs.push(`🔧 填充默认值...`);
  logs.push(`   - 原始技术栈: ${JSON.stringify(techStack)}`);
  
  console.log(`🔧 填充默认值...`);
  console.log(`   - 原始技术栈: ${JSON.stringify(techStack)}`);

  // 如果已经有完整的配置，直接返回
  if (techStack.framework && techStack.builder && techStack.language) {
    logs.push(`✅ 技术栈配置完整，无需填充默认值`);
    return techStack;
  }

  // 根据部分信息匹配默认模板
  let defaultTemplate = null;

  // 1. 如果只指定了语言（如 typescript），默认使用 vue3-vite-typescript
  if (techStack.language && !techStack.framework && !techStack.builder) {
    logs.push(`🔍 仅指定语言 ${techStack.language}，查找默认模板...`);
    if (
      techStack.language === "typescript" ||
      techStack.language === "javascript"
    ) {
      defaultTemplate = FIXED_TEMPLATES.find((t) => t.name === "vue3-vite");
      logs.push(`📦 选择默认模板: vue3-vite`);
    }
  }

  // 2. 如果只指定了构建工具
  if (techStack.builder && !techStack.framework && !techStack.language) {
    logs.push(`🔍 仅指定构建工具 ${techStack.builder}，查找默认模板...`);
    if (techStack.builder === "vite") {
      defaultTemplate = FIXED_TEMPLATES.find((t) => t.name === "vue3-vite");
      logs.push(`📦 选择默认模板: vue3-vite`);
    } else if (techStack.builder === "webpack") {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "react-webpack-typescript"
      );
      logs.push(`📦 选择默认模板: react-webpack-typescript`);
    } else if (techStack.builder === "umi") {
      defaultTemplate = FIXED_TEMPLATES.find((t) => t.name === "umijs");
      logs.push(`📦 选择默认模板: umijs`);
    } else if (techStack.builder === "electron-vite") {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "electron-vite-vue3"
      );
      logs.push(`📦 选择默认模板: electron-vite-vue3`);
    }
  }

  // 3. 如果只指定了框架
  if (techStack.framework && !techStack.builder && !techStack.language) {
    logs.push(`🔍 仅指定框架 ${techStack.framework}，查找默认模板...`);
    if (techStack.framework === "vue3") {
      defaultTemplate = FIXED_TEMPLATES.find((t) => t.name === "vue3-vite");
      logs.push(`📦 选择默认模板: vue3-vite`);
    } else if (techStack.framework === "react") {
      defaultTemplate = FIXED_TEMPLATES.find(
        (t) => t.name === "react-webpack-typescript"
      );
      logs.push(`📦 选择默认模板: react-webpack-typescript`);
    }
  }

  // 4. 如果指定了框架和构建工具，补充语言
  if (techStack.framework && techStack.builder && !techStack.language) {
    logs.push(`🔍 指定了框架和构建工具，补充语言...`);
    const matchingTemplate = FIXED_TEMPLATES.find(
      (t) =>
        t.framework === techStack.framework && t.builder === techStack.builder
    );
    if (matchingTemplate) {
      defaultTemplate = matchingTemplate;
      logs.push(`📦 找到匹配模板: ${matchingTemplate.name}`);
    }
  }

  // 5. 如果指定了框架和语言，补充构建工具
  if (techStack.framework && !techStack.builder && techStack.language) {
    logs.push(`🔍 指定了框架和语言，补充构建工具...`);
    const matchingTemplate = FIXED_TEMPLATES.find(
      (t) =>
        t.framework === techStack.framework && t.language === techStack.language
    );
    if (matchingTemplate) {
      defaultTemplate = matchingTemplate;
      logs.push(`📦 找到匹配模板: ${matchingTemplate.name}`);
    }
  }

  // 6. 如果指定了构建工具和语言，补充框架
  if (!techStack.framework && techStack.builder && techStack.language) {
    logs.push(`🔍 指定了构建工具和语言，补充框架...`);
    const matchingTemplate = FIXED_TEMPLATES.find(
      (t) =>
        t.builder === techStack.builder && t.language === techStack.language
    );
    if (matchingTemplate) {
      defaultTemplate = matchingTemplate;
      logs.push(`📦 找到匹配模板: ${matchingTemplate.name}`);
    }
  }

  // 应用默认模板
  if (defaultTemplate) {
    const filledTechStack: TechStack = {
      framework: (techStack.framework || defaultTemplate.framework) as
        | "vue3"
        | "react",
      builder: (techStack.builder || defaultTemplate.builder) as
        | "vite"
        | "webpack"
        | "electron-vite"
        | "umi",
      language: (techStack.language || defaultTemplate.language) as
        | "typescript"
        | "javascript",
    };

    logs.push(`   - 使用默认模板: ${defaultTemplate.name}`);
    logs.push(`   - 填充后的技术栈: ${JSON.stringify(filledTechStack)}`);
    console.log(`   - 使用默认模板: ${defaultTemplate.name}`);
    console.log(`   - 填充后的技术栈: ${JSON.stringify(filledTechStack)}`);

    return filledTechStack;
  }

  // 如果没有匹配的默认模板，返回原始技术栈
  logs.push(`   - 未找到匹配的默认模板，保持原始配置`);
  console.log(`   - 未找到匹配的默认模板，保持原始配置`);
  return techStack;
}

/**
 * 注入额外工具到项目
 */
export function injectExtraTools(
  files: Record<string, string>,
  packageJson: any,
  extraTools: string[]
): { files: Record<string, string>; packageJson: any } {
  if (!extraTools || extraTools.length === 0) {
    console.log(`⏭️  没有额外工具需要注入`);
    return { files, packageJson };
  }

  console.log(`🔧 注入额外工具: ${extraTools.join(", ")}`);

  const updatedFiles = { ...files };
  const updatedPackageJson = { ...packageJson };

  // 确保 devDependencies 存在
  if (!updatedPackageJson.devDependencies) {
    updatedPackageJson.devDependencies = {};
  }

  // 确保 scripts 存在
  if (!updatedPackageJson.scripts) {
    updatedPackageJson.scripts = {};
  }

  for (const tool of extraTools) {
    switch (tool.toLowerCase()) {
      case "eslint":
        console.log(`   - 添加 ESLint 配置`);
        updatedPackageJson.devDependencies["eslint"] = "^8.0.0";
        updatedPackageJson.devDependencies["@typescript-eslint/eslint-plugin"] =
          "^6.0.0";
        updatedPackageJson.devDependencies["@typescript-eslint/parser"] =
          "^6.0.0";
        updatedPackageJson.scripts["lint"] = "eslint . --ext .ts,.tsx,.js,.jsx";
        updatedPackageJson.scripts["lint:fix"] =
          "eslint . --ext .ts,.tsx,.js,.jsx --fix";

        // 添加 ESLint 配置文件
        updatedFiles[".eslintrc.json"] = JSON.stringify(
          {
            extends: ["eslint:recommended", "@typescript-eslint/recommended"],
            parser: "@typescript-eslint/parser",
            plugins: ["@typescript-eslint"],
            root: true,
            env: {
              node: true,
              browser: true,
            },
            rules: {
              "@typescript-eslint/no-unused-vars": "warn",
              "@typescript-eslint/no-explicit-any": "warn",
            },
          },
          null,
          2
        );
        break;

      case "prettier":
        console.log(`   - 添加 Prettier 配置`);
        updatedPackageJson.devDependencies["prettier"] = "^3.0.0";
        updatedPackageJson.scripts["format"] = "prettier --write .";
        updatedPackageJson.scripts["format:check"] = "prettier --check .";

        // 添加 Prettier 配置文件
        updatedFiles[".prettierrc"] = JSON.stringify(
          {
            semi: true,
            trailingComma: "es5",
            singleQuote: true,
            printWidth: 80,
            tabWidth: 2,
          },
          null,
          2
        );

        updatedFiles[".prettierignore"] = `node_modules/
dist/
build/
*.min.js
*.min.css`;
        break;

      case "jest":
        console.log(`   - 添加 Jest 测试框架`);
        updatedPackageJson.devDependencies["jest"] = "^29.0.0";
        updatedPackageJson.devDependencies["@types/jest"] = "^29.0.0";
        updatedPackageJson.devDependencies["ts-jest"] = "^29.0.0";
        updatedPackageJson.scripts["test"] = "jest";
        updatedPackageJson.scripts["test:watch"] = "jest --watch";
        updatedPackageJson.scripts["test:coverage"] = "jest --coverage";

        // 添加 Jest 配置文件
        updatedFiles["jest.config.js"] = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};`;
        break;

      case "husky":
        console.log(`   - 添加 Husky Git hooks`);
        updatedPackageJson.devDependencies["husky"] = "^8.0.0";
        updatedPackageJson.devDependencies["lint-staged"] = "^13.0.0";
        updatedPackageJson.scripts["prepare"] = "husky install";

        // 添加 lint-staged 配置
        updatedPackageJson["lint-staged"] = {
          "*.{ts,tsx,js,jsx}": ["eslint --fix", "prettier --write"],
          "*.{json,md}": ["prettier --write"],
        };

        // 添加 pre-commit hook
        updatedFiles[".husky/pre-commit"] = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged`;
        break;

      case "commitlint":
        console.log(`   - 添加 Commitlint 配置`);
        updatedPackageJson.devDependencies["@commitlint/cli"] = "^17.0.0";
        updatedPackageJson.devDependencies["@commitlint/config-conventional"] =
          "^17.0.0";

        // 添加 commitlint 配置文件
        updatedFiles["commitlint.config.js"] = `module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'chore',
        'revert'
      ]
    ]
  }
};`;

        // 添加 commit-msg hook
        updatedFiles[".husky/commit-msg"] = `#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx --no -- commitlint --edit $1`;
        break;

      case "tailwindcss":
        console.log(`   - 添加 Tailwind CSS`);
        updatedPackageJson.devDependencies["tailwindcss"] = "^3.0.0";
        updatedPackageJson.devDependencies["autoprefixer"] = "^10.0.0";
        updatedPackageJson.devDependencies["postcss"] = "^8.0.0";

        // 添加 Tailwind 配置文件
        updatedFiles["tailwind.config.js"] =
          `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

        updatedFiles["postcss.config.js"] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

        // 添加 Tailwind CSS 基础样式
        updatedFiles["src/styles/tailwind.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
        break;

      default:
        console.log(`   - ⚠️  未知工具: ${tool}，跳过`);
        break;
    }
  }

  console.log(`✅ 额外工具注入完成`);
  return { files: updatedFiles, packageJson: updatedPackageJson };
}

/**
 * 生成非固定模板项目
 */
export function generateFromNonFixedTemplate(
  techStack: TechStack,
  projectName: string,
  logs: string[] = []
): TemplateResult {
  logs.push(`🔧 生成非固定模板项目`);
  logs.push(`   - 项目名称: ${projectName}`);
  logs.push(`   - 技术栈: ${JSON.stringify(techStack)}`);
  console.log(`🔧 生成非固定模板项目`);
  console.log(`   - 项目名称: ${projectName}`);
  console.log(`   - 技术栈: ${JSON.stringify(techStack)}`);

  const files: Record<string, string> = {};
  let packageJson: any = {
    name: projectName,
    version: "1.0.0",
    description: `基于 ${techStack.framework} 的项目`,
    scripts: {},
    dependencies: {},
    devDependencies: {},
  };

  // 根据框架生成基础文件
  switch (techStack.framework) {
    case "vue3":
      logs.push(`   - 生成 Vue 3 项目结构`);
      console.log(`   - 生成 Vue 3 项目结构`);

      // 主入口文件
      files["src/main.ts"] = `import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)
app.mount('#app')`;

      // App 组件
      files["src/App.vue"] = `<template>
  <div id="app">
    <h1>{{ title }}</h1>
    <p>欢迎使用 Vue 3 项目！</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const title = ref('${projectName}')
</script>

<style scoped>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>`;

      // HTML 模板
      files["index.html"] = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`;

      // 依赖配置
      packageJson.dependencies["vue"] = "^3.3.0";
      packageJson.devDependencies["@vitejs/plugin-vue"] = "^4.0.0";
      packageJson.devDependencies["typescript"] = "^5.0.0";
      packageJson.devDependencies["vite"] = "^4.0.0";

      packageJson.scripts = {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      };
      break;

    case "react":
      console.log(`   - 生成 React 项目结构`);

      // 主入口文件
      files["src/main.tsx"] = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`;

      // App 组件
      files["src/App.tsx"] = `import React from 'react'
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

      // 样式文件
      files["src/App.css"] = `.App {
  text-align: center;
  padding: 2rem;
}

.App h1 {
  color: #2c3e50;
  margin-bottom: 1rem;
}`;

      files["src/index.css"] = `body {
  margin: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}`;

      // HTML 模板
      files["index.html"] = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

      // 依赖配置
      packageJson.dependencies["react"] = "^18.2.0";
      packageJson.dependencies["react-dom"] = "^18.2.0";
      packageJson.devDependencies["@types/react"] = "^18.2.0";
      packageJson.devDependencies["@types/react-dom"] = "^18.2.0";
      packageJson.devDependencies["@vitejs/plugin-react"] = "^4.0.0";
      packageJson.devDependencies["typescript"] = "^5.0.0";
      packageJson.devDependencies["vite"] = "^4.0.0";

      packageJson.scripts = {
        dev: "vite",
        build: "vite build",
        preview: "vite preview",
      };
      break;

    default:
      console.log(`   - 生成通用项目结构`);

      files["src/index.ts"] = `// ${projectName} 项目入口文件
console.log('Hello ${projectName}!');

export default function main() {
  console.log('项目启动成功！');
}

main();`;

      packageJson.scripts = {
        start: "node dist/index.js",
        build: "tsc",
        dev: "ts-node src/index.ts",
      };

      packageJson.devDependencies["typescript"] = "^5.0.0";
      packageJson.devDependencies["ts-node"] = "^10.0.0";
      packageJson.devDependencies["@types/node"] = "^20.0.0";
      break;
  }

  // 添加构建工具配置
  if (techStack.builder === "vite") {
    console.log(`   - 添加 Vite 配置`);

    let viteConfig = "";
    if (techStack.framework === "vue3") {
      viteConfig = `import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
})`;
    } else if (techStack.framework === "react") {
      viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
})`;
    } else {
      viteConfig = `import { defineConfig } from 'vite'

export default defineConfig({
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist'
  }
})`;
    }

    files["vite.config.ts"] = viteConfig;
  }

  // 添加 TypeScript 配置
  if (techStack.language === "typescript") {
    console.log(`   - 添加 TypeScript 配置`);

    files["tsconfig.json"] = JSON.stringify(
      {
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: techStack.framework === "react" ? "react-jsx" : "preserve",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ["src/**/*"],
        references: [{ path: "./tsconfig.node.json" }],
      },
      null,
      2
    );

    files["tsconfig.node.json"] = JSON.stringify(
      {
        compilerOptions: {
          composite: true,
          skipLibCheck: true,
          module: "ESNext",
          moduleResolution: "bundler",
          allowSyntheticDefaultImports: true,
        },
        include: ["vite.config.ts"],
      },
      null,
      2
    );
  }

  // 添加通用文件
  files["README.md"] = `# ${projectName}

基于 ${techStack.framework} + ${techStack.builder} + ${techStack.language} 的项目。

## 开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
\`\`\`

## 项目结构

\`\`\`
${projectName}/
├── src/           # 源代码目录
├── dist/          # 构建输出目录
├── package.json   # 项目配置
└── README.md      # 项目说明
\`\`\`
`;

  files[".gitignore"] = `# 依赖
node_modules/
.pnpm-store/

# 构建输出
dist/
build/
out/

# 环境变量
.env.local
.env.*.local

# 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/

# 操作系统
.DS_Store
Thumbs.db

# 临时文件
*.tmp
*.temp
.cache/`;

  logs.push(`✅ 非固定模板项目生成完成`);
  console.log(`✅ 非固定模板项目生成完成`);
  return { files, packageJson, processLogs: logs };
}

/**
 * 生成项目的主要函数
 */
export async function generateProject(
  techStackInput: string | string[],
  projectName: string = "my-project",
  outputDir: string = ".",
  extraTools: string[] = [],
  options: {
    dryRun?: boolean;
    force?: boolean;
    install?: boolean;
  } = {}
): Promise<{
  success: boolean;
  message: string;
  projectPath?: string;
  directoryTree?: string;
  fileSummary?: string[];
  processLogs?: string[];
}> {
  const logs: string[] = [];
  
  try {
    logs.push(`🚀 开始生成项目...`);
    logs.push(`   - 项目名称: ${projectName}`);
    logs.push(`   - 输出目录: ${outputDir}`);
    logs.push(`   - 技术栈: ${JSON.stringify(techStackInput)}`);
    logs.push(`   - 额外工具: ${extraTools.join(", ") || "无"}`);
    logs.push(`   - 选项: ${JSON.stringify(options)}`);
    
    console.log(`🚀 开始生成项目...`);
    console.log(`   - 项目名称: ${projectName}`);
    console.log(`   - 输出目录: ${outputDir}`);
    console.log(`   - 技术栈: ${JSON.stringify(techStackInput)}`);
    console.log(`   - 额外工具: ${extraTools.join(", ") || "无"}`);
    console.log(`   - 选项: ${JSON.stringify(options)}`);

    // 1. 解析技术栈
    logs.push(`📋 解析技术栈...`);
    const techStack = parseTechStack(techStackInput);
    logs.push(`   - 解析结果: ${JSON.stringify(techStack)}`);
    
    const normalizedTechStack = normalizeTechStack(techStack);
    logs.push(`   - 标准化结果: ${JSON.stringify(normalizedTechStack)}`);

    // 2. 填充默认值
    logs.push(`🔧 填充默认值...`);
    const filledTechStack = fillDefaultValues(normalizedTechStack, logs);
    logs.push(`📋 最终技术栈: ${JSON.stringify(filledTechStack)}`);
    console.log(`📋 最终技术栈:`, filledTechStack);

    // 3. 确定项目路径
    logs.push(`📁 确定项目路径...`);
    // 相对路径基于用户当前工作目录，绝对路径直接使用
    const userWorkingDir = process.cwd();
    const resolvedOutputDir = path.isAbsolute(outputDir) ? outputDir : path.resolve(userWorkingDir, outputDir);
    const projectPath = path.resolve(resolvedOutputDir, projectName);
    logs.push(`   - 用户工作目录: ${userWorkingDir}`);
    logs.push(`   - 输出目录参数: ${outputDir}`);
    logs.push(`   - 解析后输出目录: ${resolvedOutputDir}`);
    logs.push(`   - 项目路径: ${projectPath}`);
    console.log(`📁 项目路径: ${projectPath}`);

    // 4. 确保输出目录存在
    logs.push(`📁 确保输出目录存在...`);
    try {
      const fs = await import("fs/promises");
      await fs.mkdir(resolvedOutputDir, { recursive: true });
      logs.push(`✅ 输出目录已确保存在: ${resolvedOutputDir}`);
    } catch (error: any) {
      logs.push(`❌ 创建输出目录失败: ${error.message || error}`);
      return {
        success: false,
        message: `无法创建输出目录 ${resolvedOutputDir}: ${error.message || error}。请检查路径权限。`,
        processLogs: logs,
      };
    }

    // 5. 检查项目目录是否存在
    logs.push(`🔍 检查项目目录是否存在...`);
    if (!options.force) {
      try {
        await import("fs/promises").then((fs) => fs.access(projectPath));
        logs.push(`❌ 项目目录已存在，需要使用 --force 选项`);
        return {
          success: false,
          message: `项目目录 ${projectPath} 已存在。使用 --force 选项强制覆盖。`,
          processLogs: logs,
        };
      } catch {
        logs.push(`✅ 项目目录不存在，可以继续创建`);
      }
    } else {
      logs.push(`⚠️ 使用强制模式，将覆盖现有项目目录`);
    }

    // 6. 匹配模板并生成项目
    logs.push(`🔍 匹配模板...`);
    let templateResult: TemplateResult;
    const fixedTemplate = matchFixedTemplate(filledTechStack, logs);

    if (fixedTemplate) {
      logs.push(`📦 使用固定模板: ${fixedTemplate.name}`);
      console.log(`📦 使用固定模板: ${fixedTemplate.name}`);
      templateResult = await generateFromFixedTemplate(
        fixedTemplate,
        projectName,
        normalizedTechStack,
        logs
      );
      
      // 注意：不需要合并 processLogs，因为 generateFromFixedTemplate 已经直接向 logs 添加了日志
    } else {
      logs.push(`🔧 使用动态生成模板`);
      console.log(`🔧 使用动态生成模板`);
      templateResult = generateFromNonFixedTemplate(
        normalizedTechStack,
        projectName,
        logs
      );
      
      // 注意：不需要合并 processLogs，因为 generateFromNonFixedTemplate 已经直接向 logs 添加了日志
    }

    // 7. 注入额外工具
    logs.push(`🔧 注入额外工具...`);
    if (extraTools.length > 0) {
      logs.push(`   - 额外工具: ${extraTools.join(", ")}`);
    } else {
      logs.push(`   - 无额外工具需要注入`);
    }
    
    const { files, packageJson } = injectExtraTools(
      templateResult.files,
      templateResult.packageJson,
      extraTools
    );
    logs.push(`   - 文件数量: ${Object.keys(files).length}`);
    logs.push(`   - 依赖数量: ${Object.keys(packageJson.dependencies || {}).length + Object.keys(packageJson.devDependencies || {}).length}`);

    // 8. 如果是预览模式，只返回信息
    if (options.dryRun) {
      logs.push(`👀 预览模式，不创建实际文件`);
      console.log(`👀 预览模式，不创建实际文件`);

      const fileList = Object.keys(files)
        .map((f) => `  📄 ${f}`)
        .join("\n");
      const dependencyList = Object.keys(packageJson.dependencies || {})
        .concat(Object.keys(packageJson.devDependencies || {}))
        .map((d) => `  📦 ${d}`)
        .join("\n");

      return {
        success: true,
        message: `预览模式 - 将要创建的项目结构：

📁 项目: ${projectName}
📍 路径: ${projectPath}
🛠️  技术栈: ${techStackToArray(normalizedTechStack).join(" + ")}

📄 文件列表:
${fileList}

📦 依赖列表:
${dependencyList}`,
        projectPath,
        processLogs: logs,
      };
    }

    // 9. 创建项目文件
    logs.push(`📁 创建项目文件...`);
    await createProjectFiles(projectPath, files, projectName, logs);

    // 10. 创建 package.json
    logs.push(`📦 创建 package.json...`);
    const packageJsonPath = path.join(projectPath, "package.json");
    await import("fs/promises").then((fs) =>
      fs.writeFile(
        packageJsonPath,
        JSON.stringify(packageJson, null, 2),
        "utf-8"
      )
    );
    logs.push(`✅ package.json 创建成功`);
    console.log(`✅ 创建 package.json`);

    // 11. 安装依赖
    if (options.install !== false) {
      logs.push(`📦 安装依赖...`);
      await installDependencies(projectPath, options.install, logs);
    } else {
      logs.push(`⏭️ 跳过依赖安装`);
    }

    // 12. 生成项目摘要
    logs.push(`📊 生成项目摘要...`);
    const directoryTree = await generateDirectoryTree(projectPath);
    const fileSummary = await generateFileSummary(projectPath);
    logs.push(`   - 目录树生成完成`);
    logs.push(`   - 文件摘要生成完成`);

    // 13. 统计最终的实际文件数量（安装依赖后可能会有变化）
    logs.push(`📊 统计最终文件数量...`);
    const fs = await import('fs/promises');
    
    async function countFinalFiles(dirPath: string): Promise<number> {
      let count = 0;
      try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isFile()) {
            count++;
          } else if (entry.isDirectory() && entry.name !== 'node_modules') {
            const subDirPath = path.join(dirPath, entry.name);
            count += await countFinalFiles(subDirPath);
          }
        }
      } catch (error) {
        // 忽略无法访问的目录
      }
      return count;
    }

    const finalFileCount = await countFinalFiles(projectPath);
    logs.push(`   - 最终文件数量: ${finalFileCount}`);

    logs.push(`🎉 项目生成完成！`);
    console.log(`🎉 项目生成完成！`);

    return {
      success: true,
      message: `项目 ${projectName} 创建成功！

📁 项目路径: ${projectPath}
🛠️  技术栈: ${techStackToArray(normalizedTechStack).join(" + ")}
📦 文件数量: ${finalFileCount}

下一步:
  cd ${projectName}
  npm run dev`,
      projectPath,
      directoryTree,
      fileSummary,
      processLogs: logs,
    };
  } catch (error: any) {
    logs.push(`❌ 项目生成失败: ${error.message || error}`);
    console.error(`❌ 项目生成失败:`, error);
    return {
      success: false,
      message: `项目生成失败: ${error.message || error}`,
      processLogs: logs,
    };
  }
}
