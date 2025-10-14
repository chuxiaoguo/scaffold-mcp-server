#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { generateScaffold } from './tools/generateScaffold.js';
import type { GenerateScaffoldParams } from './types/index.js';

class ScaffoldMCPServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'scaffold-mcp-server',
        version: '1.0.0',
      }
    );

    this.setupToolHandlers();
    this.setupErrorHandling();
  }

  private setupToolHandlers(): void {
    // 注册工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'generateScaffold',
            description: '生成前端项目脚手架，支持 Vue3、React 等技术栈',
            inputSchema: {
              type: 'object',
              properties: {
                tech_stack: {
                  type: ['string', 'array'],
                  description: '技术栈，可以是字符串（如 "vue3+ts"）或数组（如 ["vue3", "typescript", "vite"]）',
                  examples: ['vue3+ts', 'react+ts+vite', ['vue3', 'typescript', 'pinia']]
                },
                project_name: {
                  type: 'string',
                  description: '项目名称，默认为 "my-project"',
                  default: 'my-project'
                },
                output_dir: {
                  type: 'string',
                  description: '输出目录，默认为当前目录',
                  default: '.'
                },
                extra_tools: {
                  type: 'array',
                  items: {
                    type: 'string'
                  },
                  description: '额外的工具，如 ["eslint", "prettier", "jest", "husky"]',
                  default: []
                },
                options: {
                  type: 'object',
                  properties: {
                    force: {
                      type: 'boolean',
                      description: '是否强制覆盖已存在的目录',
                      default: false
                    },
                    install: {
                      type: 'boolean',
                      description: '是否自动安装依赖',
                      default: true
                    },
                    dryRun: {
                      type: 'boolean',
                      description: '是否只预览不实际生成文件',
                      default: false
                    },
                    testRunner: {
                      type: 'string',
                      enum: ['jest', 'vitest'],
                      description: '测试运行器选择',
                      default: 'jest'
                    }
                  }
                }
              },
              required: ['tech_stack']
            }
          }
        ]
      };
    });

    // 注册工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'generateScaffold':
            // 验证参数
            if (!args || typeof args !== 'object' || !('tech_stack' in args)) {
              throw new McpError(
                ErrorCode.InvalidParams,
                'Missing required parameter: tech_stack'
              );
            }
            return await this.handleGenerateScaffold(args as unknown as GenerateScaffoldParams);
          
          default:
            throw new McpError(
              ErrorCode.MethodNotFound,
              `Unknown tool: ${name}`
            );
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Tool execution failed: ${errorMessage}`
        );
      }
    });
  }

  private async handleGenerateScaffold(params: GenerateScaffoldParams) {
    try {
      const result = await generateScaffold(params);
      
      return {
        content: [
          {
            type: 'text',
            text: `✅ 脚手架生成成功！

📁 项目名称: ${result.projectName}
📍 生成路径: ${result.targetPath}

📊 生成统计:
- 总文件数: ${result.files.length}
- 目录结构: ${this.formatDirectoryTree(result.tree)}

📋 文件清单:
${result.files.map(file => `  - ${file.path} (${file.size} bytes)`).join('\n')}

🎉 项目已成功创建，可以开始开发了！`
          }
        ]
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        content: [
          {
            type: 'text',
            text: `❌ 脚手架生成失败: ${errorMessage}`
          }
        ],
        isError: true
      };
    }
  }

  private formatDirectoryTree(tree: any, indent = ''): string {
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

  private setupErrorHandling(): void {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  async run(): Promise<void> {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    
    console.error('Scaffold MCP Server running on stdio');
  }
}

// 启动服务器
async function main() {
  const server = new ScaffoldMCPServer();
  await server.run();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('Failed to start server:', error);
    process.exit(1);
  });
}

export { ScaffoldMCPServer };