import * as fs from "fs/promises";
import * as path from "path";

export interface FetchResult {
  success: boolean;
  message: string;
  targetPath?: string;
  error?: any;
}

export interface RemoteFetcherConfig {
  enabled: boolean;
  repository: string;
  branch: string;
  targetFolder: string;
  checkInterval: number;
  fallbackToLocal: boolean;
}

/**
 * 远程模板拉取器（已禁用远程功能，仅保留本地逻辑）
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export class RemoteFetcher {
  /**
   * 检查路径是否存在
   */
  private static async pathExists(path: string): Promise<boolean> {
    try {
      await fs.access(path);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 验证远程配置
   */
  static validateRemoteConfig(config: RemoteFetcherConfig): ValidationResult {
    const errors: string[] = [];

    if (!config.repository || config.repository.trim() === '') {
      errors.push('仓库地址不能为空');
    }

    if (!config.branch || config.branch.trim() === '') {
      errors.push('分支名称不能为空');
    }

    if (!config.targetFolder || config.targetFolder.trim() === '') {
      errors.push('目标文件夹不能为空');
    }

    if (config.checkInterval < 0) {
      errors.push('检查间隔不能为负数');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * 拉取远程模板（已禁用，直接返回失败）
   */
  static async fetchRemoteTemplates(
    remoteConfig: RemoteFetcherConfig,
    destinationPath: string
  ): Promise<FetchResult> {
    console.log("远程拉取功能已禁用，使用本地模板");
    
    return {
      success: false,
      message: "远程拉取功能已禁用，请使用本地模板",
    };
  }
}
