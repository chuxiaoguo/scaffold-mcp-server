import type { GenerateScaffoldParams, GenerateResult } from "../types/index";
import { parseTechStack } from "../core/matcher.js";
import { SmartMatcher } from "../core/matcher/SmartMatcher.js";
import { getTemplateSync } from "../core/sync/TemplateSync.js";
import { UnifiedProjectGenerator } from "../core/UnifiedProjectGenerator.js";
import {
  resolveProjectPathAndName,
  validateProjectPath,
  getPathResolutionInfo,
} from "./pathResolver.js";
import * as fs from "fs/promises";
import * as path from "path";

/**
 * 递归统计目录中的文件数量
 */
async function countAllFiles(dirPath: string): Promise<number> {
  let count = 0;
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile()) {
        count++;
      } else if (entry.isDirectory()) {
        const subDirPath = path.join(dirPath, entry.name);
        count += await countAllFiles(subDirPath);
      }
    }
  } catch (error) {
    // 忽略无法访问的目录
  }

  return count;
}

/**
 * 生成脚手架项目的主函数
 *
 * 这是一个重构后的版本，集成了新的模板管理系统：
 * - 自动检查和更新远程模板
 * - 使用智能匹配器进行模板选择
 * - 支持关键词直接匹配和积分计算匹配
 * - 提供更好的错误处理和日志记录
 */
export async function generateScaffold(
  params: GenerateScaffoldParams
): Promise<GenerateResult> {
  const processLogs: string[] = [];

  try {
    processLogs.push(`📋 原始参数: ${JSON.stringify(params, null, 2)}`);
    console.log(`🚀 开始生成脚手架项目...`);
    console.log(`📋 原始参数:`, JSON.stringify(params, null, 2));

    // 设置DRY_RUN环境变量
    if (params.options?.dryRun) {
      process.env.DRY_RUN = "true";
      processLogs.push(`🔍 启用预览模式 (Dry Run)`);
    } else {
      delete process.env.DRY_RUN;
    }

    // 0. 统一模板同步（替代原来的两个步骤）
    processLogs.push(`🔄 开始统一模板同步...`);
    const templateSync = getTemplateSync();

    const syncResult = await templateSync.syncTemplates();

    // 添加同步过程日志
    syncResult.logs.forEach((log: string) => {
      processLogs.push(`   ${log}`);
    });

    if (syncResult.success) {
      if (syncResult.updated) {
        processLogs.push(`✅ 模板已更新到最新版本`);
      } else {
        processLogs.push(`ℹ️ 模板已是最新版本`);
      }
    } else {
      processLogs.push(
        `⚠️ 模板同步失败，使用现有配置: ${syncResult.error || "未知错误"}`
      );
      console.warn("模板同步失败:", syncResult.error);
    }

    // 1. 智能路径解析
    processLogs.push(`📁 开始智能路径解析...`);
    const {
      workspaceRoot,
      userOutputDir,
      userProjectName,
      resolvedProjectPath: projectPath,
      resolvedProjectName: projectName,
      isAbsolutePath,
      isValidWorkspace,
    } = getPathResolutionInfo(params);
    processLogs.push(`📁 路径解析详情:`);
    processLogs.push(`   - 工作空间根目录: ${workspaceRoot}`);
    processLogs.push(`   - 用户指定输出目录: ${userOutputDir || "未指定"}`);
    processLogs.push(`   - 用户指定项目名称: ${userProjectName || "未指定"}`);
    processLogs.push(`   - 解析后项目路径: ${projectPath}`);
    processLogs.push(`   - 解析后项目名称: ${projectName}`);
    processLogs.push(`   - 是否绝对路径: ${isAbsolutePath}`);
    processLogs.push(`   - 是否有效工作空间: ${isValidWorkspace}`);

    // 获取同步后的配置
    const syncedTemplateConfig = syncResult.config;
    if (!syncedTemplateConfig) {
      processLogs.push(`❌ 无法获取模板配置`);
      return {
        projectName,
        targetPath: projectPath,
        tree: { name: "config-error", type: "directory", path: projectPath },
        files: [],
        templateSource: `无法获取模板配置`,
        processLogs,
      };
    }

    // 2. 路径验证
    processLogs.push(`🔍 验证项目路径...`);
    // 获取autoCreateDir参数，默认为true
    const autoCreateDir = params.options?.autoCreateDir !== false; // 默认为true
    const validation = validateProjectPath(
      projectPath,
      params.options?.force || false,
      autoCreateDir
    );

    if (!validation.valid) {
      processLogs.push(`❌ 路径验证失败: ${validation.message}`);
      if (validation.suggestions) {
        processLogs.push(`💡 建议:`);
        validation.suggestions.forEach((suggestion) => {
          processLogs.push(`   - ${suggestion}`);
        });
      }

      return {
        projectName,
        targetPath: projectPath,
        tree: {
          name: "validation-failed",
          type: "directory",
          path: projectPath,
        },
        files: [],
        templateSource: `路径验证失败: ${validation.message}`,
        processLogs,
      };
    }
    processLogs.push(`✅ 路径验证通过`);

    // 3. 智能模板匹配
    processLogs.push(`🧠 开始智能模板匹配...`);

    // 解析技术栈
    const techStack = parseTechStack(params.tech_stack);
    processLogs.push(`📋 解析的技术栈: ${JSON.stringify(techStack)}`);

    // 获取用户输入字符串（用于关键词匹配）
    const userInput = Array.isArray(params.tech_stack)
      ? params.tech_stack.join(" ")
      : params.tech_stack;

    // 使用同步后的配置（移除重复的配置获取逻辑）
    const templatesObj = syncedTemplateConfig?.templates || {};

    // 将templates对象转换为数组
    const templatesArray = Object.entries(templatesObj).map(
      ([id, template]: [string, any]) => ({
        id,
        ...template,
      })
    );

    processLogs.push(`📚 可用模板数量: ${templatesArray.length}`);

    // 转换为TemplateEntry数组
    const templates = templatesArray.map((entry: any) => ({
      id: entry.id,
      name: entry.name,
      description: entry.description || entry.name,
      keywords: entry.keywords || [],
      matching: entry.matching || {},
      priority: entry.priority || 0,
      config: entry,
    }));

    // 使用智能匹配器
    const matchResult = SmartMatcher.matchTemplate(
      techStack,
      userInput,
      templates,
      {
        enableKeywordMatch: true,
        minScore: 40,
        fallbackToDefault: false,
      }
    );

    // 4. 根据匹配结果选择生成方式
    let result: any;

    if (matchResult) {
      // 使用预匹配模板直接生成，避免重复匹配
      processLogs.push(`🎯 匹配成功!`);
      processLogs.push(`   - 模板名称: ${matchResult.template.name}`);
      processLogs.push(`   - 匹配类型: ${matchResult.matchType}`);
      processLogs.push(
        `   - 置信度: ${(matchResult.confidence * 100).toFixed(1)}%`
      );
      processLogs.push(`   - 总分: ${matchResult.score.totalScore.toFixed(1)}`);
      processLogs.push(
        `   - 详细分数: 核心=${matchResult.score.coreScore}, 可选=${matchResult.score.optionalScore}, 关键词=${matchResult.score.keywordScore}, 优先级=${matchResult.score.priorityBonus}`
      );

      const unifiedGenerator = new UnifiedProjectGenerator();

      // 将技术栈转换为工具输入格式
      const toolInput = [
        techStack.framework,
        techStack.builder,
        techStack.language,
        techStack.ui,
        techStack.style,
        techStack.router,
        techStack.state,
        techStack.packageManager,
        ...(params.extra_tools || []),
      ].filter((tool): tool is string => Boolean(tool)); // 类型守卫，过滤掉 undefined

      // 计算相对于项目路径的输出目录
      const outputDir = path.dirname(projectPath);

      const unifiedResult = await unifiedGenerator.generateWithMatchedTemplate(
        matchResult,
        toolInput,
        {
          projectName,
          outputDir,
          preview: params.options?.dryRun || false,
          force: params.options?.force || false,
        }
      );

      // 转换统一生成器的结果为兼容格式
      result = {
        success: unifiedResult.success,
        message: unifiedResult.success
          ? "项目生成成功"
          : unifiedResult.error || "项目生成失败",
        projectPath: unifiedResult.targetPath,
        processLogs: unifiedResult.logs,
      };
    } else {
      // 未找到匹配模板，使用纯动态生成逻辑（返回提示词）
      processLogs.push(`🎯 使用提示词驱动模式，生成项目构建提示词...`);
      const unifiedGenerator = new UnifiedProjectGenerator();

      // 将技术栈转换为工具输入格式
      const toolInput = [
        techStack.framework,
        techStack.builder,
        techStack.language,
        techStack.ui,
        techStack.style,
        techStack.router,
        techStack.state,
        techStack.packageManager,
        ...(params.extra_tools || []),
      ].filter((tool): tool is string => Boolean(tool)); // 类型守卫，过滤掉 undefined

      // 计算相对于项目路径的输出目录
      const outputDir = path.dirname(projectPath);

      const unifiedResult = await unifiedGenerator.generateWithDynamicTemplate(
        toolInput,
        {
          projectName,
          outputDir,
          preview: params.options?.dryRun || false,
          force: params.options?.force || false,
        }
      );

      // 合并 generateProject 返回的详细日志
      if (unifiedResult.logs && unifiedResult.logs.length > 0) {
        processLogs.push(...unifiedResult.logs);
      }

      // 检查是否成功生成提示词
      if (!unifiedResult.success || !unifiedResult.prompt) {
        processLogs.push(`❌ 提示词生成失败`);
        return {
          projectName,
          targetPath: projectPath,
          tree: { name: "failed", type: "directory", path: projectPath },
          files: [],
          templateSource: "failed",
          processLogs,
        };
      }

      // 返回提示词结果
      processLogs.push(`✅ 已生成项目脚手架构建提示词`);
      return {
        projectName,
        targetPath: projectPath,
        tree: {
          name: projectName,
          type: "directory",
          path: projectPath,
        },
        files: [],
        templateSource: "dynamic-prompt",
        processLogs,
        prompt: unifiedResult.prompt, // ⭐️ 返回提示词
      };
    }

    // 合并 generateProject 返回的详细日志
    if (result.processLogs && result.processLogs.length > 0) {
      processLogs.push(...result.processLogs);
    }

    processLogs.push(`📊 项目生成结果: success=${result.success}`);
    if (result.message) {
      processLogs.push(`📝 生成消息: ${result.message}`);
    }

    if (!result.success) {
      processLogs.push(`❌ 项目生成失败，返回失败结果`);
      return {
        projectName,
        targetPath: projectPath,
        tree: { name: "failed", type: "directory", path: projectPath },
        files: [],
        templateSource: "failed",
        processLogs,
      };
    }

    processLogs.push(`🏗️ 构建返回结果...`);
    processLogs.push(`📁 最终项目路径: ${projectPath}`);

    // 统计实际生成的文件数量
    const actualFileCount = await countAllFiles(projectPath);
    processLogs.push(`📄 实际生成文件数量: ${actualFileCount}`);

    // 构建返回结果
    const generateResult: GenerateResult = {
      projectName,
      targetPath: projectPath,
      tree: {
        name: projectName,
        type: "directory",
        path: projectPath,
      },
      files: Array.isArray(result.fileSummary)
        ? result.fileSummary.map((f: string) => ({
            path: f,
            size: 0,
            type: "file",
          }))
        : [],
      templateSource: matchResult
        ? `智能匹配模板: ${matchResult.template.name} (${matchResult.matchType}匹配, 置信度${(matchResult.confidence * 100).toFixed(1)}%)`
        : "非固定模板生成器",
      processLogs,
    };

    // 如果有directoryTree，则添加到结果中
    if (result.directoryTree) {
      generateResult.directoryTree = result.directoryTree;
    }

    processLogs.push(`✅ 脚手架项目生成完成！`);
    console.log(`✅ 脚手架项目生成完成！`);
    return generateResult;
  } catch (error: any) {
    processLogs.push(`❌ 生成脚手架项目失败: ${error.message || error}`);
    processLogs.push(`🔍 错误堆栈: ${error.stack || "No stack trace"}`);
    console.error(`❌ 生成脚手架项目失败:`, error);

    // 尝试获取项目信息用于错误返回
    let errorProjectName = "my-project";
    let errorTargetPath = ".";

    try {
      const { projectPath, projectName } = resolveProjectPathAndName(params);
      errorProjectName = projectName;
      errorTargetPath = projectPath;
    } catch {
      // 如果路径解析也失败，使用默认值
      errorProjectName = params.project_name || "my-project";
      errorTargetPath = params.output_dir || ".";
    }

    return {
      projectName: errorProjectName,
      targetPath: errorTargetPath,
      tree: { name: "error", type: "directory", path: errorTargetPath },
      files: [],
      templateSource: `生成失败: ${error.message || error}`,
      processLogs,
    };
  }
}

/**
 * 生成脚手架项目的主函数
 * @param params 生成参数
 * @returns 生成结果
 */
export default generateScaffold;
