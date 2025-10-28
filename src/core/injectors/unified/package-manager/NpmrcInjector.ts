import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * .npmrc 配置文件注入器
 * 优先级: 5 (最高优先级，所有项目都需要)
 *
 * 作用：
 * - 配置 npm 镜像源（阿里云镜像）
 * - 提升依赖安装速度
 * - 解决国内网络访问 npm 官方源慢的问题
 */
export class NpmrcInjector extends AbstractUnifiedInjector {
  name = "npmrc";
  priority = 5; // 最高优先级，在所有注入器之前执行
  category = InjectorCategory.LANGUAGE; // 归类为语言层（基础配置）

  /**
   * 所有项目都需要 .npmrc
   */
  override canHandle(tools: string[]): boolean {
    return true; // 始终返回 true，表示所有项目都需要
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs } = context;

    try {
      this.addLog(logs, "开始注入 .npmrc 配置");

      // 生成 .npmrc 文件
      const npmrcContent = this.generateNpmrcContent();
      files[".npmrc"] = npmrcContent;

      this.addLog(logs, "✅ .npmrc 配置注入完成");
      this.addLog(logs, "  - 已配置阿里云镜像源");
      this.addLog(logs, "  - 已优化依赖安装速度");

      return {
        files,
        packageJson,
        logs,
        success: true,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `❌ .npmrc 注入失败: ${errorMsg}`);
      return {
        files,
        packageJson,
        logs,
        success: false,
        errors: [errorMsg],
      };
    }
  }

  /**
   * 生成 .npmrc 配置内容
   */
  private generateNpmrcContent(): string {
    return `# npm 镜像源配置
# 使用阿里云镜像源，提升国内依赖安装速度

# npm 官方镜像源（阿里云）
registry=https://registry.npmmirror.com

# 二进制文件镜像源
sass_binary_site=https://npmmirror.com/mirrors/node-sass
phantomjs_cdnurl=https://npmmirror.com/mirrors/phantomjs
electron_mirror=https://npmmirror.com/mirrors/electron
chromedriver_cdnurl=https://npmmirror.com/mirrors/chromedriver

# 其他常用镜像源
puppeteer_download_host=https://npmmirror.com/mirrors
sentrycli_cdnurl=https://npmmirror.com/mirrors/sentry-cli

# 禁用严格的 SSL 检查（可选，解决某些网络环境问题）
# strict-ssl=false

# 保存依赖时使用精确版本（推荐）
save-exact=true

# 自动安装 peer dependencies（npm 7+ 默认不自动安装）
legacy-peer-deps=true
`;
  }
}
