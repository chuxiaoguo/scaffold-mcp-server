import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';

/**
 * 创建项目文件和目录
 */
export async function createProjectFiles(
  outputDir: string,
  files: Record<string, string>,
  projectName: string,
  logs: string[] = []
): Promise<void> {
  logs.push(`📁 开始创建项目文件到: ${outputDir}`);
  console.log(`📁 开始创建项目文件到: ${outputDir}`);
  
  // 确保输出目录存在
  try {
    await fs.mkdir(outputDir, { recursive: true });
    logs.push(`📁 成功创建输出目录: ${outputDir}`);
  } catch (error: any) {
    const errorMessage = error.message || error.toString();
    logs.push(`❌ 创建输出目录失败: ${errorMessage}`);
    
    // 提供更详细的错误信息和建议
    if (error.code === 'EACCES') {
      logs.push(`💡 建议: 权限不足，请检查目录权限或使用管理员权限运行`);
      throw new Error(`权限不足，无法创建目录 ${outputDir}。请检查目录权限或使用管理员权限运行。`);
    } else if (error.code === 'ENOTDIR') {
      logs.push(`💡 建议: 路径中存在同名文件，请检查路径是否正确`);
      throw new Error(`路径冲突，${outputDir} 路径中存在同名文件。请检查路径是否正确。`);
    } else if (error.code === 'ENOSPC') {
      logs.push(`💡 建议: 磁盘空间不足，请清理磁盘空间后重试`);
      throw new Error(`磁盘空间不足，无法创建目录 ${outputDir}。请清理磁盘空间后重试。`);
    } else {
      logs.push(`💡 建议: 请检查路径是否有效，以及是否有足够的权限`);
      throw new Error(`创建目录失败: ${errorMessage}。请检查路径是否有效，以及是否有足够的权限。`);
    }
  }
  
  let successCount = 0;
  let failureCount = 0;
  
  // 创建所有文件
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(outputDir, filePath);
    const dir = path.dirname(fullPath);
    
    logs.push(`📝 处理文件: ${filePath}`);
    
    // 确保目录存在
    try {
      await fs.mkdir(dir, { recursive: true });
      logs.push(`📁 确保目录存在: ${path.relative(outputDir, dir)}`);
    } catch (error: any) {
      const errorMessage = error.message || error.toString();
      logs.push(`❌ 创建目录失败 ${path.relative(outputDir, dir)}: ${errorMessage}`);
      
      // 对于子目录创建失败，记录错误但不中断整个过程
      if (error.code === 'EACCES') {
        logs.push(`💡 权限不足，跳过该文件的目录创建`);
      } else if (error.code === 'ENOTDIR') {
        logs.push(`💡 路径冲突，跳过该文件的目录创建`);
      } else {
        logs.push(`💡 目录创建失败，将尝试直接创建文件`);
      }
    }
    
    try {
      // 处理模板变量替换
      let processedContent = content;
      
      // 替换项目名称占位符
      const originalLength = processedContent.length;
      processedContent = processedContent.replace(/\{\{projectName\}\}/g, projectName);
      processedContent = processedContent.replace(/\{\{project_name\}\}/g, projectName);
      processedContent = processedContent.replace(/\{\{PROJECT_NAME\}\}/g, projectName.toUpperCase());
      
      if (processedContent.length !== originalLength) {
        logs.push(`🔄 已替换模板变量，内容长度从 ${originalLength} 变为 ${processedContent.length}`);
      }
      
      // 写入文件
      await fs.writeFile(fullPath, processedContent, 'utf-8');
      logs.push(`✅ 创建文件: ${filePath} (${processedContent.length} 字符)`);
      console.log(`✅ 创建文件: ${filePath}`);
      successCount++;
    } catch (error) {
      logs.push(`❌ 创建文件失败 ${filePath}: ${error}`);
      console.error(`❌ 创建文件失败 ${filePath}:`, error);
      
      // 尝试回退路径
      const fallbackPaths = [
        path.join(outputDir, path.basename(filePath)),
        path.join(outputDir, 'src', path.basename(filePath)),
        path.join(outputDir, 'backup', filePath)
      ];
      
      logs.push(`🔄 尝试回退路径: ${fallbackPaths.map(p => path.relative(outputDir, p)).join(', ')}`);
      
      let success = false;
      for (const fallbackPath of fallbackPaths) {
        try {
          const fallbackDir = path.dirname(fallbackPath);
          await fs.mkdir(fallbackDir, { recursive: true });
          await fs.writeFile(fallbackPath, content, 'utf-8');
          logs.push(`✅ 回退创建文件: ${path.relative(outputDir, fallbackPath)}`);
          console.log(`✅ 回退创建文件: ${path.relative(outputDir, fallbackPath)}`);
          success = true;
          successCount++;
          break;
        } catch (fallbackError) {
          logs.push(`❌ 回退路径失败 ${path.relative(outputDir, fallbackPath)}: ${fallbackError}`);
        }
      }
      
      if (!success) {
        logs.push(`❌ 所有回退路径都失败，跳过文件: ${filePath}`);
        console.error(`❌ 所有回退路径都失败，跳过文件: ${filePath}`);
        failureCount++;
      }
    }
  }
  
  logs.push(`✅ 项目文件创建完成 - 成功: ${successCount}, 失败: ${failureCount}, 总计: ${Object.keys(files).length}`);
  console.log(`✅ 项目文件创建完成`);
}

/**
 * 生成项目目录树
 */
export async function generateDirectoryTree(
  dirPath: string,
  prefix: string = '',
  isLast: boolean = true,
  maxDepth: number = 3,
  currentDepth: number = 0
): Promise<string> {
  if (currentDepth >= maxDepth) {
    return '';
  }
  
  const name = path.basename(dirPath);
  const connector = isLast ? '└── ' : '├── ';
  let result = prefix + connector + name + '\n';
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const filteredEntries = entries.filter(entry => !shouldSkipEntry(entry.name));
    
    // 排序：目录在前，文件在后
    filteredEntries.sort((a, b) => {
      if (a.isDirectory() && !b.isDirectory()) return -1;
      if (!a.isDirectory() && b.isDirectory()) return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (let i = 0; i < filteredEntries.length; i++) {
      const entry = filteredEntries[i];
      if (!entry) continue; // 防止undefined
      
      const isLastEntry = i === filteredEntries.length - 1;
      const fullPath = path.join(dirPath, entry.name);
      
      if (entry.isDirectory()) {
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
        result += await generateDirectoryTree(
          fullPath,
          nextPrefix,
          isLastEntry,
          maxDepth,
          currentDepth + 1
        );
      } else {
        const fileConnector = isLastEntry ? '└── ' : '├── ';
        const nextPrefix = prefix + (isLast ? '    ' : '│   ');
        result += nextPrefix + fileConnector + entry.name + '\n';
      }
    }
  } catch (error) {
    // 忽略无法读取的目录
  }
  
  return result;
}

/**
 * 判断是否应该跳过某个文件或目录
 */
export function shouldSkipEntry(name: string): boolean {
  const skipPatterns = [
    // 隐藏文件（除了重要的配置文件）
    /^\./,
    // 依赖目录
    /^node_modules$/,
    /^\.pnpm-store$/,
    // 构建输出目录
    /^dist$/,
    /^build$/,
    /^out$/,
    /^\.next$/,
    /^\.nuxt$/,
    // 缓存目录
    /^\.cache$/,
    /^\.temp$/,
    /^\.tmp$/,
    // IDE 配置
    /^\.vscode$/,
    /^\.idea$/,
    // 版本控制
    /^\.git$/,
    /^\.svn$/,
    // 日志文件
    /\.log$/,
    // 临时文件
    /~$/,
    /\.tmp$/,
    /\.temp$/
  ];
  
  // 重要的配置文件不跳过
  const importantFiles = [
    '.gitignore',
    '.env.example',
    '.eslintrc.js',
    '.eslintrc.json',
    '.prettierrc',
    '.editorconfig'
  ];
  
  if (importantFiles.includes(name)) {
    return false;
  }
  
  return skipPatterns.some(pattern => pattern.test(name));
}

/**
 * 生成文件摘要
 */
export async function generateFileSummary(
  dirPath: string,
  maxFiles: number = 20
): Promise<string[]> {
  const summaries: string[] = [];
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    let fileCount = 0;
    
    for (const entry of entries) {
      if (fileCount >= maxFiles) break;
      
      if (entry && entry.isFile() && !shouldSkipEntry(entry.name)) {
        const filePath = path.join(dirPath, entry.name);
        try {
          const stats = await fs.stat(filePath);
          const size = stats.size;
          const sizeStr = size > 1024 ? `${Math.round(size / 1024)}KB` : `${size}B`;
          
          // 生成内容摘要
          const contentSummary = await generateContentSummary(filePath, entry.name);
          summaries.push(`📄 ${entry.name} (${sizeStr}) - ${contentSummary}`);
          fileCount++;
        } catch (error) {
          summaries.push(`📄 ${entry.name} - 无法读取文件信息`);
        }
      }
    }
    
    // 统计目录
    const dirCount = entries.filter(entry => 
      entry && entry.isDirectory() && !shouldSkipEntry(entry.name)
    ).length;
    
    if (dirCount > 0) {
      summaries.unshift(`📁 包含 ${dirCount} 个子目录`);
    }
    
  } catch (error) {
    summaries.push('❌ 无法读取目录内容');
  }
  
  return summaries;
}

/**
 * 根据文件类型生成内容摘要
 */
export async function generateContentSummary(filePath: string, fileName: string): Promise<string> {
  try {
    const ext = path.extname(fileName).toLowerCase();
    
    // 根据文件扩展名判断类型
    if (['.json'].includes(ext)) {
      const content = await fs.readFile(filePath, 'utf-8');
      const json = JSON.parse(content);
      
      if (fileName === 'package.json') {
        const deps = Object.keys(json.dependencies || {}).length;
        const devDeps = Object.keys(json.devDependencies || {}).length;
        return `项目配置 (${deps} 个依赖, ${devDeps} 个开发依赖)`;
      }
      
      return `JSON 配置文件 (${Object.keys(json).length} 个字段)`;
    }
    
    if (['.ts', '.js', '.tsx', '.jsx'].includes(ext)) {
      const content = await fs.readFile(filePath, 'utf-8');
      const lines = content.split('\n').length;
      
      // 检测是否包含特定关键字
      if (content.includes('export default') || content.includes('export {')) {
        return `${ext.slice(1).toUpperCase()} 模块 (${lines} 行)`;
      }
      if (content.includes('import React') || content.includes('from \'react\'')) {
        return `React 组件 (${lines} 行)`;
      }
      if (content.includes('import Vue') || content.includes('from \'vue\'')) {
        return `Vue 组件 (${lines} 行)`;
      }
      
      return `${ext.slice(1).toUpperCase()} 文件 (${lines} 行)`;
    }
    
    if (['.css', '.scss', '.sass', '.less'].includes(ext)) {
      const content = await fs.readFile(filePath, 'utf-8');
      const rules = (content.match(/\{[^}]*\}/g) || []).length;
      return `样式文件 (约 ${rules} 个规则)`;
    }
    
    if (['.html', '.htm'].includes(ext)) {
      return 'HTML 页面';
    }
    
    if (['.md', '.markdown'].includes(ext)) {
      const content = await fs.readFile(filePath, 'utf-8');
      const headings = (content.match(/^#+\s/gm) || []).length;
      return `Markdown 文档 (${headings} 个标题)`;
    }
    
    if (['.yml', '.yaml'].includes(ext)) {
      return 'YAML 配置文件';
    }
    
    if (['.xml'].includes(ext)) {
      return 'XML 文件';
    }
    
    if (['.txt', '.log'].includes(ext)) {
      return '文本文件';
    }
    
    if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.ico'].includes(ext)) {
      return '图片文件';
    }
    
    // 特殊文件名
    if (fileName === 'README.md') {
      return '项目说明文档';
    }
    if (fileName === '.gitignore') {
      return 'Git 忽略规则';
    }
    if (fileName === 'LICENSE') {
      return '开源许可证';
    }
    
    return '文件';
    
  } catch (error) {
    return '无法解析内容';
  }
}