/**
 * 消息模板系统
 * 统一管理所有用户可见的消息模板
 */

export interface TemplateData {
  [key: string]: any;
}

/**
 * 消息模板类
 */
export class MessageTemplates {
  /**
   * 成功消息模板
   */
  static readonly SUCCESS_TEMPLATE = `✅ 脚手架生成成功！

📁 项目名称: {{projectName}}
📍 生成路径: {{targetPath}}
🔧 模板来源: {{templateSource}}

📊 生成统计:
- 总文件数: {{fileCount}}
- 目录结构: 
{{directoryTree}}

{{processLogs}}🎉 项目已成功创建，可以开始开发了！

💡 快速开始:
  cd {{projectName}}
  npm install
  npm start`;

  /**
   * 错误消息模板
   */
  static readonly ERROR_TEMPLATE = `❌ 脚手架生成失败！

📁 项目名称: {{projectName}}
📍 目标路径: {{targetPath}}
🔧 失败原因: {{errorMessage}}

📊 生成统计:
- 总文件数: {{fileCount}}
- 目录结构: {{directoryStructure}}

{{processLogs}}💡 建议:
1. 检查网络连接是否正常
2. 确认模板配置是否正确
3. 查看详细错误日志`;

  /**
   * 简单错误消息模板
   */
  static readonly SIMPLE_ERROR_TEMPLATE = `❌ 脚手架生成失败: {{errorMessage}}`;

  /**
   * 项目信息模板
   */
  static readonly PROJECT_INFO_TEMPLATE = `📁 项目名称: {{projectName}}
📍 生成路径: {{targetPath}}
🔧 模板来源: {{templateSource}}
📊 总文件数: {{fileCount}}`;

  /**
   * 过程日志模板
   */
  static readonly PROCESS_LOGS_TEMPLATE = `🔍 过程日志:
{{logs}}

`;

  /**
   * 快速开始指南模板
   */
  static readonly QUICK_START_TEMPLATE = `💡 快速开始:
  cd {{projectName}}
  npm install
  npm start`;

  /**
   * 建议信息模板
   */
  static readonly SUGGESTIONS_TEMPLATE = `💡 建议:
{{suggestions}}`;

  /**
   * 提示词消息模板
   */
  static readonly PROMPT_TEMPLATE = `🎯 项目脚手架构建提示词

📁 项目名称: {{projectName}}

---

{{prompt}}

---

{{processLogs}}💡 使用说明:
请将上述提示词提供给 AI 助手，让其根据提示词自主构建完整的项目结构和文件。
AI 助手将根据提示词中的详细规范，生成一个完整、可运行的项目脚手架。`;

  /**
   * 渲染模板
   */
  static render(template: string, data: TemplateData): string {
    let result = template;

    // 替换所有的 {{key}} 占位符
    Object.entries(data).forEach(([key, value]) => {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      const stringValue =
        value !== undefined && value !== null ? String(value) : "";
      result = result.replace(placeholder, stringValue);
    });

    // 清理未替换的占位符
    result = result.replace(/\{\{[^}]+\}\}/g, "");

    return result;
  }

  /**
   * 渲染成功消息
   */
  static renderSuccess(data: {
    projectName: string;
    targetPath: string;
    templateSource?: string;
    fileCount: number;
    directoryTree: string;
    processLogs?: string;
  }): string {
    return this.render(this.SUCCESS_TEMPLATE, {
      ...data,
      templateSource: data.templateSource || "未知",
      processLogs: data.processLogs || "",
    });
  }

  /**
   * 渲染错误消息
   */
  static renderError(data: {
    projectName?: string;
    targetPath?: string;
    errorMessage: string;
    fileCount?: number;
    directoryStructure?: string;
    processLogs?: string;
  }): string {
    if (!data.projectName && !data.targetPath) {
      return this.render(this.SIMPLE_ERROR_TEMPLATE, data);
    }

    return this.render(this.ERROR_TEMPLATE, {
      projectName: data.projectName || "未知",
      targetPath: data.targetPath || "未知",
      errorMessage: data.errorMessage,
      fileCount: data.fileCount || 0,
      directoryStructure: data.directoryStructure || "未生成",
      processLogs: data.processLogs || "",
    });
  }

  /**
   * 渲染项目信息
   */
  static renderProjectInfo(data: {
    projectName: string;
    targetPath: string;
    templateSource?: string;
    fileCount: number;
  }): string {
    return this.render(this.PROJECT_INFO_TEMPLATE, {
      ...data,
      templateSource: data.templateSource || "未知",
    });
  }

  /**
   * 渲染过程日志
   */
  static renderProcessLogs(logs: string[]): string {
    if (!logs || logs.length === 0) {
      return "";
    }

    const formattedLogs = logs.map((log) => `  ${log}`).join("\n");
    return this.render(this.PROCESS_LOGS_TEMPLATE, { logs: formattedLogs });
  }

  /**
   * 渲染快速开始指南
   */
  static renderQuickStart(projectName: string): string {
    return this.render(this.QUICK_START_TEMPLATE, { projectName });
  }

  /**
   * 渲染建议信息
   */
  static renderSuggestions(suggestions: string[]): string {
    const formattedSuggestions = suggestions
      .map((suggestion, index) => `${index + 1}. ${suggestion}`)
      .join("\n");

    return this.render(this.SUGGESTIONS_TEMPLATE, {
      suggestions: formattedSuggestions,
    });
  }

  /**
   * 渲染提示词消息
   */
  static renderPrompt(data: {
    projectName: string;
    prompt: string;
    processLogs?: string;
  }): string {
    return this.render(this.PROMPT_TEMPLATE, {
      ...data,
      processLogs: data.processLogs || "",
    });
  }

  /**
   * 验证模板数据完整性
   */
  static validateTemplateData(template: string, data: TemplateData): string[] {
    const placeholders = template.match(/\{\{([^}]+)\}\}/g) || [];
    const missingKeys: string[] = [];

    placeholders.forEach((placeholder) => {
      const key = placeholder.replace(/[{}]/g, "");
      if (!(key in data)) {
        missingKeys.push(key);
      }
    });

    return missingKeys;
  }
}
