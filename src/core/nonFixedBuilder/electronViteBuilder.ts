import type { TechStack, GenerateOptions } from '../../types/index.js';
import type { IBuilder, BuilderResult } from './index.js';

export class ElectronViteBuilder implements IBuilder {
  async build(techStack: TechStack, projectName: string, options?: GenerateOptions): Promise<BuilderResult> {
    const framework = techStack.framework || 'vue3';
    const language = techStack.language || 'typescript';
    const packageManager = techStack.packageManager || 'pnpm';

    const files: Record<string, string> = {};
    const dependencies: Record<string, string> = {};
    const devDependencies: Record<string, string> = {};
    const scripts: Record<string, string> = {};

    // Electron 基础依赖
    devDependencies['electron'] = '^28.0.0';
    devDependencies['electron-vite'] = '^2.0.0';
    devDependencies['vite'] = '^5.0.0';
    devDependencies['electron-builder'] = '^24.9.0';

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

    // Electron 脚本
    scripts['dev'] = 'electron-vite dev';
    scripts['build'] = 'electron-vite build';
    scripts['preview'] = 'electron-vite preview';
    scripts['build:win'] = 'electron-vite build && electron-builder --win';
    scripts['build:mac'] = 'electron-vite build && electron-builder --mac';
    scripts['build:linux'] = 'electron-vite build && electron-builder --linux';
    scripts['lint'] = 'eslint src --ext .ts,.tsx,.js,.jsx,.vue';
    scripts['format'] = 'prettier --write src';
    scripts['test'] = 'jest';

    // 生成配置文件
    files['electron.vite.config.ts'] = this.generateElectronViteConfig(techStack);
    files['electron-builder.yml'] = this.generateElectronBuilderConfig(projectName);
    files['.gitignore'] = this.generateGitignore();
    files['README.md'] = this.generateReadme(projectName, techStack, packageManager);

    // 生成 Electron 主进程文件
    files['src/main/index.ts'] = this.generateMainProcess();
    files['src/preload/index.ts'] = this.generatePreloadScript();

    // 生成渲染进程文件
    files['src/renderer/index.html'] = this.generateRendererHtml(projectName);
    
    if (framework === 'vue3') {
      files['src/renderer/src/main.ts'] = this.generateVue3Main(techStack);
      files['src/renderer/src/App.vue'] = this.generateVue3App(techStack);
    } else if (framework === 'react') {
      files['src/renderer/src/main.tsx'] = this.generateReactMain(techStack);
      files['src/renderer/src/App.tsx'] = this.generateReactApp(techStack);
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

  private generateElectronViteConfig(techStack: TechStack): string {
    const framework = techStack.framework || 'vue3';
    const plugins = [];

    if (framework === 'vue3') {
      plugins.push('vue()');
    } else if (framework === 'react') {
      plugins.push('react()');
    }

    return `import { resolve } from 'path'
import { defineConfig, externalizeDepsPlugin } from 'electron-vite'
${framework === 'vue3' ? "import vue from '@vitejs/plugin-vue'" : "import react from '@vitejs/plugin-react'"}

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()]
  },
  preload: {
    plugins: [externalizeDepsPlugin()]
  },
  renderer: {
    resolve: {
      alias: {
        '@renderer': resolve('src/renderer/src')
      }
    },
    plugins: [${plugins.join(', ')}]
  }
})`;
  }

  private generateElectronBuilderConfig(projectName: string): string {
    return `appId: com.electron.${projectName.toLowerCase()}
productName: ${projectName}
directories:
  buildResources: build
files:
  - '!**/.vscode/*'
  - '!src/*'
  - '!electron.vite.config.*'
  - '!{.eslintignore,.eslintrc.cjs,.prettierignore,.prettierrc.yaml,dev-app-update.yml,CHANGELOG.md,README.md}'
  - '!{.env,.env.*,.npmrc,pnpm-lock.yaml}'
asarUnpack:
  - resources/**
win:
  executableName: ${projectName}
nsis:
  artifactName: \${name}-\${version}-setup.\${ext}
  shortcutName: \${productName}
  uninstallDisplayName: \${productName}
  createDesktopShortcut: always
mac:
  entitlementsInherit: build/entitlements.mac.plist
  extendInfo:
    - NSCameraUsageDescription: Application requests access to device's camera.
    - NSMicrophoneUsageDescription: Application requests access to device's microphone.
    - NSDocumentsFolderUsageDescription: Application requests access to user's Documents folder.
    - NSDownloadsFolderUsageDescription: Application requests access to user's Downloads folder.
dmg:
  artifactName: \${name}-\${version}.\${ext}
linux:
  target:
    - AppImage
    - snap
    - deb
  maintainer: electronjs.org
  category: Utility
appImage:
  artifactName: \${name}-\${version}.\${ext}
npmRebuild: false
publish:
  provider: generic
  url: https://example.com/auto-updates`;
  }

  private generateMainProcess(): string {
    return `import { app, shell, BrowserWindow } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s main process
// code. You can also put them in separate files and require them here.`;
  }

  private generatePreloadScript(): string {
    return `import { contextBridge } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {}

// Use \`contextBridge\` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}`;
  }

  private generateRendererHtml(projectName: string): string {
    return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>${projectName}</title>
    <!-- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP -->
    <meta
      http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    />
  </head>

  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
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
*.sw?

# Electron
out/
app/
release/`;
  }

  private generateReadme(projectName: string, techStack: TechStack, packageManager: string): string {
    const framework = techStack.framework || 'vue3';
    const language = techStack.language || 'typescript';
    
    return `# ${projectName}

An Electron application with ${framework} + Vite + ${language}.

## Tech Stack

- Electron
- ${framework === 'vue3' ? 'Vue 3' : 'React'}
- Vite
- ${language === 'typescript' ? 'TypeScript' : 'JavaScript'}
${techStack.router ? `- ${techStack.router}` : ''}
${techStack.state ? `- ${techStack.state}` : ''}
${techStack.ui ? `- ${techStack.ui}` : ''}
${techStack.style ? `- ${techStack.style}` : ''}

## Recommended IDE Setup

- [VSCode](https://code.visualstudio.com/) + [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) + [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)

## Project Setup

### Install

\`\`\`bash
${packageManager} install
\`\`\`

### Development

\`\`\`bash
${packageManager} run dev
\`\`\`

### Build

\`\`\`bash
# For windows
${packageManager} run build:win

# For macOS
${packageManager} run build:mac

# For Linux
${packageManager} run build:linux
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
      imports.push("import './assets/index.css'");
    }

    return `${imports.join('\n')}

const app = createApp(App)

${appSetup.join('\n')}

app.mount('#root')`;
  }

  private generateVue3App(techStack: TechStack): string {
    return `<template>
  <div id="app">
    <h1>Welcome to Electron + Vue 3</h1>
    <p>This is an Electron + Vue 3 + Vite + ${techStack.language || 'TypeScript'} application.</p>
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
    imports.push("import { createRoot } from 'react-dom/client'");
    imports.push("import App from './App'");

    if (techStack.style === 'less') {
      imports.push("import './assets/index.less'");
    } else {
      imports.push("import './assets/index.css'");
    }

    return `${imports.join('\n')}

const container = document.getElementById('root') as HTMLElement
const root = createRoot(container)

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)`;
  }

  private generateReactApp(techStack: TechStack): string {
    return `import React from 'react'

function App(): JSX.Element {
  return (
    <div className="App">
      <h1>Welcome to Electron + React</h1>
      <p>This is an Electron + React + Vite + ${techStack.language || 'TypeScript'} application.</p>
    </div>
  )
}

export default App`;
  }
}