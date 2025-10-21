#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { generateScaffold } from "./tools/generateScaffold.js";
import type { GenerateScaffoldParams } from "./types/index.js";
import { ResponseFormatter } from "./utils/ResponseFormatter.js";
import { MCPErrorHandler } from "./utils/MCPErrorHandler.js";
import { MessageTemplates } from "./utils/MessageTemplates.js";
import { getAllToolSchemas, isValidToolName } from "./config/toolSchemas.js";

class ScaffoldMCPServer {
  private server: Server;

  constructor() {
    console.error("[DEBUG] 初始化 ScaffoldMCPServer...");

    this.server = new Server({
      name: "scaffold-mcp-server",
      version: "1.0.0",
    });

    console.error("[DEBUG] MCP Server 实例创建完成");

    this.setupToolHandlers();
    this.setupErrorHandling();

    console.error("[DEBUG] 工具处理器和错误处理设置完成");
  }

  private setupToolHandlers(): void {
    console.error("[DEBUG] 设置工具处理器...");

    // 注册工具列表处理器
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.error("[DEBUG] 收到 ListTools 请求");
      const tools = getAllToolSchemas();
      console.error(`[DEBUG] 返回 ${tools.length} 个工具`);
      return {
        tools: tools,
      };
    });

    // 注册工具调用处理器
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.error(`[DEBUG] 收到工具调用请求: ${request.params.name}`);
      try {
        const { name, arguments: args } = request.params;

        switch (name) {
          case "generateScaffold":
            console.error("[DEBUG] 处理 generateScaffold 工具调用");
            MCPErrorHandler.validateRequiredParam(args, "tech_stack");
            return await this.handleGenerateScaffold(
              args as unknown as GenerateScaffoldParams
            );

          default:
            console.error(`[DEBUG] 未知工具: ${name}`);
            throw MCPErrorHandler.handleUnknownTool(name);
        }
      } catch (error) {
        console.error(`[DEBUG] 工具调用错误: ${error}`);
        throw error;
      }
    });

    console.error("[DEBUG] 工具处理器设置完成");
  }

  private async handleGenerateScaffold(params: GenerateScaffoldParams) {
    try {
      const result = await generateScaffold(params);

      // 检查生成是否成功
      if (ResponseFormatter.isFailureResult(result)) {
        const errorMessage = MessageTemplates.renderError({
          projectName: result.projectName,
          targetPath: result.targetPath,
          errorMessage: result.templateSource || "未知错误",
          fileCount: result.files.length,
          directoryStructure: result.tree.name,
          processLogs: MessageTemplates.renderProcessLogs(
            result.processLogs || []
          ),
        });

        return {
          content: [{ type: "text", text: errorMessage }],
          isError: true,
        };
      }

      const successMessage = MessageTemplates.renderSuccess({
        projectName: result.projectName,
        targetPath: result.targetPath,
        templateSource: result.templateSource || "未知",
        fileCount: result.files.length,
        directoryTree: this.formatDirectoryTree(result.tree),
        processLogs: MessageTemplates.renderProcessLogs(
          result.processLogs || []
        ),
      });

      return {
        content: [{ type: "text", text: successMessage }],
      };
    } catch (error) {
      const errorMessage = MessageTemplates.renderError({
        errorMessage: MCPErrorHandler.extractErrorMessage(error),
      });

      return {
        content: [{ type: "text", text: errorMessage }],
        isError: true,
      };
    }
  }

  private formatDirectoryTree(tree: any, indent = ""): string {
    let result = `${indent}${tree.name}\n`;

    if (tree.children) {
      tree.children.forEach((child: any, index: number) => {
        const isLast = index === tree.children.length - 1;
        const childIndent = indent + (isLast ? "└── " : "├── ");
        const nextIndent = indent + (isLast ? "    " : "│   ");

        result += `${childIndent}${child.name}\n`;

        if (child.children) {
          result += this.formatDirectoryTree(child, nextIndent);
        }
      });
    }

    return result;
  }

  private setupErrorHandling(): void {
    console.error("[DEBUG] 设置错误处理...");

    // 处理未捕获的异常
    this.server.onerror = (error) => {
      console.error("[DEBUG] MCP Server 错误:", error);
    };

    console.error("[DEBUG] 错误处理设置完成");
  }

  async run(): Promise<void> {
    console.error("[DEBUG] 启动 MCP Server...");
    console.error(`[DEBUG] Node.js 版本: ${process.version}`);
    console.error(`[DEBUG] 工作目录: ${process.cwd()}`);
    console.error(`[DEBUG] 命令行参数: ${JSON.stringify(process.argv)}`);

    try {
      const transport = new StdioServerTransport();
      console.error("[DEBUG] StdioServerTransport 创建完成");

      console.error("[DEBUG] 开始连接 MCP Server...");
      await this.server.connect(transport);
      console.error("[DEBUG] MCP Server 连接成功");

      console.error("Scaffold MCP Server running on stdio");
      console.error("[DEBUG] 服务器启动完成，等待客户端连接...");
    } catch (error) {
      console.error("[DEBUG] MCP Server 启动失败:", error);
      throw error;
    }
  }
}

// 启动服务器
async function main() {
  console.error("[DEBUG] ========== 开始启动 Scaffold MCP Server ==========");
  console.error(`[DEBUG] 启动时间: ${new Date().toISOString()}`);
  console.error(`[DEBUG] 进程 PID: ${process.pid}`);

  try {
    const server = new ScaffoldMCPServer();
    console.error("[DEBUG] ScaffoldMCPServer 实例创建完成");

    await server.run();
    console.error("[DEBUG] 服务器运行中...");
  } catch (error) {
    console.error("[DEBUG] 服务器启动失败:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error("[DEBUG] ========== 服务器启动异常 ==========");
  console.error("Failed to start server:", error);
  console.error("[DEBUG] 错误堆栈:", error.stack);
  process.exit(1);
});

export { ScaffoldMCPServer };
