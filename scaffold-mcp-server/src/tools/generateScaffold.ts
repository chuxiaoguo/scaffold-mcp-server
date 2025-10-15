import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import degit from 'degit';
import type { 
  GenerateScaffoldParams, 
  GenerateResult, 
  TechStack, 
  DirectoryTree, 
  FileSummary 
} from '../types/index.js';
import { smartMatchFixedTemplate } from '../core/matcher.js';
import { NonFixedBuilder } from '../core/nonFixedBuilder/index.js';
import { ToolInjectorManager } from '../core/injectors/index.js';

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 生成脚手架的主函数
 */
export async function generateScaffold(params: GenerateScaffoldParams): Promise<GenerateResult> {
  const {
    tech_stack,
    project_name = 'my-project',
    output_dir = '.',
    extra_tools = [],
    options = {}
  } = params;

  // 解析技术栈
  const techStack = typeof tech_stack === 'string' || Array.isArray(tech_stack) 
    ? parseTechStack(tech_stack) 
    : tech_stack;
  
  // 确定目标路径
  const targetPath = path.resolve(output_dir, project_name);
  
  // 检查目录是否存在
  if (!options.force) {
    try {
      await fs.access(targetPath);
      throw new Error(`目录 ${targetPath} 已存在，使用 --force 选项强制覆盖`);
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  // 使用智能意图识别器匹配固定模板（异步配置驱动）
  const smartMatch = await smartMatchFixedTemplate(tech_stack);
  const fixedTemplate = smartMatch.template;
  const analysis = smartMatch.analysis;
  
  // 输出分析结果
  console.log(`🧠 智能意图分析:`);
  console.log(`   - 可使用固定模板: ${analysis.canUseFixedTemplate ? '是' : '否'}`);
  console.log(`   - 推荐模板: ${analysis.recommendedTemplate || '无'}`);
  console.log(`   - 分析原因: ${analysis.reason}`);
  if (analysis.suggestions && analysis.suggestions.length > 0) {
    console.log(`   - 建议: ${analysis.suggestions.join(', ')}`);
  }
  
  let projectFiles: Record<string, string> = {};
  let packageJson: any = {};
  let templateSource = '';

  if (fixedTemplate) {
    // 使用固定模板
    console.log(`✅ 使用固定模板: ${fixedTemplate.name}`);
    console.log(`📋 模板描述: ${fixedTemplate.description}`);
    templateSource = `固定模板 (GitHub): ${fixedTemplate.name}`;
    
    const templateResult = await generateFromFixedTemplate(fixedTemplate, project_name, techStack);
    projectFiles = templateResult.files;
    packageJson = templateResult.packageJson;
  } else {
    // 使用非固定模板生成器
    console.log(`🔧 使用动态生成器创建项目`);
    console.log(`📋 技术栈: ${JSON.stringify(techStack, null, 2)}`);
    templateSource = '动态生成器';
    
    const builder = new NonFixedBuilder();
    const buildResult = await builder.build(techStack, project_name);
    
    projectFiles = buildResult.files;
    packageJson = {
      name: project_name,
      version: '1.0.0',
      description: '',
      main: 'index.js',
      scripts: buildResult.scripts || {},
      dependencies: buildResult.dependencies || {},
      devDependencies: buildResult.devDependencies || {}
    };
  }

  // 注入额外工具
  if (extra_tools.length > 0) {
    const injectorManager = new ToolInjectorManager();
    const injectorResult = await injectorManager.injectSpecific(extra_tools, techStack, project_name);
    
    // 合并文件
    Object.assign(projectFiles, injectorResult.files);
    
    // 合并依赖
    if (injectorResult.dependencies) {
      Object.assign(packageJson.dependencies, injectorResult.dependencies);
    }
    if (injectorResult.devDependencies) {
      Object.assign(packageJson.devDependencies, injectorResult.devDependencies);
    }
    if (injectorResult.scripts) {
      Object.assign(packageJson.scripts, injectorResult.scripts);
    }
  }

  // 添加 package.json 到文件列表
  projectFiles['package.json'] = JSON.stringify(packageJson, null, 2);

  if (options.dryRun) {
    // 预览模式，不实际创建文件
    console.log('🔍 预览模式 - 将要生成的文件:');
    Object.keys(projectFiles).forEach(filePath => {
      console.log(`  - ${filePath}`);
    });
  } else {
    // 实际创建文件
    await createProjectFiles(targetPath, projectFiles);
    
    // 安装依赖
    if (options.install) {
      await installDependencies(targetPath, techStack.packageManager || 'npm');
    }
  }

  // 生成结果
  let tree: DirectoryTree | undefined;
  let files: FileSummary[] | undefined;
  
  if (options.dryRun) {
    // 预览模式，生成虚拟的目录树和文件摘要
    tree = {
      name: project_name,
      type: 'directory',
      path: targetPath,
      children: Object.keys(projectFiles).map(filePath => ({
        name: path.basename(filePath),
        type: 'file' as const,
        path: path.join(targetPath, filePath)
      }))
    };
    
    files = Object.entries(projectFiles).map(([filePath, content]) => ({
      path: filePath,
      size: content.length,
      type: path.extname(filePath).slice(1) || 'txt',
      summary: generateContentSummary(content, path.extname(filePath))
    }));
  } else {
    // 实际模式，读取真实的目录树和文件
    tree = await generateDirectoryTree(targetPath);
    files = await generateFileSummary(targetPath, projectFiles);
  }

  return {
    projectName: project_name,
    targetPath,
    tree,
    files,
    templateSource // 添加模板来源信息
  };
}

/**
 * 解析技术栈字符串或数组
 */
function parseTechStack(techStack: string | string[]): TechStack {
  const result: TechStack = {};
  
  if (typeof techStack === 'string') {
    // 解析字符串格式，如 "vue3+ts+vite"
    const parts = techStack.toLowerCase().split(/[+\-_]/);
    
    parts.forEach(part => {
      switch (part) {
        case 'vue3':
        case 'vue':
          result.framework = 'vue3';
          break;
        case 'react':
          result.framework = 'react';
          break;
        case 'ts':
        case 'typescript':
          result.language = 'typescript';
          break;
        case 'js':
        case 'javascript':
          result.language = 'javascript';
          break;
        case 'vite':
          result.builder = 'vite';
          break;
        case 'webpack':
          result.builder = 'webpack';
          break;
        case 'electron':
        case 'electron-vite':
          result.builder = 'electron-vite';
          break;
        case 'pinia':
          result.state = 'pinia';
          break;
        case 'vuex':
          result.state = 'vuex';
          break;
        case 'redux':
          result.state = 'redux';
          break;
        case 'zustand':
          result.state = 'zustand';
          break;
        case 'router':
        case 'vue-router':
          result.router = 'vue-router';
          break;
        case 'react-router':
          result.router = 'react-router';
          break;
        case 'element':
        case 'element-plus':
          result.ui = 'element-plus';
          break;
        case 'antd':
        case 'ant-design':
          result.ui = 'antd';
          break;
        case 'antd-vue':
          result.ui = 'antd-vue';
          break;
        case 'sass':
        case 'scss':
          result.style = 'sass';
          break;
        case 'less':
          result.style = 'less';
          break;
        case 'tailwind':
        case 'tailwindcss':
          result.style = 'tailwindcss';
          break;
        case 'pnpm':
          result.packageManager = 'pnpm';
          break;
        case 'yarn':
          result.packageManager = 'yarn';
          break;
        case 'npm':
          result.packageManager = 'npm';
          break;
      }
    });
  } else if (Array.isArray(techStack)) {
    // 处理数组格式
    techStack.forEach(tech => {
      const parsed = parseTechStack(tech);
      Object.assign(result, parsed);
    });
  }

  // 设置默认值
  if (!result.language) {
    result.language = 'typescript';
  }
  if (!result.builder) {
    result.builder = 'vite';
  }
  if (!result.packageManager) {
    result.packageManager = 'npm';
  }

  return result;
}

/**
 * 从固定模板生成项目
 */
async function generateFromFixedTemplate(template: any, projectName: string, techStack: TechStack) {
  const GITHUB_REPO = 'chuxiaoguo/scaffold-mcp-server';
  const GITHUB_BRANCH = 'mac';
  const TEMPLATE_PATH = `scaffold-template/${template.name}`;
  
  try {
    console.log(`🚀 正在从GitHub拉取模板: ${template.name}`);
    console.log(`📦 仓库地址: https://github.com/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${TEMPLATE_PATH}`);
    console.log(`🔄 开始 degit 克隆过程...`);
    
    // 使用 degit 从 GitHub 拉取模板
    const emitter = degit(`${GITHUB_REPO}/${TEMPLATE_PATH}#${GITHUB_BRANCH}`, {
      cache: false,
      force: true,
      verbose: true
    });
    
    // 监听 degit 事件
    emitter.on('info', (info: any) => {
      console.log(`ℹ️  Degit Info: ${info.message}`);
    });
    
    emitter.on('warn', (warn: any) => {
      console.log(`⚠️  Degit Warning: ${warn.message}`);
    });
    
    // 创建临时目录
    const tempDir = path.join(process.cwd(), '.temp-template', `${template.name}-${Date.now()}`);
    console.log(`📁 创建临时目录: ${tempDir}`);
    await fs.mkdir(tempDir, { recursive: true });
    
    try {
      console.log(`⬇️  开始下载模板文件...`);
      const startTime = Date.now();
      
      // 拉取模板到临时目录
      await emitter.clone(tempDir);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`✅ 模板拉取成功: ${tempDir} (耗时: ${duration}ms)`);
      
      // 统计下载的文件
      const fileCount = await countFiles(tempDir);
      console.log(`📊 下载文件统计: 共 ${fileCount} 个文件`);
      
      // 读取模板文件
      console.log(`📖 正在读取模板文件...`);
      const files: Record<string, string> = {};
      await readDirectoryRecursive(tempDir, files, tempDir);
      console.log(`📋 成功读取 ${Object.keys(files).length} 个文件`);
      
      // 读取 package.json
      let packageJson: any = {};
      try {
        const packageJsonPath = path.join(tempDir, 'package.json');
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageJsonContent);
        
        // 更新项目名称
        packageJson.name = projectName;
        console.log(`📦 成功读取并更新 package.json`);
      } catch (error) {
        console.warn('⚠️  未找到 package.json 文件');
      }
      
      // 清理临时目录
      console.log(`🧹 清理临时目录: ${tempDir}`);
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return { files, packageJson };
      
    } catch (degitError: any) {
      console.error(`❌ Degit 拉取失败:`, degitError.message || degitError);
      
      // 清理临时目录
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      
      // 回退到本地模板
      console.log(`🔄 回退到本地模板: ${template.name}`);
      return await generateFromLocalTemplate(template, projectName, techStack);
    }
    
  } catch (error: any) {
    console.error(`❌ GitHub 模板拉取失败:`, error.message || error);
    
    // 回退到本地模板
    console.log(`🔄 回退到本地模板: ${template.name}`);
    return await generateFromLocalTemplate(template, projectName, techStack);
  }
}

/**
 * 统计目录中的文件数量
 */
async function countFiles(dirPath: string): Promise<number> {
  let count = 0;
  
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    
    for (const entry of entries) {
      if (entry.isFile()) {
        count++;
      } else if (entry.isDirectory()) {
        const subDirPath = path.join(dirPath, entry.name);
        count += await countFiles(subDirPath);
      }
    }
  } catch (error) {
    // 忽略错误
  }
  
  return count;
}

/**
 * 从本地模板生成项目（回退方案）
 */
async function generateFromLocalTemplate(template: any, projectName: string, techStack: TechStack) {
  // 直接从本地模板目录复制文件
  const templatePath = path.resolve(__dirname, '../../..', 'scaffold-template', template.name);
  
  try {
    // 检查模板目录是否存在
    await fs.access(templatePath);
    
    // 直接读取模板目录中的所有文件
    const files: Record<string, string> = {};
    await readDirectoryRecursive(templatePath, files, templatePath);
    
    // 读取 package.json
    let packageJson: any = {};
    try {
      const packageJsonPath = path.join(templatePath, 'package.json');
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(packageJsonContent);
      
      // 更新项目名称
      packageJson.name = projectName;
    } catch (error) {
      console.warn('未找到 package.json 文件');
    }
    
    return { files, packageJson };
    
  } catch (error) {
    console.error(`本地模板 ${template.name} 不存在或无法访问:`, error);
    
    // 回退到基础模板
    return {
      files: {
        'src/main.ts': `// ${template.name} 项目入口文件\nconsole.log('Hello ${projectName}!');`,
        'README.md': `# ${projectName}\n\n基于 ${template.name} 模板创建的项目。`,
        '.gitignore': 'node_modules/\ndist/\n.env.local'
      },
      packageJson: {
        name: projectName,
        version: '1.0.0',
        description: `${template.name} 项目`,
        scripts: {
          dev: 'vite',
          build: 'vite build',
          preview: 'vite preview'
        },
        dependencies: {},
        devDependencies: {
          'vite': '^5.0.0',
          'typescript': '^5.0.0'
        }
      }
    };
  }
}

/**
 * 递归读取目录中的所有文件
 */
async function readDirectoryRecursive(dir: string, files: Record<string, string>, baseDir: string): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);
    
    // 跳过某些文件和目录
    if (entry.name.startsWith('.') && !entry.name.startsWith('.git')) {
      continue;
    }
    if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === 'build') {
      continue;
    }
    
    if (entry.isDirectory()) {
      await readDirectoryRecursive(fullPath, files, baseDir);
    } else {
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        files[relativePath] = content;
      } catch (error) {
        // 跳过二进制文件或无法读取的文件
        console.warn(`跳过文件 ${relativePath}:`, error);
      }
    }
  }
}

/**
 * 创建项目文件
 */
async function createProjectFiles(targetPath: string, files: Record<string, string>): Promise<void> {
  // 确保目标目录存在
  await fs.mkdir(targetPath, { recursive: true });

  // 创建所有文件
  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(targetPath, filePath);
    const dir = path.dirname(fullPath);
    
    // 确保目录存在
    await fs.mkdir(dir, { recursive: true });
    
    // 写入文件
    await fs.writeFile(fullPath, content, 'utf-8');
  }
}

/**
 * 安装依赖
 */
async function installDependencies(projectPath: string, packageManager: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(packageManager, ['install'], {
      cwd: projectPath,
      stdio: 'inherit'
    });

    child.on('close', (code: number | null) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`依赖安装失败，退出码: ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * 生成目录树
 */
async function generateDirectoryTree(rootPath: string): Promise<DirectoryTree> {
  const stats = await fs.stat(rootPath);
  const name = path.basename(rootPath);

  if (stats.isDirectory()) {
    const children: DirectoryTree[] = [];
    
    try {
      const entries = await fs.readdir(rootPath);
      
      for (const entry of entries) {
        // 跳过不需要显示的目录和文件
        if (shouldSkipEntry(entry)) {
          continue;
        }
        
        const childPath = path.join(rootPath, entry);
        const childTree = await generateDirectoryTree(childPath);
        children.push(childTree);
      }
    } catch (error) {
      // 忽略读取错误
    }

    return {
      name,
      type: 'directory',
      path: rootPath,
      ...(children.length > 0 && { children })
    };
  } else {
    return {
      name,
      type: 'file',
      path: rootPath
    };
  }
}

/**
 * 判断是否应该跳过某个目录或文件
 */
function shouldSkipEntry(entry: string): boolean {
  // 跳过 node_modules 目录
  if (entry === 'node_modules') {
    return true;
  }
  
  // 跳过 .git 目录
  if (entry === '.git') {
    return true;
  }
  
  // 跳过其他构建产物目录
  if (['dist', 'build', 'out', '.next', '.nuxt', 'coverage'].includes(entry)) {
    return true;
  }
  
  // 跳过临时文件和缓存目录
  if (['.cache', '.temp', '.tmp', '.DS_Store', 'Thumbs.db'].includes(entry)) {
    return true;
  }
  
  // 跳过 IDE 配置目录（除了一些重要的配置文件）
  if (['.vscode', '.idea', '.vs'].includes(entry)) {
    return true;
  }
  
  // 跳过日志文件
  if (entry.endsWith('.log')) {
    return true;
  }
  
  // 保留重要的隐藏文件
  if (entry.startsWith('.')) {
    const importantFiles = ['.gitignore', '.env.example', '.env.template', '.eslintrc', '.prettierrc', '.editorconfig'];
    const importantPatterns = ['.eslintrc.', '.prettierrc.', '.babelrc', '.npmrc', '.yarnrc'];
    
    // 检查是否是重要文件
    if (importantFiles.includes(entry)) {
      return false;
    }
    
    // 检查是否匹配重要文件模式
    if (importantPatterns.some(pattern => entry.startsWith(pattern))) {
      return false;
    }
    
    // 其他隐藏文件跳过
    return true;
  }
  
  return false;
}

/**
 * 生成文件摘要
 */
async function generateFileSummary(rootPath: string, files: Record<string, string>): Promise<FileSummary[]> {
  const summaries: FileSummary[] = [];

  for (const [filePath, content] of Object.entries(files)) {
    const fullPath = path.join(rootPath, filePath);
    const ext = path.extname(filePath);
    
    summaries.push({
      path: filePath,
      size: content.length,
      type: ext || 'file',
      summary: generateContentSummary(content, ext)
    });
  }

  return summaries;
}

/**
 * 生成内容摘要
 */
function generateContentSummary(content: string, ext: string): string {
  const lines = content.split('\n').length;
  
  switch (ext) {
    case '.json':
      return `JSON 配置文件，${lines} 行`;
    case '.ts':
    case '.tsx':
      return `TypeScript 文件，${lines} 行`;
    case '.js':
    case '.jsx':
      return `JavaScript 文件，${lines} 行`;
    case '.vue':
      return `Vue 组件文件，${lines} 行`;
    case '.css':
    case '.scss':
    case '.sass':
    case '.less':
      return `样式文件，${lines} 行`;
    case '.md':
      return `Markdown 文档，${lines} 行`;
    default:
      return `文本文件，${lines} 行`;
  }
}