import type { GenerateResult } from '../types/index.js';

/**
 * MCP响应接口
 */
export interface MCPResponse {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * 响应格式化器
 * 统一处理所有MCP工具的响应格式化逻辑
 */
export class ResponseFormatter {
  /**
   * 格式化成功响应
   */
  static formatSuccess(result: GenerateResult): MCPResponse {
    const text = `✅ 脚手架生成成功！

📁 项目名称: ${result.projectName}
📍 生成路径: ${result.targetPath}
🔧 模板来源: ${result.templateSource || '未知'}

📊 生成统计:
- 总文件数: ${result.files.length}
- 目录结构: 
${this.formatDirectoryTree(result.tree)}

${this.formatProcessLogs(result.processLogs)}🎉 项目已成功创建，可以开始开发了！

💡 快速开始:
  cd ${result.projectName}
  npm install
  npm start`;

    return {
      content: [
        {
          type: 'text',
          text
        }
      ]
    };
  }

  /**
   * 格式化错误响应
   */
  static formatError(error: string, result?: Partial<GenerateResult>): MCPResponse {
    let text = `❌ 脚手架生成失败: ${error}`;

    if (result) {
      text = `❌ 脚手架生成失败！

📁 项目名称: ${result.projectName || '未知'}
📍 目标路径: ${result.targetPath || '未知'}
🔧 失败原因: ${error}

📊 生成统计:
- 总文件数: ${result.files?.length || 0}
- 目录结构: ${result.tree?.name || '未生成'}

${this.formatProcessLogs(result.processLogs)}💡 建议:
1. 检查网络连接是否正常
2. 确认模板配置是否正确
3. 查看详细错误日志`;
    }

    return {
      content: [
        {
          type: 'text',
          text
        }
      ],
      isError: true
    };
  }

  /**
   * 格式化项目信息
   */
  static formatProjectInfo(result: GenerateResult): string {
    return `📁 项目名称: ${result.projectName}
📍 生成路径: ${result.targetPath}
🔧 模板来源: ${result.templateSource || '未知'}
📊 总文件数: ${result.files.length}`;
  }

  /**
   * 格式化过程日志
   */
  static formatProcessLogs(logs?: string[]): string {
    if (!logs || logs.length === 0) {
      return '';
    }

    return `🔍 过程日志:
${logs.map(log => `  ${log}`).join('\n')}

`;
  }

  /**
   * 格式化目录树
   */
  static formatDirectoryTree(tree: any, indent = ''): string {
    if (!tree) {
      return '未生成目录结构';
    }

    let result = `${indent}${tree.name}\n`;
    
    if (tree.children) {
      tree.children.forEach((child: any, index: number) => {
        const isLast = index === tree.children.length - 1;
        const childIndent = indent + (isLast ? '└── ' : '├── ');
        const nextIndent = indent + (isLast ? '    ' : '│   ');
        
        result += `${childIndent}${child.name}\n`;
        
        if (child.children) {
          result += this.formatDirectoryTree(child, nextIndent);
        }
      });
    }
    
    return result;
  }

  /**
   * 检查生成结果是否为失败状态
   */
  static isFailureResult(result: GenerateResult): boolean {
    return result.templateSource === 'failed' || 
           (result.templateSource?.startsWith('生成失败') ?? false);
  }
}