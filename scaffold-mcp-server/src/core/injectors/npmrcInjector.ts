import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class NpmrcInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // 生成 .npmrc 文件
    result.files['.npmrc'] = this.generateNpmrc(techStack);

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // .npmrc 对使用特定包管理器的项目有用
    return techStack.packageManager !== undefined;
  }

  private generateNpmrc(techStack: TechStack): string {
    const config: string[] = [];

    // 基础配置
    config.push('# npm 配置文件');
    config.push('');

    // 根据包管理器添加相应配置
    if (techStack.packageManager === 'pnpm') {
      config.push('# pnpm 配置');
      config.push('shamefully-hoist=true');
      config.push('strict-peer-dependencies=false');
      config.push('auto-install-peers=true');
    } else if (techStack.packageManager === 'yarn') {
      config.push('# yarn 配置');
      config.push('registry=https://registry.npmjs.org/');
    } else {
      config.push('# npm 配置');
      config.push('registry=https://registry.npmjs.org/');
    }

    // 通用配置
    config.push('');
    config.push('# 安全配置');
    config.push('audit-level=moderate');
    config.push('fund=false');
    
    config.push('');
    config.push('# 性能配置');
    config.push('prefer-offline=true');
    config.push('progress=true');

    // 如果是 Electron 项目，添加相关配置
    if (techStack.builder === 'electron-vite') {
      config.push('');
      config.push('# Electron 配置');
      config.push('target_platform=darwin');
      config.push('target_arch=x64');
      config.push('cache_min=86400');
    }

    return config.join('\n');
  }
}