import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { TechStack } from "../types/index.js";

// 工具输入类型定义
export type ToolInput = string | string[] | TechStack | { tools?: ToolInput };

// 解析后的工具集合
export interface ParsedToolSet {
  frameworks: string[];
  builders: string[];
  languages: string[];
  ui: string[];
  styles: string[];
  state: string[];
  routers: string[];
  testing: string[];
  linting: string[];
  tools: string[];
  all: string[];
  metadata: {
    originalInput: ToolInput;
    inputFormat: "string" | "array" | "object" | "nested";
    autoCompleted: string[];
    conflicts: string[];
    warnings: string[];
  };
}

// 工具配置接口
interface ToolCategories {
  categories: Record<string, string[]>;
  dependencies: Record<string, { requires: string[]; incompatible: string[] }>;
  autoComplete: Record<string, { recommended: string[]; optional: string[] }>;
  aliases: Record<string, string>;
}

interface ToolProperties {
  tools: Record<
    string,
    {
      category: string;
      requiresInjection: boolean;
      isCore: boolean;
      priority: number;
      description: string;
      injectorClass?: string;
    }
  >;
  injectionOrder: string[];
}

export class UnifiedToolParser {
  private toolCategories!: ToolCategories;
  private toolProperties!: ToolProperties;
  private configPath: string;

  constructor(configPath?: string) {
    // ES 模块中使用 import.meta.url 获取当前文件路径
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    this.configPath = configPath || path.join(__dirname, "../../configs/tools");
    this.loadConfigurations();
  }

  /**
   * 加载配置文件
   */
  private loadConfigurations(): void {
    try {
      const categoriesPath = path.join(this.configPath, "tool-categories.json");
      const propertiesPath = path.join(this.configPath, "tool-properties.json");

      this.toolCategories = JSON.parse(
        fs.readFileSync(categoriesPath, "utf-8")
      );
      this.toolProperties = JSON.parse(
        fs.readFileSync(propertiesPath, "utf-8")
      );
    } catch (error: any) {
      throw new Error(
        `Failed to load tool configurations: ${error?.message || "Unknown error"}`
      );
    }
  }

  /**
   * 主解析方法
   */
  public parse(input: ToolInput): ParsedToolSet {
    // 1. 格式标准化
    const normalized = this.normalizeInput(input);

    // 2. 别名解析
    const resolved = this.resolveAliases(normalized);

    // 3. 智能分类
    const categorized = this.categorizeTools(resolved);

    // 4. 依赖推断和自动补全
    const completed = this.autoCompleteTools(categorized);

    // 5. 兼容性验证
    const validated = this.validateCompatibility(completed);

    // 6. 构建最终结果
    return this.buildResult(input, normalized, validated);
  }

  /**
   * 输入格式标准化
   */
  private normalizeInput(input: ToolInput): {
    tools: string[];
    format: string;
  } {
    if (typeof input === "string") {
      // 字符串格式: "vue3+vite+typescript" 或 "vue3,vite,typescript"
      const tools = input.split(/[+,\s]+/).filter((tool) => tool.trim());
      return { tools, format: "string" };
    }

    if (Array.isArray(input)) {
      // 数组格式: ["vue3", "vite", "typescript"]
      return {
        tools: input.filter((tool) => typeof tool === "string"),
        format: "array",
      };
    }

    if (input && typeof input === "object") {
      // 检查是否是嵌套对象格式 { tools: [...] }
      if ("tools" in input && input.tools) {
        return this.normalizeInput(input.tools);
      }

      // 对象格式: { framework: "vue3", builder: "vite", ... }
      const tools: string[] = [];
      const techStack = input as TechStack;

      if (techStack.framework) tools.push(techStack.framework);
      if (techStack.builder) tools.push(techStack.builder);
      if (techStack.language) tools.push(techStack.language);
      if (techStack.ui) tools.push(techStack.ui);
      if (techStack.style) tools.push(techStack.style);
      if (techStack.state) tools.push(techStack.state);
      if (techStack.router) tools.push(techStack.router);

      return { tools, format: "object" };
    }

    return { tools: [], format: "unknown" };
  }

  /**
   * 别名解析
   */
  private resolveAliases(normalized: {
    tools: string[];
    format: string;
  }): string[] {
    return normalized.tools.map((tool) => {
      const lowerTool = tool.toLowerCase();
      return this.toolCategories.aliases[lowerTool] || tool;
    });
  }

  /**
   * 工具分类
   */
  private categorizeTools(tools: string[]): Record<string, string[]> {
    const categorized: Record<string, string[]> = {
      frameworks: [],
      builders: [],
      languages: [],
      ui: [],
      styles: [],
      state: [],
      routers: [],
      testing: [],
      linting: [],
      tools: [],
    };

    for (const tool of tools) {
      let found = false;

      // 根据配置分类
      for (const [category, categoryTools] of Object.entries(
        this.toolCategories.categories
      )) {
        if (categoryTools.includes(tool)) {
          if (categorized[category]) {
            categorized[category].push(tool);
          } else {
            // 确保 tools 数组存在
            if (!categorized.tools) categorized.tools = [];
            categorized.tools.push(tool);
          }
          found = true;
          break;
        }
      }

      // 未知工具放入 tools 分类
      if (!found) {
        // 确保 tools 数组存在
        if (!categorized.tools) categorized.tools = [];
        categorized.tools.push(tool);
      }
    }

    return categorized;
  }

  /**
   * 自动补全工具
   */
  private autoCompleteTools(categorized: Record<string, string[]>): {
    categorized: Record<string, string[]>;
    autoCompleted: string[];
  } {
    const autoCompleted: string[] = [];
    const result = { ...categorized };

    // 基于现有工具进行自动补全
    for (const category of Object.keys(result)) {
      for (const tool of result[category] || []) {
        const autoComplete = this.toolCategories.autoComplete[tool];
        if (autoComplete) {
          // 添加推荐工具
          for (const recommended of autoComplete.recommended) {
            if (
              !this.isToolPresent(recommended, result) &&
              this.isToolCompatible(recommended, result)
            ) {
              this.addToolToCategory(recommended, result);
              autoCompleted.push(recommended);
            }
          }
        }
      }
    }

    return { categorized: result, autoCompleted };
  }

  /**
   * 兼容性验证
   */
  private validateCompatibility(data: {
    categorized: Record<string, string[]>;
    autoCompleted: string[];
  }): {
    categorized: Record<string, string[]>;
    autoCompleted: string[];
    conflicts: string[];
    warnings: string[];
  } {
    const conflicts: string[] = [];
    const warnings: string[] = [];
    const allTools = this.getAllTools(data.categorized);

    // 检查工具依赖和冲突
    for (const tool of allTools) {
      const dependencies = this.toolCategories.dependencies[tool];
      if (dependencies) {
        // 检查必需依赖
        for (const required of dependencies.requires) {
          if (!allTools.includes(required)) {
            warnings.push(
              `Tool '${tool}' requires '${required}' but it's not present`
            );
          }
        }

        // 检查不兼容工具
        for (const incompatible of dependencies.incompatible) {
          if (allTools.includes(incompatible)) {
            conflicts.push(
              `Tool '${tool}' is incompatible with '${incompatible}'`
            );
          }
        }
      }
    }

    return {
      ...data,
      conflicts,
      warnings,
    };
  }

  /**
   * 构建最终结果
   */
  private buildResult(
    originalInput: ToolInput,
    normalized: { tools: string[]; format: string },
    validated: {
      categorized: Record<string, string[]>;
      autoCompleted: string[];
      conflicts: string[];
      warnings: string[];
    }
  ): ParsedToolSet {
    const all = this.getAllTools(validated.categorized);

    return {
      frameworks: validated.categorized.frameworks || [],
      builders: validated.categorized.builders || [],
      languages: validated.categorized.languages || [],
      ui: validated.categorized.ui || [],
      styles: validated.categorized.styles || [],
      state: validated.categorized.state || [],
      routers: validated.categorized.routers || [],
      testing: validated.categorized.testing || [],
      linting: validated.categorized.linting || [],
      tools: validated.categorized.tools || [],
      all,
      metadata: {
        originalInput,
        inputFormat: normalized.format as any,
        autoCompleted: validated.autoCompleted,
        conflicts: validated.conflicts,
        warnings: validated.warnings,
      },
    };
  }

  /**
   * 辅助方法：检查工具是否已存在
   */
  private isToolPresent(
    tool: string,
    categorized: Record<string, string[]>
  ): boolean {
    return Object.values(categorized).some((tools) => tools.includes(tool));
  }

  /**
   * 辅助方法：检查工具兼容性
   */
  private isToolCompatible(
    tool: string,
    categorized: Record<string, string[]>
  ): boolean {
    const dependencies = this.toolCategories.dependencies[tool];
    if (!dependencies) return true;

    const allTools = this.getAllTools(categorized);

    // 检查不兼容工具
    for (const incompatible of dependencies.incompatible) {
      if (allTools.includes(incompatible)) {
        return false;
      }
    }

    return true;
  }

  /**
   * 辅助方法：添加工具到对应分类
   */
  private addToolToCategory(
    tool: string,
    categorized: Record<string, string[]>
  ): void {
    for (const [category, categoryTools] of Object.entries(
      this.toolCategories.categories
    )) {
      if (categoryTools.includes(tool)) {
        if (categorized[category]) {
          categorized[category].push(tool);
        } else {
          // 确保 tools 数组存在
          if (!categorized.tools) categorized.tools = [];
          categorized.tools.push(tool);
        }
        return;
      }
    }

    // 未知工具添加到 tools 分类
    if (!categorized.tools) categorized.tools = [];
    categorized.tools.push(tool);
  }

  /**
   * 辅助方法：获取所有工具列表
   */
  private getAllTools(categorized: Record<string, string[]>): string[] {
    return Object.values(categorized).flat();
  }

  /**
   * 获取需要注入的工具
   */
  public getInjectableTools(toolSet: ParsedToolSet): string[] {
    return toolSet.all.filter((tool) => {
      const properties = this.toolProperties.tools[tool];
      return properties && properties.requiresInjection;
    });
  }

  /**
   * 获取工具的注入器类名
   */
  public getInjectorClass(tool: string): string | undefined {
    const properties = this.toolProperties.tools[tool];
    return properties?.injectorClass;
  }

  /**
   * 按优先级排序工具
   */
  public sortToolsByPriority(tools: string[]): string[] {
    return tools.sort((a, b) => {
      const priorityA = this.toolProperties.tools[a]?.priority || 0;
      const priorityB = this.toolProperties.tools[b]?.priority || 0;
      return priorityB - priorityA; // 降序排列
    });
  }
}
