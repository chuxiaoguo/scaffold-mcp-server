import * as fs from 'fs/promises';
import * as path from 'path';
import { VersionChecker, type VersionConfig } from "./VersionChecker.js";
import type { TemplatesConfigIndex, UnifiedTemplateInfo } from '../../types/index.js';
import { logger } from '../../utils/logger.js';
import {
  RemoteFetcher,
  type FetchResult,
  type RemoteFetcherConfig,
} from "./RemoteFetcher.js";

export interface UpdateResult {
  success: boolean;
  updated: boolean;
  error?: string;
  message?: string;
}

/**
 * 本地模板管理器（已禁用远程功能）
 * 负责协调版本检查，仅使用本地逻辑
 */
export class LocalManager {
  private versionChecker: VersionChecker;
  private templateDir: string;
  private configPath: string;

  constructor(templateDir?: string) {
    this.templateDir = templateDir || this.getDefaultTemplateDir();
    this.configPath = path.join(this.templateDir, "config.json");
    this.versionChecker = new VersionChecker(this.configPath, this.templateDir);
  }

  /**
   * 获取默认模板目录
   */
  private getDefaultTemplateDir(): string {
    return path.resolve(process.cwd(), "scaffold-template");
  }

  /**
   * 检查并更新模板（仅本地逻辑）
   */
  async updateTemplatesIfNeeded(): Promise<UpdateResult> {
    try {
      // 检查本地模板更新
      const updateInfo = await this.versionChecker.checkForUpdates();

      if (!updateInfo.hasUpdates) {
        return {
          success: true,
          updated: false,
          message: "本地模板已是最新状态",
        };
      }

      // 更新本地配置
      const currentConfig = await this.versionChecker.scanLocalTemplates();
      const updateSuccess = await this.versionChecker.updateLocalConfig(currentConfig);

      if (updateSuccess) {
        return {
          success: true,
          updated: true,
          message: `本地模板配置已更新，发现 ${updateInfo.newTemplates.length} 个新模板，${updateInfo.updates.length} 个更新`,
        };
      } else {
        return {
          success: false,
          updated: false,
          error: "更新本地配置失败",
        };
      }
    } catch (error: any) {
      console.error("更新模板时发生错误:", error);
      return {
        success: false,
        updated: false,
        error: `更新失败: ${error.message}`,
      };
    }
  }

  /**
   * 初始化配置（基于本地扫描）
   */
  async initializeConfig(): Promise<UpdateResult> {
    try {
      const success = await this.versionChecker.initializeConfig();
      
      if (success) {
        return {
          success: true,
          updated: true,
          message: "本地配置初始化成功",
        };
      } else {
        return {
          success: false,
          updated: false,
          error: "本地配置初始化失败",
        };
      }
    } catch (error: any) {
      return {
        success: false,
        updated: false,
        error: `初始化失败: ${error.message}`,
      };
    }
  }

  /**
   * 获取本地模板列表
   */
  async getLocalTemplates(): Promise<string[]> {
    try {
      const entries = await fs.readdir(this.templateDir, {
        withFileTypes: true,
      });
      return entries
        .filter((entry) => entry.isDirectory() && !entry.name.startsWith("."))
        .map((entry) => entry.name);
    } catch (error) {
      console.warn("获取本地模板列表失败:", error);
      return [];
    }
  }

  /**
   * 检查模板是否存在
   */
  async templateExists(templateName: string): Promise<boolean> {
    try {
      const templatePath = path.join(this.templateDir, templateName);
      await fs.access(templatePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 获取模板路径
   */
  getTemplatePath(templateName: string): string {
    return path.join(this.templateDir, templateName);
  }

  /**
   * 获取当前配置
   */
  async getCurrentConfig(): Promise<VersionConfig | null> {
    return await this.versionChecker.getLocalConfig();
  }

  /**
   * 初始化模板目录（如果不存在）
   */
  async initializeTemplateDir(): Promise<void> {
    try {
      await fs.mkdir(this.templateDir, { recursive: true });
    } catch (error) {
      console.warn("初始化模板目录失败:", error);
    }
  }

  /**
   * 获取模板统计信息
   */
  async getTemplateStats(): Promise<{
    totalTemplates: number;
    lastUpdated: string;
  }> {
    const templates = await this.getLocalTemplates();
    const config = await this.getCurrentConfig();

    return {
      totalTemplates: templates.length,
      lastUpdated: config?.lastCheck || "未知",
    };
  }
}
