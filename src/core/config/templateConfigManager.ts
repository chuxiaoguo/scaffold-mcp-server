import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";
import type {
  TemplatesConfigIndex,
  UnifiedTemplateInfo,
} from "../../types/index.js";
import { logger } from "../../utils/logger.js";

// 获取 __dirname 的 ES 模块等价方式
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 模板配置管理器
 * - 优先读取本地 scaffold-template/templates.config.json
 * - 不存在时回退到缓存 .template-cache/config/templates.config.json
 * - 支持从远程仓库拉取并写入缓存（轻量）
 */
export interface ConfigLoadResult {
  config: TemplatesConfigIndex | null;
  logs: string[];
}

export class TemplateConfigManager {
  private cacheDir: string;
  private memoryCache: TemplatesConfigIndex | null = null;
  private lastLoadTime = 0;
  private reloadInterval = 30 * 60 * 1000; // 30分钟
  private currentLogs: string[] = [];

  constructor(options?: { cacheDir?: string; reloadInterval?: number }) {
    // 一次性算出 isBuilt 标志和 projectRoot
    const isBuilt = __dirname.includes("/dist") || __dirname.endsWith("dist");
    // 打包后：dist/core/config -> ../../../ (scaffold-mcp-server)
    // 开发环境：src/core/config -> ../../../ (scaffold-mcp-server)
    const projectRoot = path.resolve(__dirname, "../");
    this.cacheDir =
      options?.cacheDir || path.join(projectRoot, ".template-cache", "config");
    if (options?.reloadInterval) this.reloadInterval = options.reloadInterval;

    logger.info("[TemplateConfigManager] 初始化配置管理器");
    logger.info(`[TemplateConfigManager] 项目根目录: ${projectRoot}`);
    logger.info(`[TemplateConfigManager] 缓存目录: ${this.cacheDir}`);
    logger.info(
      `[TemplateConfigManager] 重载间隔: ${this.reloadInterval / 1000}秒`
    );
  }

  private addLog(message: string): void {
    this.currentLogs.push(message);
    console.log(message);
  }

  private clearLogs(): void {
    this.currentLogs = [];
  }

  private getLogs(): string[] {
    return [...this.currentLogs];
  }

  /** 从本地配置文件中获取远程配置URL */
  private getRemoteConfigUrl(localConfig: any): string | null {
    try {
      if (
        localConfig?.remoteConfig?.enabled &&
        localConfig?.remoteConfig?.repository?.url
      ) {
        const repo = localConfig.remoteConfig.repository;
        // 构建GitHub raw文件URL
        const baseUrl = repo.url.replace(
          "https://github.com/",
          "https://raw.githubusercontent.com/"
        );
        const remoteUrl = `${baseUrl}/${repo.branch}/${repo.targetFolder}`;
        this.addLog(
          `[TemplateConfigManager] 从本地配置解析远程URL: ${remoteUrl}`
        );
        return remoteUrl;
      } else {
        this.addLog("[TemplateConfigManager] 远程配置未启用或配置不完整");
        return null;
      }
    } catch (err) {
      this.addLog(
        `[TemplateConfigManager] 解析远程配置URL失败: ${err instanceof Error ? err.message : String(err)}`
      );
      return null;
    }
  }

  /** 获取完整的模板配置索引（智能版本检查优先） */
  async getTemplatesIndex(): Promise<ConfigLoadResult> {
    this.clearLogs();
    this.addLog("[TemplateConfigManager] 开始获取模板配置索引");

    const now = Date.now();
    const timeSinceLastLoad = now - this.lastLoadTime;

    // 检查内存缓存
    if (this.memoryCache && timeSinceLastLoad < this.reloadInterval) {
      this.addLog(
        `[TemplateConfigManager] 使用内存缓存 (距离上次加载: ${Math.round(timeSinceLastLoad / 1000)}秒)`
      );
      this.addLog(
        `[TemplateConfigManager] 缓存中包含 ${Object.keys(this.memoryCache.templates).length} 个模板`
      );
      return { config: this.memoryCache, logs: this.getLogs() };
    }

    this.addLog(
      "[TemplateConfigManager] 内存缓存过期或不存在，开始智能配置加载策略"
    );

    // 计算路径
    const isBuilt = __dirname.includes("/dist") || __dirname.endsWith("dist");
    // 无论打包还是开发环境，都向上3级到 scaffold-mcp-server
    const projectRoot = path.resolve(__dirname, "../");
    this.addLog(`[TemplateConfigManager] 项目根目录: ${projectRoot}`);
    this.addLog(`[TemplateConfigManager] 当前工作目录: ${process.cwd()}`);

    // 根据运行环境调整本地模板路径
    const localTemplatePath = isBuilt
      ? path.resolve(__dirname, "../../../dist/scaffold-template")
      : path.resolve(__dirname, "../../../scaffold-template");
    const localPath = path.join(localTemplatePath, "templates.config.json");
    this.addLog(
      `[TemplateConfigManager] 步骤1: 读取本地配置文件: ${localPath}`
    );

    const localConfig = await this.readJsonSafe(localPath);
    if (localConfig) {
      this.addLog("[TemplateConfigManager] ✅ 本地配置文件读取成功");
      this.addLog(
        `[TemplateConfigManager] 本地配置包含 ${Object.keys(localConfig.templates).length} 个模板`
      );
      this.addLog(
        `[TemplateConfigManager] 本地配置版本: ${localConfig.version}, 更新时间: ${localConfig.lastUpdated}`
      );
    } else {
      this.addLog("[TemplateConfigManager] ❌ 本地配置文件不存在或读取失败");
    }

    // 2. 尝试获取远程配置（如果本地配置中有远程配置信息）
    let remoteConfig: any = null;
    const remoteConfigUrl = this.getRemoteConfigUrl(localConfig);
    if (remoteConfigUrl) {
      this.addLog(
        `[TemplateConfigManager] 步骤2: 检查远程配置更新: ${remoteConfigUrl}`
      );
      try {
        remoteConfig = await this.fetchRemoteConfig(remoteConfigUrl);
        if (remoteConfig) {
          this.addLog("[TemplateConfigManager] ✅ 远程配置获取成功");
          this.addLog(
            `[TemplateConfigManager] 远程配置包含 ${Object.keys(remoteConfig.templates).length} 个模板`
          );
          this.addLog(
            `[TemplateConfigManager] 远程配置版本: ${remoteConfig.version}, 更新时间: ${remoteConfig.lastUpdated}`
          );
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        this.addLog(`[TemplateConfigManager] ❌ 远程配置获取失败: ${errorMsg}`);
      }
    } else {
      this.addLog(
        "[TemplateConfigManager] 步骤2: 本地配置中未找到远程配置信息，跳过远程配置检查"
      );
    }

    // 3. 版本比较和选择最新配置
    let selectedConfig: any = null;
    let configSource = "";

    if (remoteConfig && localConfig) {
      // 比较版本和更新时间
      const remoteTime = new Date(remoteConfig.lastUpdated).getTime();
      const localTime = new Date(localConfig.lastUpdated).getTime();

      if (remoteTime > localTime) {
        selectedConfig = remoteConfig;
        configSource = "远程配置（版本更新）";
        this.addLog("[TemplateConfigManager] 🔄 远程配置更新，选择远程配置");

        // 缓存远程配置到本地
        await this.cacheRemoteConfig(remoteConfig);
      } else {
        selectedConfig = localConfig;
        configSource = "本地配置（版本最新）";
        this.addLog(
          "[TemplateConfigManager] ✅ 本地配置为最新版本，选择本地配置"
        );
      }
    } else if (remoteConfig) {
      selectedConfig = remoteConfig;
      configSource = "远程配置（本地不可用）";
      this.addLog("[TemplateConfigManager] 📥 本地配置不可用，使用远程配置");

      // 缓存远程配置到本地
      await this.cacheRemoteConfig(remoteConfig);
    } else if (localConfig) {
      selectedConfig = localConfig;
      configSource = "本地配置（远程不可用）";
      this.addLog("[TemplateConfigManager] 📁 远程配置不可用，使用本地配置");
    }

    if (selectedConfig) {
      this.addLog(
        `[TemplateConfigManager] ✅ 配置加载成功，来源: ${configSource}`
      );
      this.memoryCache = selectedConfig as TemplatesConfigIndex;
      this.lastLoadTime = now;
      return { config: this.memoryCache, logs: this.getLogs() };
    }

    // 4. 如果都没有，尝试读取缓存配置作为后备
    if (!selectedConfig) {
      const cachedPath = path.join(this.cacheDir, "templates.config.json");
      this.addLog(
        `[TemplateConfigManager] 步骤4: 尝试读取缓存配置文件: ${cachedPath}`
      );

      const cachedConfig = await this.readJsonSafe(cachedPath);
      if (cachedConfig) {
        this.addLog("[TemplateConfigManager] ✅ 缓存配置文件读取成功");
        this.addLog(
          `[TemplateConfigManager] 缓存配置包含 ${Object.keys(cachedConfig.templates).length} 个模板`
        );
        this.addLog(
          `[TemplateConfigManager] 配置版本: ${cachedConfig.version}, 更新时间: ${cachedConfig.lastUpdated}`
        );

        selectedConfig = cachedConfig;
        configSource = "缓存配置（后备方案）";
        this.addLog("[TemplateConfigManager] 📦 使用缓存配置作为后备方案");
      } else {
        this.addLog("[TemplateConfigManager] ❌ 缓存配置文件不存在或读取失败");
      }
    }

    if (selectedConfig) {
      this.addLog(
        `[TemplateConfigManager] ✅ 配置加载成功，来源: ${configSource}`
      );
      this.memoryCache = selectedConfig as TemplatesConfigIndex;
      this.lastLoadTime = now;
      return { config: this.memoryCache, logs: this.getLogs() };
    }

    this.addLog("[TemplateConfigManager] ❌ 所有配置加载策略均失败，返回 null");
    return { config: null, logs: this.getLogs() };
  }

  /** 根据名称获取模板条目 */
  async getTemplateEntry(name: string): Promise<UnifiedTemplateInfo | null> {
    console.log(`[TemplateConfigManager] 获取模板条目: ${name}`);

    const result = await this.getTemplatesIndex();
    if (!result.config) {
      console.warn(
        `[TemplateConfigManager] 无法获取配置索引，模板 ${name} 查找失败`
      );
      return null;
    }

    const template = result.config.templates[name] || null;
    if (template) {
      console.log(`[TemplateConfigManager] ✅ 找到模板: ${name}`);
      console.log(
        `[TemplateConfigManager] 模板信息: ${template.description || "N/A"} v${template.version || "N/A"}`
      );
    } else {
      console.warn(`[TemplateConfigManager] ❌ 模板 ${name} 不存在`);
      console.log(
        `[TemplateConfigManager] 可用模板: ${Object.keys(result.config.templates).join(", ")}`
      );
    }

    return template;
  }

  /** 获取远程配置（不写入缓存） */
  private async fetchRemoteConfig(url: string): Promise<any | null> {
    this.addLog("[TemplateConfigManager] 开始获取远程配置");
    this.addLog(`[TemplateConfigManager] 远程URL: ${url}`);

    try {
      this.addLog("[TemplateConfigManager] 发起远程配置请求...");
      const startTime = Date.now();

      const res = await fetch(url);
      const fetchTime = Date.now() - startTime;

      this.addLog(
        `[TemplateConfigManager] 远程请求完成 (耗时: ${fetchTime}ms, 状态: ${res.status})`
      );

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const json = await res.text();
      const configSize = json.length;
      this.addLog(
        `[TemplateConfigManager] 远程配置下载成功 (大小: ${configSize} 字节)`
      );

      // 验证 JSON 格式
      try {
        const parsed = JSON.parse(json);
        this.addLog(
          `[TemplateConfigManager] 配置JSON解析成功，包含 ${Object.keys(parsed.templates || {}).length} 个模板`
        );
        return parsed;
      } catch (parseErr) {
        const parseErrorMsg =
          parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`配置JSON格式无效: ${parseErrorMsg}`);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.addLog(`[TemplateConfigManager] ❌ 远程配置获取失败: ${errorMsg}`);

      // 详细错误信息
      if (err instanceof TypeError && err.message.includes("fetch")) {
        this.addLog(
          "[TemplateConfigManager] 网络连接失败，可能是网络问题或URL不可访问"
        );
      } else if (err instanceof Error && err.message.includes("HTTP")) {
        this.addLog(
          "[TemplateConfigManager] HTTP请求失败，可能是服务器问题或资源不存在"
        );
      }

      throw err; // 重新抛出以便上层处理
    }
  }

  /** 缓存远程配置到本地 */
  private async cacheRemoteConfig(config: any): Promise<void> {
    try {
      this.addLog(
        `[TemplateConfigManager] 缓存远程配置到本地: ${this.cacheDir}`
      );

      // 确保缓存目录存在
      await fs.mkdir(this.cacheDir, { recursive: true });

      // 写入缓存文件
      const cacheFilePath = path.join(this.cacheDir, "templates.config.json");
      await fs.writeFile(
        cacheFilePath,
        JSON.stringify(config, null, 2),
        "utf-8"
      );

      this.addLog("[TemplateConfigManager] ✅ 远程配置缓存完成");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.addLog(`[TemplateConfigManager] ❌ 远程配置缓存失败: ${errorMsg}`);
    }
  }

  /** 刷新远程配置并写入缓存（轻量原子） - 已废弃，使用新的智能配置加载策略 */
  private async refreshRemoteConfig(): Promise<void> {
    this.addLog(
      "[TemplateConfigManager] refreshRemoteConfig方法已废弃，请使用getTemplatesIndex的智能配置加载策略"
    );
  }

  /** 安全读取 JSON 文件 */
  private async readJsonSafe(filePath: string): Promise<any | null> {
    try {
      this.addLog(`[TemplateConfigManager] 尝试读取文件: ${filePath}`);
      const content = await fs.readFile(filePath, "utf-8");
      const parsed = JSON.parse(content);
      this.addLog(
        `[TemplateConfigManager] ✅ 文件读取成功 (大小: ${content.length} 字节)`
      );
      return parsed;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      this.addLog(`[TemplateConfigManager] ❌ 文件读取失败: ${errorMsg}`);
      
      // 尝试备用路径
      if (filePath.includes("scaffold-template") || filePath.includes("templates.config.json")) {
        const backupPath = path.join(
          path.dirname(__dirname),
          "scaffold-mcp-server",
          "dist",
          "scaffold-template",
          "templates.config.json"
        );
        
        if (backupPath !== filePath) {
          this.addLog(`[TemplateConfigManager] 尝试备用路径: ${backupPath}`);
          try {
            const backupContent = await fs.readFile(backupPath, "utf-8");
            const backupParsed = JSON.parse(backupContent);
            this.addLog(
              `[TemplateConfigManager] ✅ 备用路径文件读取成功 (大小: ${backupContent.length} 字节)`
            );
            return backupParsed;
          } catch (backupErr) {
            const backupErrorMsg = backupErr instanceof Error ? backupErr.message : String(backupErr);
            this.addLog(`[TemplateConfigManager] ❌ 备用路径读取失败: ${backupErrorMsg}`);
          }
        }
      }
      
      return null;
    }
  }
}

// 单例导出
let singleton: TemplateConfigManager | null = null;
export function getTemplateConfigManager(): TemplateConfigManager {
  if (!singleton) {
    console.log("[TemplateConfigManager] 创建单例实例");
    singleton = new TemplateConfigManager();
  }
  return singleton;
}
