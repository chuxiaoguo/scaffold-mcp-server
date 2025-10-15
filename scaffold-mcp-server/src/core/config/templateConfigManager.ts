import * as path from 'path';
import * as fs from 'fs/promises';
import { fileURLToPath } from 'url';
import type { TemplatesConfigIndex, UnifiedTemplateInfo } from '../../types/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 模板配置管理器
 * - 优先读取本地 scaffold-template/templates.config.json
 * - 不存在时回退到缓存 .template-cache/config/templates.config.json
 * - 支持从远程仓库拉取并写入缓存（轻量）
 */
export class TemplateConfigManager {
  private cacheDir: string;
  private remoteConfigUrl: string;
  private memoryCache: TemplatesConfigIndex | null = null;
  private lastLoadTime = 0;
  private reloadInterval = 30 * 60 * 1000; // 30分钟

  constructor(options?: { cacheDir?: string; remoteConfigUrl?: string; reloadInterval?: number }) {
    this.cacheDir = options?.cacheDir || path.join(process.cwd(), '.template-cache', 'config');
    this.remoteConfigUrl = options?.remoteConfigUrl ||
      'https://raw.githubusercontent.com/chuxiaoguo/scaffold-mcp-server/mac/scaffold-template/templates.config.json';
    if (options?.reloadInterval) this.reloadInterval = options.reloadInterval;
  }

  /** 获取完整的模板配置索引（内存缓存优先） */
  async getTemplatesIndex(): Promise<TemplatesConfigIndex | null> {
    const now = Date.now();
    if (this.memoryCache && now - this.lastLoadTime < this.reloadInterval) {
      return this.memoryCache;
    }

    // 1. 读取本地源码中的配置文件
    const localPath = path.resolve(__dirname, '../../..', 'scaffold-template', 'templates.config.json');
    const localConfig = await this.readJsonSafe(localPath);
    if (localConfig) {
      this.memoryCache = localConfig as TemplatesConfigIndex;
      this.lastLoadTime = now;
      return this.memoryCache;
    }

    // 2. 读取缓存中的配置文件
    const cachedPath = path.join(this.cacheDir, 'templates.config.json');
    const cachedConfig = await this.readJsonSafe(cachedPath);
    if (cachedConfig) {
      this.memoryCache = cachedConfig as TemplatesConfigIndex;
      this.lastLoadTime = now;
      // 异步尝试刷新远程配置
      this.refreshRemoteConfig().catch(() => {});
      return this.memoryCache;
    }

    // 3. 远程拉取（首次）
    await this.refreshRemoteConfig();
    const refreshed = await this.readJsonSafe(cachedPath);
    if (refreshed) {
      this.memoryCache = refreshed as TemplatesConfigIndex;
      this.lastLoadTime = now;
      return this.memoryCache;
    }

    return null;
  }

  /** 根据名称获取模板条目 */
  async getTemplateEntry(name: string): Promise<UnifiedTemplateInfo | null> {
    const index = await this.getTemplatesIndex();
    if (!index) return null;
    return index.templates[name] || null;
  }

  /** 刷新远程配置并写入缓存（轻量原子） */
  private async refreshRemoteConfig(): Promise<void> {
    try {
      const res = await fetch(this.remoteConfigUrl);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const json = await res.text();
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.writeFile(path.join(this.cacheDir, 'templates.config.json'), json, 'utf-8');
    } catch (err) {
      console.warn('远程配置刷新失败，跳过：', err);
    }
  }

  /** 安全读取 JSON 文件 */
  private async readJsonSafe(filePath: string): Promise<any | null> {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      return JSON.parse(content);
    } catch {
      return null;
    }
  }
}

// 单例导出
let singleton: TemplateConfigManager | null = null;
export function getTemplateConfigManager(): TemplateConfigManager {
  if (!singleton) {
    singleton = new TemplateConfigManager();
  }
  return singleton;
}