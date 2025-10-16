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
    this.remoteConfigUrl = options?.remoteConfigUrl || '';
    if (options?.reloadInterval) this.reloadInterval = options.reloadInterval;
    
    console.log('[TemplateConfigManager] 初始化配置管理器');
    console.log(`[TemplateConfigManager] 缓存目录: ${this.cacheDir}`);
    console.log(`[TemplateConfigManager] 远程配置URL: ${this.remoteConfigUrl}`);
    console.log(`[TemplateConfigManager] 重载间隔: ${this.reloadInterval / 1000}秒`);
  }

  /** 获取完整的模板配置索引（内存缓存优先） */
  async getTemplatesIndex(): Promise<TemplatesConfigIndex | null> {
    console.log('[TemplateConfigManager] 开始获取模板配置索引');
    
    const now = Date.now();
    const timeSinceLastLoad = now - this.lastLoadTime;
    
    // 检查内存缓存
    if (this.memoryCache && timeSinceLastLoad < this.reloadInterval) {
      console.log(`[TemplateConfigManager] 使用内存缓存 (距离上次加载: ${Math.round(timeSinceLastLoad / 1000)}秒)`);
      console.log(`[TemplateConfigManager] 缓存中包含 ${Object.keys(this.memoryCache.templates).length} 个模板`);
      return this.memoryCache;
    }

    console.log('[TemplateConfigManager] 内存缓存过期或不存在，开始三级配置加载策略');

    // 1. 读取本地源码中的配置文件
    const localPath = path.resolve(__dirname, '../../..', 'scaffold-template', 'templates.config.json');
    console.log(`[TemplateConfigManager] 步骤1: 尝试读取本地配置文件: ${localPath}`);
    
    const localConfig = await this.readJsonSafe(localPath);
    if (localConfig) {
      console.log('[TemplateConfigManager] ✅ 本地配置文件读取成功');
      console.log(`[TemplateConfigManager] 本地配置包含 ${Object.keys(localConfig.templates).length} 个模板`);
      console.log(`[TemplateConfigManager] 配置版本: ${localConfig.version}, 更新时间: ${localConfig.lastUpdated}`);
      
      this.memoryCache = localConfig as TemplatesConfigIndex;
      this.lastLoadTime = now;
      return this.memoryCache;
    }
    
    console.log('[TemplateConfigManager] ❌ 本地配置文件不存在或读取失败');

    // 2. 读取缓存中的配置文件
    const cachedPath = path.join(this.cacheDir, 'templates.config.json');
    console.log(`[TemplateConfigManager] 步骤2: 尝试读取缓存配置文件: ${cachedPath}`);
    
    const cachedConfig = await this.readJsonSafe(cachedPath);
    if (cachedConfig) {
      console.log('[TemplateConfigManager] ✅ 缓存配置文件读取成功');
      console.log(`[TemplateConfigManager] 缓存配置包含 ${Object.keys(cachedConfig.templates).length} 个模板`);
      console.log(`[TemplateConfigManager] 配置版本: ${cachedConfig.version}, 更新时间: ${cachedConfig.lastUpdated}`);
      
      this.memoryCache = cachedConfig as TemplatesConfigIndex;
      this.lastLoadTime = now;
      
      // 异步尝试刷新远程配置
      console.log('[TemplateConfigManager] 启动异步远程配置刷新');
      this.refreshRemoteConfig().catch((err) => {
        console.warn('[TemplateConfigManager] 异步远程配置刷新失败:', err.message);
      });
      
      return this.memoryCache;
    }
    
    console.log('[TemplateConfigManager] ❌ 缓存配置文件不存在或读取失败');

    // 3. 远程拉取（首次）
    console.log('[TemplateConfigManager] 步骤3: 尝试远程拉取配置（首次加载）');
    
    // 如果没有配置远程URL，返回空配置
    if (!this.remoteConfigUrl) {
      console.log('[TemplateConfigManager] ❌ 未配置远程URL，无法获取模板配置');
      console.log('[TemplateConfigManager] 建议：请确保本地存在 scaffold-template/templates.config.json 文件');
      return null;
    }
    
    await this.refreshRemoteConfig();
    
    const refreshed = await this.readJsonSafe(cachedPath);
    if (refreshed) {
      console.log('[TemplateConfigManager] ✅ 远程配置拉取并缓存成功');
      console.log(`[TemplateConfigManager] 远程配置包含 ${Object.keys(refreshed.templates).length} 个模板`);
      console.log(`[TemplateConfigManager] 配置版本: ${refreshed.version}, 更新时间: ${refreshed.lastUpdated}`);
      
      this.memoryCache = refreshed as TemplatesConfigIndex;
      this.lastLoadTime = now;
      return this.memoryCache;
    }

    console.error('[TemplateConfigManager] ❌ 所有配置加载策略均失败，返回 null');
    return null;
  }

  /** 根据名称获取模板条目 */
  async getTemplateEntry(name: string): Promise<UnifiedTemplateInfo | null> {
    console.log(`[TemplateConfigManager] 获取模板条目: ${name}`);
    
    const index = await this.getTemplatesIndex();
    if (!index) {
      console.warn(`[TemplateConfigManager] 无法获取配置索引，模板 ${name} 查找失败`);
      return null;
    }
    
    const template = index.templates[name] || null;
    if (template) {
      console.log(`[TemplateConfigManager] ✅ 找到模板: ${name}`);
      console.log(`[TemplateConfigManager] 模板信息: ${template.description || 'N/A'} v${template.version || 'N/A'}`);
    } else {
      console.warn(`[TemplateConfigManager] ❌ 模板 ${name} 不存在`);
      console.log(`[TemplateConfigManager] 可用模板: ${Object.keys(index.templates).join(', ')}`);
    }
    
    return template;
  }

  /** 刷新远程配置并写入缓存（轻量原子） */
  private async refreshRemoteConfig(): Promise<void> {
    // 如果没有配置远程URL，跳过远程拉取
    if (!this.remoteConfigUrl) {
      console.log('[TemplateConfigManager] 未配置远程URL，跳过远程配置拉取');
      return;
    }
    
    console.log('[TemplateConfigManager] 开始刷新远程配置');
    console.log(`[TemplateConfigManager] 远程URL: ${this.remoteConfigUrl}`);
    
    try {
      console.log('[TemplateConfigManager] 发起远程配置请求...');
      const startTime = Date.now();
      
      const res = await fetch(this.remoteConfigUrl);
      const fetchTime = Date.now() - startTime;
      
      console.log(`[TemplateConfigManager] 远程请求完成 (耗时: ${fetchTime}ms, 状态: ${res.status})`);
      
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      
      const json = await res.text();
      const configSize = json.length;
      console.log(`[TemplateConfigManager] 远程配置下载成功 (大小: ${configSize} 字节)`);
      
      // 验证 JSON 格式
      try {
        const parsed = JSON.parse(json);
        console.log(`[TemplateConfigManager] 配置JSON解析成功，包含 ${Object.keys(parsed.templates || {}).length} 个模板`);
      } catch (parseErr) {
        const parseErrorMsg = parseErr instanceof Error ? parseErr.message : String(parseErr);
        throw new Error(`配置JSON格式无效: ${parseErrorMsg}`);
      }
      
      // 确保缓存目录存在
      console.log(`[TemplateConfigManager] 创建缓存目录: ${this.cacheDir}`);
      await fs.mkdir(this.cacheDir, { recursive: true });
      
      // 写入缓存文件
      const cacheFilePath = path.join(this.cacheDir, 'templates.config.json');
      console.log(`[TemplateConfigManager] 写入缓存文件: ${cacheFilePath}`);
      await fs.writeFile(cacheFilePath, json, 'utf-8');
      
      console.log('[TemplateConfigManager] ✅ 远程配置刷新完成');
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn(`[TemplateConfigManager] ❌ 远程配置刷新失败: ${errorMsg}`);
      
      // 详细错误信息
      if (err instanceof TypeError && err.message.includes('fetch')) {
        console.warn('[TemplateConfigManager] 网络连接失败，可能是网络问题或URL不可访问');
      } else if (err instanceof Error && err.message.includes('HTTP')) {
        console.warn('[TemplateConfigManager] HTTP请求失败，可能是服务器问题或资源不存在');
      }
      
      throw err; // 重新抛出以便上层处理
    }
  }

  /** 安全读取 JSON 文件 */
  private async readJsonSafe(filePath: string): Promise<any | null> {
    try {
      console.log(`[TemplateConfigManager] 尝试读取文件: ${filePath}`);
      const content = await fs.readFile(filePath, 'utf-8');
      const parsed = JSON.parse(content);
      console.log(`[TemplateConfigManager] ✅ 文件读取成功 (大小: ${content.length} 字节)`);
      return parsed;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.log(`[TemplateConfigManager] ❌ 文件读取失败: ${errorMsg}`);
      return null;
    }
  }
}

// 单例导出
let singleton: TemplateConfigManager | null = null;
export function getTemplateConfigManager(): TemplateConfigManager {
  if (!singleton) {
    console.log('[TemplateConfigManager] 创建单例实例');
    singleton = new TemplateConfigManager();
  }
  return singleton;
}