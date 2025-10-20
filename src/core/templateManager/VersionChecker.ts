import * as fs from "fs/promises";
import * as path from "path";

export interface TemplateVersion {
  name: string;
  version: string;
  lastUpdated: string;
  description?: string;
}

export interface VersionConfig {
  templates: TemplateVersion[];
  lastCheck: string;
  remoteUrl?: string;
}

/**
 * 版本检查器
 * 负责检查和管理模板版本（仅本地逻辑）
 */
export class VersionChecker {
  private configPath: string;
  private templatesPath: string;

  constructor(configPath: string, templatesPath: string) {
    this.configPath = configPath;
    this.templatesPath = templatesPath;
  }

  /**
   * 获取本地配置
   */
  async getLocalConfig(): Promise<VersionConfig | null> {
    try {
      const configExists = await this.pathExists(this.configPath);
      if (!configExists) {
        console.log("本地配置文件不存在，将创建默认配置");
        return null;
      }

      const configContent = await fs.readFile(this.configPath, "utf-8");
      const config = JSON.parse(configContent) as VersionConfig;

      console.log("成功读取本地配置:", config);
      return config;
    } catch (error: any) {
      console.error("读取本地配置失败:", error);
      return null;
    }
  }

  /**
   * 获取远程配置（已禁用，返回null）
   */
  async getRemoteConfig(): Promise<VersionConfig | null> {
    console.log("远程配置拉取功能已禁用");
    return null;
  }

  /**
   * 扫描本地模板目录，生成版本配置
   */
  async scanLocalTemplates(): Promise<VersionConfig> {
    const templates: TemplateVersion[] = [];
    
    try {
      const templatesExist = await this.pathExists(this.templatesPath);
      if (!templatesExist) {
        console.log("模板目录不存在:", this.templatesPath);
        return {
          templates: [],
          lastCheck: new Date().toISOString(),
        };
      }

      const entries = await fs.readdir(this.templatesPath, { withFileTypes: true });
      
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const templatePath = path.join(this.templatesPath, entry.name);
          const packageJsonPath = path.join(templatePath, "package.json");
          
          let version = "1.0.0";
          let description = "";
          
          // 尝试从package.json读取版本信息
          try {
            const packageJsonExists = await this.pathExists(packageJsonPath);
            if (packageJsonExists) {
              const packageContent = await fs.readFile(packageJsonPath, "utf-8");
              const packageJson = JSON.parse(packageContent);
              version = packageJson.version || "1.0.0";
              description = packageJson.description || "";
            }
          } catch (error) {
            console.warn(`读取模板 ${entry.name} 的package.json失败:`, error);
          }
          
          templates.push({
            name: entry.name,
            version,
            lastUpdated: new Date().toISOString(),
            description,
          });
        }
      }
    } catch (error: any) {
      console.error("扫描本地模板失败:", error);
    }

    return {
      templates,
      lastCheck: new Date().toISOString(),
    };
  }

  /**
   * 检查更新（仅基于本地扫描）
   */
  async checkForUpdates(): Promise<{
    hasUpdates: boolean;
    updates: TemplateVersion[];
    newTemplates: TemplateVersion[];
  }> {
    console.log("开始检查模板更新...");

    const localConfig = await this.getLocalConfig();
    const currentConfig = await this.scanLocalTemplates();

    if (!localConfig) {
      // 如果没有本地配置，所有当前模板都是新的
      return {
        hasUpdates: true,
        updates: [],
        newTemplates: currentConfig.templates,
      };
    }

    const updates: TemplateVersion[] = [];
    const newTemplates: TemplateVersion[] = [];

    // 检查新模板和更新的模板
    for (const currentTemplate of currentConfig.templates) {
      const localTemplate = localConfig.templates.find(
        (t) => t.name === currentTemplate.name
      );

      if (!localTemplate) {
        // 新模板
        newTemplates.push(currentTemplate);
      } else if (localTemplate.version !== currentTemplate.version) {
        // 版本更新
        updates.push(currentTemplate);
      }
    }

    const hasUpdates = updates.length > 0 || newTemplates.length > 0;

    console.log("更新检查完成:", {
      hasUpdates,
      updatesCount: updates.length,
      newTemplatesCount: newTemplates.length,
    });

    return {
      hasUpdates,
      updates,
      newTemplates,
    };
  }

  /**
   * 更新本地配置
   */
  async updateLocalConfig(config: VersionConfig): Promise<boolean> {
    try {
      // 确保配置目录存在
      const configDir = path.dirname(this.configPath);
      await fs.mkdir(configDir, { recursive: true });

      // 写入配置文件
      const configContent = JSON.stringify(config, null, 2);
      await fs.writeFile(this.configPath, configContent, "utf-8");

      console.log("本地配置更新成功:", this.configPath);
      return true;
    } catch (error: any) {
      console.error("更新本地配置失败:", error);
      return false;
    }
  }

  /**
   * 初始化配置（基于本地扫描）
   */
  async initializeConfig(): Promise<boolean> {
    try {
      const config = await this.scanLocalTemplates();
      return await this.updateLocalConfig(config);
    } catch (error: any) {
      console.error("初始化配置失败:", error);
      return false;
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