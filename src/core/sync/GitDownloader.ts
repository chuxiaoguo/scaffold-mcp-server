import * as fs from 'fs/promises';
import * as path from 'path';
import { logger } from '../../utils/logger.js';

export interface DownloadOptions {
  url: string;
  branch: string;
  targetFolder: string;
  localPath: string;
  templateId?: string;
}

export interface DownloadResult {
  success: boolean;
  message: string;
  error?: string;
}

export class GitDownloader {
  /**
   * 下载整个模板文件夹
   */
  async downloadTemplateFolder(options: DownloadOptions): Promise<DownloadResult> {
    try {
      logger.info(`[GitDownloader] 开始下载模板文件夹: ${options.targetFolder}`);
      
      // 构建下载URL（使用GitHub的zip下载）
      const zipUrl = this.buildZipDownloadUrl(options.url, options.branch);
      logger.info(`[GitDownloader] 下载URL: ${zipUrl}`);

      // 下载zip文件
      const response = await fetch(zipUrl);
      if (!response.ok) {
        throw new Error(`下载失败: HTTP ${response.status}`);
      }

      const arrayBuffer = await response.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // 创建临时文件
      const tempZipPath = path.join(options.localPath, 'temp-download.zip');
      await this.ensureDirectoryExists(path.dirname(tempZipPath));
      await fs.writeFile(tempZipPath, buffer);

      // 解压文件
      const extractResult = await this.extractZipFile(tempZipPath, options.localPath, options.targetFolder);
      
      // 清理临时文件
      try {
        await fs.unlink(tempZipPath);
      } catch (error) {
        logger.warn(`[GitDownloader] 清理临时文件失败: ${error}`);
      }

      if (extractResult.success) {
        logger.info(`[GitDownloader] 模板文件夹下载成功`);
        return {
          success: true,
          message: '模板文件夹下载成功'
        };
      } else {
        return extractResult;
      }

    } catch (error: any) {
      logger.error(`[GitDownloader] 下载失败: ${error.message}`);
      return {
        success: false,
        message: '下载失败',
        error: error.message
      };
    }
  }

  /**
   * 下载单个模板
   */
  async downloadSingleTemplate(options: DownloadOptions & { templateId: string }): Promise<DownloadResult> {
    try {
      logger.info(`[GitDownloader] 开始下载单个模板: ${options.templateId}`);
      
      // 对于单个模板，我们需要下载整个仓库然后提取特定文件夹
      const tempOptions = {
        ...options,
        localPath: path.join(options.localPath, '.temp-download')
      };

      // 先下载整个文件夹
      const downloadResult = await this.downloadTemplateFolder(tempOptions);
      if (!downloadResult.success) {
        return downloadResult;
      }

      // 移动特定模板到目标位置
      const sourceTemplatePath = path.join(tempOptions.localPath, options.templateId);
      const targetTemplatePath = path.join(options.localPath, options.templateId);

      const templateExists = await this.pathExists(sourceTemplatePath);
      if (!templateExists) {
        return {
          success: false,
          message: `模板 ${options.templateId} 不存在`,
          error: `源路径不存在: ${sourceTemplatePath}`
        };
      }

      // 确保目标目录存在
      await this.ensureDirectoryExists(path.dirname(targetTemplatePath));
      
      // 如果目标已存在，先删除
      if (await this.pathExists(targetTemplatePath)) {
        await fs.rm(targetTemplatePath, { recursive: true, force: true });
      }

      // 移动文件夹
      await fs.rename(sourceTemplatePath, targetTemplatePath);

      // 清理临时目录
      try {
        await fs.rm(tempOptions.localPath, { recursive: true, force: true });
      } catch (error) {
        logger.warn(`[GitDownloader] 清理临时目录失败: ${error}`);
      }

      logger.info(`[GitDownloader] 单个模板下载成功: ${options.templateId}`);
      return {
        success: true,
        message: `模板 ${options.templateId} 下载成功`
      };

    } catch (error: any) {
      logger.error(`[GitDownloader] 单个模板下载失败: ${error.message}`);
      return {
        success: false,
        message: '单个模板下载失败',
        error: error.message
      };
    }
  }

  /**
   * 构建GitHub zip下载URL
   */
  private buildZipDownloadUrl(repoUrl: string, branch: string): string {
    // 将 https://github.com/user/repo.git 转换为 https://github.com/user/repo/archive/refs/heads/branch.zip
    const cleanUrl = repoUrl.replace(/\.git$/, '');
    return `${cleanUrl}/archive/refs/heads/${branch}.zip`;
  }

  /**
   * 解压zip文件（简化版本，实际项目中可能需要使用专门的zip库）
   */
  private async extractZipFile(zipPath: string, extractPath: string, targetFolder: string): Promise<DownloadResult> {
    try {
      // 这里需要使用zip解压库，比如 yauzl 或 adm-zip
      // 为了简化示例，这里返回一个占位实现
      logger.warn(`[GitDownloader] ZIP解压功能需要实现，当前为占位实现`);
      
      // TODO: 实现实际的zip解压逻辑
      // 1. 解压zip文件
      // 2. 找到目标文件夹（通常是 repo-name-branch/target-folder）
      // 3. 将内容移动到正确位置
      
      return {
        success: false,
        message: 'ZIP解压功能待实现',
        error: 'ZIP解压功能需要添加zip库依赖'
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'ZIP解压失败',
        error: error.message
      };
    }
  }

  /**
   * 使用git命令下载（备选方案）
   */
  async downloadWithGitCommand(options: DownloadOptions): Promise<DownloadResult> {
    try {
      logger.info(`[GitDownloader] 使用git命令下载: ${options.url}`);
      
      // 这里可以使用 child_process 执行 git 命令
      // 例如: git clone --depth 1 --branch ${branch} ${url} ${localPath}
      
      logger.warn(`[GitDownloader] Git命令下载功能需要实现`);
      
      // TODO: 实现git命令执行
      // const { spawn } = require('child_process');
      // 执行 git clone 命令
      
      return {
        success: false,
        message: 'Git命令下载功能待实现',
        error: 'Git命令下载功能需要实现child_process调用'
      };

    } catch (error: any) {
      return {
        success: false,
        message: 'Git命令下载失败',
        error: error.message
      };
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