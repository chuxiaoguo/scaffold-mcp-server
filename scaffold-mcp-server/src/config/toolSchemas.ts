/**
 * MCP工具Schema配置
 * 统一管理所有工具的Schema定义
 */

export interface ToolSchema {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
}

/**
 * 生成脚手架工具的Schema定义
 */
export const GENERATE_SCAFFOLD_SCHEMA: ToolSchema = {
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
};

/**
 * 所有可用工具的Schema集合
 */
export const TOOL_SCHEMAS: Record<string, ToolSchema> = {
  generateScaffold: GENERATE_SCAFFOLD_SCHEMA
};

/**
 * 获取所有工具Schema的数组形式
 */
export function getAllToolSchemas(): ToolSchema[] {
  return Object.values(TOOL_SCHEMAS);
}

/**
 * 根据工具名称获取Schema
 */
export function getToolSchema(toolName: string): ToolSchema | undefined {
  return TOOL_SCHEMAS[toolName];
}

/**
 * 验证工具名称是否存在
 */
export function isValidToolName(toolName: string): boolean {
  return toolName in TOOL_SCHEMAS;
}