import type {
  GenerateScaffoldParams,
  GenerateResult,
  TechStack,
} from "../types/index.js";
import { smartMatchFixedTemplate } from "../core/matcher.js";
import { NonFixedBuilder } from "../core/nonFixedBuilder/index.js";
import { ToolInjectorManager } from "../core/injectors/index.js";
import { generateProject } from "./projectGenerator.js";
import { 
  resolveProjectPathAndName, 
  validateProjectPath, 
  getPathResolutionInfo 
} from "./pathResolver.js";
import * as fs from 'fs/promises';
import * as path from 'path';

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
 * 这是一个重构后的版本，将原有的复杂逻辑拆分到了多个专门的模块中：
 * - techStackParser.ts: 技术栈解析相关功能
 * - templateDownloader.ts: 模板下载相关功能
 * - fileOperations.ts: 文件操作相关功能
 * - projectGenerator.ts: 项目生成相关功能
 *
 * 本文件现在只负责主要的协调逻辑，调用各个模块完成具体任务。
 */
export async function generateScaffold(
  params: GenerateScaffoldParams
): Promise<GenerateResult> {
  const processLogs: string[] = [];

  try {
    processLogs.push(`🚀 开始生成脚手架项目...`);
    processLogs.push(`📋 原始参数: ${JSON.stringify(params, null, 2)}`);
    console.log(`🚀 开始生成脚手架项目...`);
    console.log(`📋 原始参数:`, JSON.stringify(params, null, 2));

    // 1. 智能路径解析
    processLogs.push(`📁 开始智能路径解析...`);
    const pathInfo = getPathResolutionInfo(params);
    processLogs.push(`📁 路径解析详情:`);
    processLogs.push(`   - 工作空间根目录: ${pathInfo.workspaceRoot}`);
    processLogs.push(`   - 用户指定输出目录: ${pathInfo.userOutputDir || '未指定'}`);
    processLogs.push(`   - 用户指定项目名称: ${pathInfo.userProjectName || '未指定'}`);
    processLogs.push(`   - 解析后基础路径: ${pathInfo.resolvedBasePath}`);
    processLogs.push(`   - 解析后项目路径: ${pathInfo.resolvedProjectPath}`);
    processLogs.push(`   - 解析后项目名称: ${pathInfo.resolvedProjectName}`);
    processLogs.push(`   - 是否绝对路径: ${pathInfo.isAbsolutePath}`);
    processLogs.push(`   - 是否有效工作空间: ${pathInfo.isValidWorkspace}`);

    const { projectPath, projectName } = resolveProjectPathAndName(params);
    
    // 2. 路径验证
    processLogs.push(`🔍 验证项目路径...`);
    const validation = validateProjectPath(projectPath, params.options?.force || false);
    if (!validation.valid) {
      processLogs.push(`❌ 路径验证失败: ${validation.message}`);
      if (validation.suggestions) {
        processLogs.push(`💡 建议:`);
        validation.suggestions.forEach(suggestion => {
          processLogs.push(`   - ${suggestion}`);
        });
      }
      
      return {
        projectName,
        targetPath: projectPath,
        tree: { name: "validation-failed", type: "directory", path: projectPath },
        files: [],
        templateSource: `路径验证失败: ${validation.message}`,
        processLogs,
      };
    }
    processLogs.push(`✅ 路径验证通过`);

    // 3. 使用重构后的项目生成器
    processLogs.push(`🔧 调用项目生成器...`);
    
    // 计算相对于项目路径的输出目录
    const outputDir = path.dirname(projectPath);
    
    const result = await generateProject(
      params.tech_stack,
      projectName,
      outputDir,
      params.extra_tools || [],
      {
        dryRun: params.options?.dryRun || false,
        force: params.options?.force || false,
        install: params.options?.install !== false,
      }
    );

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
      tree:
        typeof result.directoryTree === "string"
          ? {
              name: projectName,
              type: "directory",
              path: projectPath,
            }
          : result.directoryTree || {
              name: "empty",
              type: "directory",
              path: projectPath,
            },
      files: Array.isArray(result.fileSummary)
        ? result.fileSummary.map((f) => ({ path: f, size: 0, type: "file" }))
        : [],
      templateSource: "智能路径解析生成器",
      processLogs,
    };

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
 * 导出主函数作为默认导出
 */
export default generateScaffold;
