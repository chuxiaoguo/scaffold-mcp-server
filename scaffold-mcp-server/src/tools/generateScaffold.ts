import type { 
  GenerateScaffoldParams, 
  GenerateResult, 
  TechStack 
} from '../types/index.js';
import { smartMatchFixedTemplate } from '../core/matcher.js';
import { NonFixedBuilder } from '../core/nonFixedBuilder/index.js';
import { ToolInjectorManager } from '../core/injectors/index.js';
import { generateProject } from './projectGenerator.js';

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
export async function generateScaffold(params: GenerateScaffoldParams): Promise<GenerateResult> {
  const processLogs: string[] = [];
  
  try {
    processLogs.push(`🚀 开始生成脚手架项目...`);
    processLogs.push(`📋 参数: ${JSON.stringify(params, null, 2)}`);
    console.log(`🚀 开始生成脚手架项目...`);
    console.log(`📋 参数:`, JSON.stringify(params, null, 2));
    
    // 使用重构后的项目生成器
    processLogs.push(`🔧 调用项目生成器...`);
    const result = await generateProject(
      params.tech_stack,
      params.project_name || 'my-project',
      params.output_dir || '.',
      params.extra_tools || [],
      {
        dryRun: params.options?.dryRun || false,
        force: params.options?.force || false,
        install: params.options?.install !== false
      }
    );
    
    processLogs.push(`📊 项目生成结果: success=${result.success}`);
    if (result.message) {
      processLogs.push(`📝 生成消息: ${result.message}`);
    }
    
    if (!result.success) {
      processLogs.push(`❌ 项目生成失败，返回失败结果`);
      return {
        projectName: params.project_name || 'my-project',
        targetPath: params.output_dir || '.',
        tree: { name: 'empty', type: 'directory', path: '.' },
        files: [],
        templateSource: 'failed',
        processLogs
      };
    }
    
    processLogs.push(`🏗️ 构建返回结果...`);
    processLogs.push(`📁 项目路径: ${result.projectPath}`);
    processLogs.push(`📄 文件数量: ${Array.isArray(result.fileSummary) ? result.fileSummary.length : 0}`);
    
    // 构建返回结果
    const generateResult: GenerateResult = {
      projectName: params.project_name || 'my-project',
      targetPath: result.projectPath || '.',
      tree: typeof result.directoryTree === 'string' 
        ? { name: params.project_name || 'my-project', type: 'directory', path: result.projectPath || '.' }
        : result.directoryTree || { name: 'empty', type: 'directory', path: '.' },
      files: Array.isArray(result.fileSummary) 
        ? result.fileSummary.map(f => ({ path: f, size: 0, type: 'file' }))
        : [],
      templateSource: 'refactored-generator',
      processLogs
    };
    
    processLogs.push(`✅ 脚手架项目生成完成！`);
    console.log(`✅ 脚手架项目生成完成！`);
    return generateResult;
    
  } catch (error: any) {
    processLogs.push(`❌ 生成脚手架项目失败: ${error.message || error}`);
    processLogs.push(`🔍 错误堆栈: ${error.stack || 'No stack trace'}`);
    console.error(`❌ 生成脚手架项目失败:`, error);
    
    return {
      projectName: params.project_name || 'my-project',
      targetPath: params.output_dir || '.',
      tree: { name: 'error', type: 'directory', path: '.' },
      files: [],
      templateSource: `生成失败: ${error.message || error}`,
      processLogs
    };
  }
}

/**
 * 导出主函数作为默认导出
 */
export default generateScaffold;