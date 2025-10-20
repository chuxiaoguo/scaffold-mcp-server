import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import type { TechStack } from '../types/index';

export interface TemplateConfig {
  name: string;
  description: string;
  command: string;
  args: string[];
  postProcess?: (projectPath: string) => Promise<void>;
}

/**
 * 固定模板配置
 */
export const FIXED_TEMPLATES: Record<string, TemplateConfig> = {
  'vue3-vite-typescript': {
    name: 'vue3-vite-typescript',
    description: 'Vue3 + Vite + TypeScript 项目模板',
    command: 'npm',
    args: ['create', 'vite@latest', '.', '--', '--template', 'vue-ts'],
    postProcess: async (projectPath: string) => {
      // 配置 Tailwind CSS
      await setupTailwindCSS(projectPath);
      
      // 配置 Element Plus 自动导入
      await setupElementPlusAutoImport(projectPath);
      
      // 配置路由和状态管理
      await setupVueRouter(projectPath);
      await setupPinia(projectPath);
    }
  },
  
  'electron-vite-vue3': {
    name: 'electron-vite-vue3',
    description: 'Electron + Vite + Vue3 + TypeScript 项目模板',
    command: 'npm',
    args: ['create', 'electron-vite@latest', '.', '--', '--template', 'vue-ts'],
    postProcess: async (projectPath: string) => {
      // 配置 Tailwind CSS
      await setupTailwindCSS(projectPath);
      
      // 配置 Element Plus 自动导入
      await setupElementPlusAutoImport(projectPath);
      
      // 配置路由和状态管理
      await setupVueRouter(projectPath);
      await setupPinia(projectPath);
    }
  },
  
  'react-webpack-typescript': {
    name: 'react-webpack-typescript',
    description: 'React + Webpack + TypeScript 项目模板',
    command: 'npx',
    args: ['create-react-app@latest', '.', '--template', 'typescript'],
    postProcess: async (projectPath: string) => {
      // 配置 Craco 支持 Less 和 Antd
      await setupCracoConfig(projectPath);
      
      // 更新 package.json scripts
      await updatePackageJsonScripts(projectPath, {
        'start': 'craco start',
        'build': 'craco build',
        'test': 'craco test'
      });
    }
  },
  
  'umijs': {
    name: 'umijs',
    description: 'UmiJS + React + Antd 项目模板',
    command: 'npx',
    args: ['create-umi@latest', '.'],
    postProcess: async (projectPath: string) => {
      // UmiJS 通常会在交互式创建过程中配置 Antd
      // 这里可以添加额外的配置
    }
  }
};

/**
 * 模板生成器类
 */
export class TemplateGenerator {
  private cacheDir: string;
  
  constructor(cacheDir: string = path.join(process.cwd(), '.template-cache')) {
    this.cacheDir = cacheDir;
  }
  
  /**
   * 匹配固定模板
   */
  matchTemplate(techStack: string | string[] | TechStack): TemplateConfig | null {
    const stackStr = this.normalizeTechStack(techStack);
    
    // 匹配逻辑
    if (stackStr.includes('vue3') && stackStr.includes('vite') && stackStr.includes('typescript')) {
      return FIXED_TEMPLATES['vue3-vite-typescript'] || null;
    }
    
    if (stackStr.includes('electron') && stackStr.includes('vue3')) {
      return FIXED_TEMPLATES['electron-vite-vue3'] || null;
    }
    
    if (stackStr.includes('react') && stackStr.includes('webpack') && stackStr.includes('typescript')) {
      return FIXED_TEMPLATES['react-webpack-typescript'] || null;
    }
    
    if (stackStr.includes('umijs') || stackStr.includes('umi')) {
      return FIXED_TEMPLATES['umijs'] || null;
    }
    
    return null;
  }
  
  /**
   * 生成模板项目
   */
  async generateTemplate(
    template: TemplateConfig,
    projectName: string,
    targetPath: string,
    useCache: boolean = true
  ): Promise<void> {
    const cacheKey = `${template.name}-${this.getTemplateHash(template)}`;
    const cachedPath = path.join(this.cacheDir, cacheKey);
    
    // 检查缓存
    if (useCache && await this.isCacheValid(cachedPath)) {
      console.log(`使用缓存模板: ${cacheKey}`);
      await this.copyFromCache(cachedPath, targetPath, projectName);
      return;
    }
    
    // 创建临时目录
    const tempDir = path.join(this.cacheDir, `temp-${Date.now()}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      // 使用官方脚手架工具生成项目
      await this.runScaffoldCommand(template, tempDir);
      
      // 执行后处理
      if (template.postProcess) {
        await template.postProcess(tempDir);
      }
      
      // 保存到缓存
      if (useCache) {
        await this.saveToCache(tempDir, cachedPath);
      }
      
      // 复制到目标路径
      await this.copyFromCache(tempDir, targetPath, projectName);
      
    } finally {
      // 清理临时目录
      await fs.rm(tempDir, { recursive: true, force: true });
    }
  }
  
  /**
   * 规范化技术栈
   */
  private normalizeTechStack(techStack: string | string[] | TechStack): string {
    if (typeof techStack === 'string') {
      return techStack.toLowerCase();
    }
    
    if (Array.isArray(techStack)) {
      return techStack.join(' ').toLowerCase();
    }
    
    // TechStack 对象
    return Object.values(techStack).filter(Boolean).join(' ').toLowerCase();
  }
  
  /**
   * 执行脚手架命令
   */
  private async runScaffoldCommand(template: TemplateConfig, targetDir: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const child = spawn(template.command, template.args, {
        cwd: targetDir,
        stdio: 'pipe',
        shell: true
      });
      
      let output = '';
      let errorOutput = '';
      
      child.stdout?.on('data', (data) => {
        output += data.toString();
        console.log(data.toString());
      });
      
      child.stderr?.on('data', (data) => {
        errorOutput += data.toString();
        console.error(data.toString());
      });
      
      // 处理交互式输入
      child.stdin?.write('\n'); // 默认选择
      
      child.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`脚手架命令执行失败，退出码: ${code}\n${errorOutput}`));
        }
      });
      
      child.on('error', reject);
    });
  }
  
  /**
   * 检查缓存是否有效
   */
  private async isCacheValid(cachePath: string): Promise<boolean> {
    try {
      const stats = await fs.stat(cachePath);
      // 缓存有效期 24 小时
      const maxAge = 24 * 60 * 60 * 1000;
      return Date.now() - stats.mtime.getTime() < maxAge;
    } catch {
      return false;
    }
  }
  
  /**
   * 保存到缓存
   */
  private async saveToCache(sourceDir: string, cacheDir: string): Promise<void> {
    await fs.mkdir(path.dirname(cacheDir), { recursive: true });
    await this.copyDirectory(sourceDir, cacheDir);
  }
  
  /**
   * 从缓存复制
   */
  private async copyFromCache(cacheDir: string, targetDir: string, projectName: string): Promise<void> {
    await fs.mkdir(targetDir, { recursive: true });
    await this.copyDirectory(cacheDir, targetDir);
    
    // 更新 package.json 中的项目名称
    await this.updateProjectName(targetDir, projectName);
  }
  
  /**
   * 复制目录
   */
  private async copyDirectory(source: string, target: string): Promise<void> {
    const entries = await fs.readdir(source, { withFileTypes: true });
    
    for (const entry of entries) {
      const sourcePath = path.join(source, entry.name);
      const targetPath = path.join(target, entry.name);
      
      if (entry.isDirectory()) {
        await fs.mkdir(targetPath, { recursive: true });
        await this.copyDirectory(sourcePath, targetPath);
      } else {
        await fs.copyFile(sourcePath, targetPath);
      }
    }
  }
  
  /**
   * 更新项目名称
   */
  private async updateProjectName(projectDir: string, projectName: string): Promise<void> {
    const packageJsonPath = path.join(projectDir, 'package.json');
    
    try {
      const content = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(content);
      packageJson.name = projectName;
      
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    } catch (error) {
      console.warn('更新 package.json 项目名称失败:', error);
    }
  }
  
  /**
   * 获取模板哈希
   */
  private getTemplateHash(template: TemplateConfig): string {
    const content = JSON.stringify({
      command: template.command,
      args: template.args
    });
    
    // 简单哈希
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为 32 位整数
    }
    
    return Math.abs(hash).toString(16);
  }
}



/**
 * 配置 Tailwind CSS
 */
async function setupTailwindCSS(projectPath: string): Promise<void> {
  // 创建 tailwind.config.js
  const tailwindConfig = `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;
  
  await fs.writeFile(path.join(projectPath, 'tailwind.config.js'), tailwindConfig);
  
  // 创建 postcss.config.js
  const postcssConfig = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;
  
  await fs.writeFile(path.join(projectPath, 'postcss.config.js'), postcssConfig);
  
  // 更新 CSS 文件
  const cssContent = `@tailwind base;
@tailwind components;
@tailwind utilities;`;
  
  await fs.writeFile(path.join(projectPath, 'src/style.css'), cssContent);
}

/**
 * 配置 Element Plus 自动导入
 */
async function setupElementPlusAutoImport(projectPath: string): Promise<void> {
  const viteConfigPath = path.join(projectPath, 'vite.config.ts');
  
  try {
    let content = await fs.readFile(viteConfigPath, 'utf-8');
    
    // 添加导入
    content = content.replace(
      "import { defineConfig } from 'vite'",
      `import { defineConfig } from 'vite'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'`
    );
    
    // 添加插件配置
    content = content.replace(
      'plugins: [vue()]',
      `plugins: [
    vue(),
    AutoImport({
      resolvers: [ElementPlusResolver()],
    }),
    Components({
      resolvers: [ElementPlusResolver()],
    }),
  ]`
    );
    
    await fs.writeFile(viteConfigPath, content);
  } catch (error) {
    console.warn('配置 Element Plus 自动导入失败:', error);
  }
}

/**
 * 配置 Vue Router
 */
async function setupVueRouter(projectPath: string): Promise<void> {
  const routerContent = `import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: Home
  },
  {
    path: '/about',
    name: 'About',
    component: () => import('../views/About.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router`;
  
  await fs.mkdir(path.join(projectPath, 'src/router'), { recursive: true });
  await fs.writeFile(path.join(projectPath, 'src/router/index.ts'), routerContent);
  
  // 创建视图文件
  await fs.mkdir(path.join(projectPath, 'src/views'), { recursive: true });
  
  const homeView = `<template>
  <div class="home">
    <h1>Welcome to Vue 3 + Vite + TypeScript</h1>
    <p>This is the home page.</p>
  </div>
</template>

<script setup lang="ts">
// Home page logic
</script>`;
  
  const aboutView = `<template>
  <div class="about">
    <h1>About</h1>
    <p>This is the about page.</p>
  </div>
</template>

<script setup lang="ts">
// About page logic
</script>`;
  
  await fs.writeFile(path.join(projectPath, 'src/views/Home.vue'), homeView);
  await fs.writeFile(path.join(projectPath, 'src/views/About.vue'), aboutView);
}

/**
 * 配置 Pinia
 */
async function setupPinia(projectPath: string): Promise<void> {
  const storeContent = `import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', {
  state: () => ({
    count: 0
  }),
  
  getters: {
    doubleCount: (state) => state.count * 2
  },
  
  actions: {
    increment() {
      this.count++
    },
    
    decrement() {
      this.count--
    }
  }
})`;
  
  await fs.mkdir(path.join(projectPath, 'src/stores'), { recursive: true });
  await fs.writeFile(path.join(projectPath, 'src/stores/counter.ts'), storeContent);
}

/**
 * 配置 Craco
 */
async function setupCracoConfig(projectPath: string): Promise<void> {
  const cracoConfig = `const CracoLessPlugin = require('craco-less');

module.exports = {
  plugins: [
    {
      plugin: CracoLessPlugin,
      options: {
        lessLoaderOptions: {
          lessOptions: {
            modifyVars: {
              '@primary-color': '#1DA57A',
            },
            javascriptEnabled: true,
          },
        },
      },
    },
  ],
};`;
  
  await fs.writeFile(path.join(projectPath, 'craco.config.js'), cracoConfig);
}

/**
 * 更新 package.json scripts
 */
async function updatePackageJsonScripts(projectPath: string, scripts: Record<string, string>): Promise<void> {
  const packageJsonPath = path.join(projectPath, 'package.json');
  
  try {
    const content = await fs.readFile(packageJsonPath, 'utf-8');
    const packageJson = JSON.parse(content);
    
    packageJson.scripts = {
      ...packageJson.scripts,
      ...scripts
    };
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  } catch (error) {
    console.warn('更新 package.json scripts 失败:', error);
  }
}