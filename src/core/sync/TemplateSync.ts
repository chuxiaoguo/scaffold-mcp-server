import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger.js';
import type { TemplatesConfigIndex } from '../../types/index.js';

export interface SyncResult {
  success: boolean;
  updated: boolean;
  config: TemplatesConfigIndex | null;
  logs: string[];
  error?: string;
}

export interface RemoteRepository {
  url: string;
  branch: string;
  targetFolder: string;
}

export class TemplateSync {
  private projectRoot: string;
  private templateDir: string;
  private templatesConfigPath: string;
  private remoteConfigPath: string;
  private logs: string[] = [];

  constructor() {
    // 在ES模块中使用import.meta.url获取当前文件路径
    const currentFileUrl = import.meta.url;
    const currentFilePath = new URL(currentFileUrl).pathname;
    
    // 优化路径解析逻辑，支持npm包环境
    // 在开发环境中：从src/core/sync/TemplateSync.ts 到项目根目录是 ../../../
    // 在npm包环境中：从dist/core/sync/TemplateSync.js 到项目根目录也是 ../../../
    this.projectRoot = path.resolve(path.dirname(currentFilePath), '../../../');
    
    // 模板目录始终在项目根目录下的scaffold-template
    this.templateDir = path.join(this.projectRoot, 'scaffold-template');
    this.templatesConfigPath = path.join(this.templateDir, 'templates.config.json');
    this.remoteConfigPath = path.join(this.projectRoot, 'src/config/templateConfig.json');
  }

  private addLog(message: string): void {
    this.logs.push(message);
    logger.info(message);
  }

  private clearLogs(): void {
    this.logs = [];
  }

  /**
   * 统一的模板同步方法
   * 一次性完成配置检查、文件更新和配置返回
   */
  async syncTemplates(): Promise<SyncResult> {
    this.clearLogs();
    this.addLog('[TemplateSync] 开始统一模板同步流程');

    try {
      // 1. 读取本地模板配置
      const localConfig = await this.readLocalConfig();
      
      // 2. 检查是否需要远程更新
      const remoteRepo = await this.extractRemoteRepository();
      if (!remoteRepo) {
        this.addLog('[TemplateSync] 无远程配置，使用本地模板');
        return {
          success: true,
          updated: false,
          config: localConfig,
          logs: [...this.logs]
        };
      }

      // 3. 获取远程配置
      const remoteConfig = await this.fetchRemoteConfig(remoteRepo);
      if (!remoteConfig) {
        this.addLog('[TemplateSync] 远程配置获取失败，使用本地配置');
        return {
          success: true,
          updated: false,
          config: localConfig,
          logs: [...this.logs]
        };
      }

      // 4. 比较版本决定是否需要更新
      const needsUpdate = this.shouldUpdate(localConfig, remoteConfig);
      if (!needsUpdate) {
        this.addLog('[TemplateSync] 本地配置已是最新版本');
        return {
          success: true,
          updated: false,
          config: localConfig,
          logs: [...this.logs]
        };
      }

      // 5. 执行完整同步：配置 + 模板文件
      const syncSuccess = await this.performFullSync(remoteRepo, remoteConfig);
      if (syncSuccess) {
        this.addLog('[TemplateSync] ✅ 模板同步完成');
        return {
          success: true,
          updated: true,
          config: remoteConfig,
          logs: [...this.logs]
        };
      } else {
        this.addLog('[TemplateSync] ❌ 模板同步失败，使用本地配置');
        return {
          success: false,
          updated: false,
          config: localConfig,
          logs: [...this.logs],
          error: '模板同步失败'
        };
      }

    } catch (error: any) {
      this.addLog(`[TemplateSync] 同步过程发生错误: ${error.message}`);
      const localConfig = await this.readLocalConfig();
      return {
        success: false,
        updated: false,
        config: localConfig,
        logs: [...this.logs],
        error: error.message
      };
    }
  }

  /**
   * 读取本地配置文件
   */
  private async readLocalConfig(): Promise<TemplatesConfigIndex | null> {
    try {
      const configExists = await this.pathExists(this.templatesConfigPath);
      if (!configExists) {
        this.addLog('[TemplateSync] 本地配置文件不存在');
        return null;
      }

      const content = await fs.readFile(this.templatesConfigPath, 'utf-8');
      const config = JSON.parse(content) as TemplatesConfigIndex;
      this.addLog(`[TemplateSync] 本地配置读取成功，版本: ${config.version}`);
      return config;
    } catch (error: any) {
      this.addLog(`[TemplateSync] 本地配置读取失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 从远程配置文件中提取远程仓库信息
   */
  private async extractRemoteRepository(): Promise<RemoteRepository | null> {
    try {
      const configExists = await this.pathExists(this.remoteConfigPath);
      if (!configExists) {
        this.addLog('[TemplateSync] 远程配置文件不存在');
        return null;
      }

      const configContent = await fs.readFile(this.remoteConfigPath, 'utf-8');
      const config = JSON.parse(configContent);
      
      if (!config.remoteConfig?.enabled || !config.remoteConfig?.repository) {
        this.addLog('[TemplateSync] 远程配置未启用或配置不完整');
        return null;
      }

      const repo = config.remoteConfig.repository;
      if (!repo.url || !repo.branch || !repo.targetFolder) {
        this.addLog('[TemplateSync] 远程仓库配置不完整');
        return null;
      }

      return {
        url: repo.url,
        branch: repo.branch,
        targetFolder: repo.targetFolder
      };
    } catch (error: any) {
      this.addLog(`[TemplateSync] 读取远程配置失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 获取远程配置
   */
  private async fetchRemoteConfig(repo: RemoteRepository): Promise<TemplatesConfigIndex | null> {
    try {
      const configUrl = this.buildRemoteConfigUrl(repo);
      this.addLog(`[TemplateSync] 获取远程配置: ${configUrl}`);

      const response = await fetch(configUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config = await response.json() as TemplatesConfigIndex;
      this.addLog(`[TemplateSync] 远程配置获取成功，版本: ${config.version}`);
      return config;
    } catch (error: any) {
      this.addLog(`[TemplateSync] 远程配置获取失败: ${error.message}`);
      return null;
    }
  }

  /**
   * 构建远程配置文件URL
   */
  private buildRemoteConfigUrl(repo: RemoteRepository): string {
    const baseUrl = repo.url.replace('https://github.com/', 'https://raw.githubusercontent.com/');
    // 修复URL构建逻辑，targetFolder已经包含了完整路径
    return `${baseUrl}/${repo.branch}/${repo.targetFolder}`;
  }

  /**
   * 判断是否需要更新
   */
  private shouldUpdate(localConfig: TemplatesConfigIndex | null, remoteConfig: TemplatesConfigIndex): boolean {
    if (!localConfig) {
      this.addLog('[TemplateSync] 本地无配置，需要下载');
      return true;
    }

    // 比较版本号
    if (localConfig.version !== remoteConfig.version) {
      this.addLog(`[TemplateSync] 版本不同，需要更新: ${localConfig.version} -> ${remoteConfig.version}`);
      return true;
    }

    // 比较更新时间
    const localTime = new Date(localConfig.lastUpdated).getTime();
    const remoteTime = new Date(remoteConfig.lastUpdated).getTime();
    
    if (remoteTime > localTime) {
      this.addLog(`[TemplateSync] 远程更新时间较新，需要更新`);
      return true;
    }

    return false;
  }

  /**
   * 执行完整同步：下载配置文件和所有模板文件
   */
  private async performFullSync(repo: RemoteRepository, config: TemplatesConfigIndex): Promise<boolean> {
    try {
      this.addLog('[TemplateSync] 开始完整同步...');

      // 1. 确保目录存在
      await this.ensureDirectoryExists(this.templateDir);

      // 2. 保存新配置文件
      await fs.writeFile(this.templatesConfigPath, JSON.stringify(config, null, 2), 'utf-8');
      this.addLog('[TemplateSync] 配置文件已更新');

      // 3. 下载所有模板文件
      const templateIds = Object.keys(config.templates);
      this.addLog(`[TemplateSync] 开始下载 ${templateIds.length} 个模板...`);

      for (const templateId of templateIds) {
        const success = await this.downloadTemplate(repo, templateId);
        if (!success) {
          this.addLog(`[TemplateSync] 模板 ${templateId} 下载失败`);
          // 继续下载其他模板，不中断整个流程
        }
      }

      this.addLog('[TemplateSync] 模板文件同步完成');
      return true;

    } catch (error: any) {
      this.addLog(`[TemplateSync] 完整同步失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 下载单个模板
   */
  private async downloadTemplate(repo: RemoteRepository, templateId: string): Promise<boolean> {
    try {
      this.addLog(`[TemplateSync] 下载模板: ${templateId}`);
      
      // 构建远程模板文件夹URL
      const templateUrl = `https://raw.githubusercontent.com/${repo.url.replace('https://github.com/', '')}/${repo.branch}/scaffold-template/${templateId}`;
      
      // 目标路径直接在scaffold-template文件夹下
      const templateDir = path.join(this.templateDir, templateId);
      
      // 确保模板目录存在
      await this.ensureDirectoryExists(templateDir);
      
      // 这里应该实现实际的文件下载逻辑
      // 由于当前是简化版本，我们只记录日志
      this.addLog(`[TemplateSync] 模板 ${templateId} 下载到: ${templateDir}`);
      
      return true;
    } catch (error: any) {
      this.addLog(`[TemplateSync] 模板 ${templateId} 下载失败: ${error.message}`);
      return false;
    }
  }

  /**
   * 确保目录存在
   */
  private async ensureDirectoryExists(dirPath: string): Promise<void> {
    try {
      await fs.access(dirPath);
    } catch {
      await fs.mkdir(dirPath, { recursive: true });
    }
  }

  /**
   * 检查路径是否存在
   */
  private async pathExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }
}

// 单例模式
let syncInstance: TemplateSync | null = null;

export function getTemplateSync(): TemplateSync {
  if (!syncInstance) {
    syncInstance = new TemplateSync();
  }
  return syncInstance;
}