import type { TechStack, GenerateOptions } from '../../types/index.js';
import { ViteBuilder } from './viteBuilder.js';
import { WebpackBuilder } from './webpackBuilder.js';
import { ElectronViteBuilder } from './electronViteBuilder.js';
import { UmiBuilder } from './umiBuilder.js';

export interface BuilderResult {
  files: Record<string, string>;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  scripts: Record<string, string>;
}

export interface IBuilder {
  build(techStack: TechStack, projectName: string, options?: GenerateOptions): Promise<BuilderResult>;
}

/**
 * 非固定模板构建器工厂
 */
export class NonFixedBuilder {
  private builders: Map<string, IBuilder> = new Map();

  constructor() {
    this.builders.set('vite', new ViteBuilder());
    this.builders.set('webpack', new WebpackBuilder());
    this.builders.set('electron-vite', new ElectronViteBuilder());
    this.builders.set('umi', new UmiBuilder());
  }

  /**
   * 构建项目
   */
  async build(techStack: TechStack, projectName: string, options?: GenerateOptions): Promise<BuilderResult> {
    const builderType = techStack.builder || 'vite'; // 默认使用 vite
    const builder = this.builders.get(builderType);

    if (!builder) {
      throw new Error(`Unsupported builder: ${builderType}`);
    }

    return await builder.build(techStack, projectName, options);
  }

  /**
   * 获取支持的构建器列表
   */
  getSupportedBuilders(): string[] {
    return Array.from(this.builders.keys());
  }
}

export { ViteBuilder, WebpackBuilder, ElectronViteBuilder };