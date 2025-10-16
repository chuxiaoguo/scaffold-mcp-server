import type { TechStack } from '../types/index.js';

/**
 * 解析技术栈字符串或数组
 */
export function parseTechStack(techStack: string | string[]): TechStack {
  const result: TechStack = {};
  
  if (typeof techStack === 'string') {
    // 解析字符串格式，如 "vue3+ts+vite"
    const parts = techStack.toLowerCase().split(/[+\-_]/);
    
    parts.forEach(part => {
      switch (part) {
        case 'vue3':
        case 'vue':
          result.framework = 'vue3';
          break;
        case 'react':
          result.framework = 'react';
          break;
        case 'ts':
        case 'typescript':
          result.language = 'typescript';
          break;
        case 'js':
        case 'javascript':
          result.language = 'javascript';
          break;
        case 'vite':
          result.builder = 'vite';
          break;
        case 'webpack':
          result.builder = 'webpack';
          break;
        case 'electron':
        case 'electron-vite':
          result.builder = 'electron-vite';
          break;
        case 'umi':
        case 'umijs':
          result.builder = 'umi';
          result.framework = 'react';
          break;
        case 'pinia':
          result.state = 'pinia';
          break;
        case 'vuex':
          result.state = 'vuex';
          break;
        case 'redux':
          result.state = 'redux';
          break;
        case 'zustand':
          result.state = 'zustand';
          break;
        case 'router':
        case 'vue-router':
          result.router = 'vue-router';
          break;
        case 'react-router':
          result.router = 'react-router';
          break;
        case 'element':
        case 'element-plus':
          result.ui = 'element-plus';
          break;
        case 'antd':
        case 'ant-design':
          result.ui = 'antd';
          break;
        case 'antd-vue':
          result.ui = 'antd-vue';
          break;
        case 'sass':
        case 'scss':
          result.style = 'sass';
          break;
        case 'less':
          result.style = 'less';
          break;
        case 'tailwind':
        case 'tailwindcss':
          result.style = 'tailwindcss';
          break;
        case 'pnpm':
          result.packageManager = 'pnpm';
          break;
        case 'yarn':
          result.packageManager = 'yarn';
          break;
        case 'npm':
          result.packageManager = 'npm';
          break;
      }
    });
  } else if (Array.isArray(techStack)) {
    // 处理数组格式
    techStack.forEach(tech => {
      const parsed = parseTechStack(tech);
      Object.assign(result, parsed);
    });
  }

  // 设置默认值
  if (!result.language) {
    result.language = 'typescript';
  }
  if (!result.builder) {
    result.builder = 'vite';
  }
  if (!result.packageManager) {
    result.packageManager = 'npm';
  }

  return result;
}

/**
 * 将技术栈转换为字符串数组格式
 */
export function techStackToArray(techStack: TechStack): string[] {
  return [
    techStack.framework,
    techStack.builder,
    techStack.language,
    techStack.style,
    techStack.ui,
    techStack.state,
    techStack.router,
    techStack.packageManager
  ].filter(Boolean) as string[];
}

/**
 * 处理 buildTool 参数映射到 builder
 */
export function normalizeTechStack(tech_stack: any): TechStack {
  const techStack = typeof tech_stack === 'string' || Array.isArray(tech_stack) 
    ? parseTechStack(tech_stack) 
    : tech_stack;
  
  // 处理 buildTool 参数映射到 builder
  if (typeof tech_stack === 'object' && tech_stack !== null && !Array.isArray(tech_stack)) {
    const objStack = tech_stack as any;
    if (objStack.buildTool) {
      techStack.builder = objStack.buildTool;
    }
    if (objStack.framework) {
      techStack.framework = objStack.framework;
    }
    if (objStack.language) {
      techStack.language = objStack.language;
    }
  }
  
  return techStack;
}