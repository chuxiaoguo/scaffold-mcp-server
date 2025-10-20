// 模板管理器入口文件
export {
  VersionChecker,
  type TemplateVersion,
  type VersionConfig,
} from "./VersionChecker.js";
export { RemoteFetcher, type FetchResult, type RemoteFetcherConfig } from "./RemoteFetcher.js";
export { LocalManager, type UpdateResult } from "./LocalManager.js";

// 单例模式的模板管理器
import { LocalManager } from "./LocalManager.js";

let globalTemplateManager: LocalManager | null = null;

export function getTemplateManager(): LocalManager {
  if (!globalTemplateManager) {
    globalTemplateManager = new LocalManager();
  }
  return globalTemplateManager;
}

export function resetTemplateManager(): void {
  globalTemplateManager = null;
}
