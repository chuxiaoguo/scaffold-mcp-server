#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { generateScaffold } from './tools/generateScaffold.js';
import type { GenerateScaffoldParams } from './types/index.js';
import { ResponseFormatter } from './utils/ResponseFormatter.js';
import { MCPErrorHandler } from './utils/MCPErrorHandler.js';
import { MessageTemplates } from './utils/MessageTemplates.js';
import { getAllToolSchemas, isValidToolName } from './config/toolSchemas.js';

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
        tools: getAllToolSchemas()
      };
    });

    // 注册工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case 'generateScaffold':
            MCPErrorHandler.validateRequiredParam(args, 'tech_stack');
            return await this.handleGenerateScaffold(args as unknown as GenerateScaffoldParams);
          
          default:
            throw MCPErrorHandler.handleUnknownTool(name);
        }
      } catch (error) {
        throw MCPErrorHandler.handleToolError(error, request.params.name);
      }
    });
  }

  private async handleGenerateScaffold(params: GenerateScaffoldParams) {
    try {
      const result = await generateScaffold(params);
      
      // 检查生成是否成功
      if (ResponseFormatter.isFailureResult(result)) {
        const errorMessage = MessageTemplates.renderError({
          projectName: result.projectName,
          targetPath: result.targetPath,
          errorMessage: result.templateSource || '未知错误',
          fileCount: result.files.length,
          directoryStructure: result.tree.name,
          processLogs: MessageTemplates.renderProcessLogs(result.processLogs || [])
        });

        return {
          content: [{ type: 'text', text: errorMessage }],
          isError: true
        };
      }
      
      const successMessage = MessageTemplates.renderSuccess({
        projectName: result.projectName,
        targetPath: result.targetPath,
        templateSource: result.templateSource || '未知',
        fileCount: result.files.length,
        directoryTree: this.formatDirectoryTree(result.tree),
        processLogs: MessageTemplates.renderProcessLogs(result.processLogs || [])
      });

      return {
        content: [{ type: 'text', text: successMessage }]
      };
    } catch (error) {
      const errorMessage = MessageTemplates.renderError({
        errorMessage: MCPErrorHandler.extractErrorMessage(error)
      });
      
      return {
        content: [{ type: 'text', text: errorMessage }],
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