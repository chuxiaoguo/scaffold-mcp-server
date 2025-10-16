import * as path from 'path';
import * as fs from 'fs/promises';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import degit from 'degit';
import type { TechStack } from '../types/index.js';

// ES 模块中获取 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TemplateResult {
  files: Record<string, string>;
  packageJson: any;
  processLogs?: string[]; // 添加过程日志字段，用于故障排除（后续会移除）
}

/**
 * 使用 Git Sparse-Checkout 下载特定文件夹
 */
async function downloadWithSparseCheckout(
  repoUrl: string,
  branch: string,
  templatePath: string,
  tempDir: string,
  logs: string[] = []
): Promise<void> {
  return new Promise((resolve, reject) => {
    logs.push(`🔧 使用 Git Sparse-Checkout 下载模板...`);
    logs.push(`📦 仓库: ${repoUrl}`);
    logs.push(`🌿 分支: ${branch}`);
    logs.push(`📁 路径: ${templatePath}`);
    
    console.log(`🔧 使用 Git Sparse-Checkout 下载模板...`);
    console.log(`📦 仓库: ${repoUrl}`);
    console.log(`🌿 分支: ${branch}`);
    console.log(`📁 路径: ${templatePath}`);
    
    // Step 1: Clone with sparse-checkout
    const cloneProcess = spawn('git', [
      'clone',
      '--filter=blob:none',
      '--sparse',
      '--branch', branch,
      repoUrl,
      '.'
    ], {
      cwd: tempDir,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    let cloneOutput = '';
    let cloneError = '';
    
    cloneProcess.stdout?.on('data', (data) => {
      const output = data.toString();
      cloneOutput += output;
      logs.push(`Git Clone stdout: ${output.trim()}`);
    });
    
    cloneProcess.stderr?.on('data', (data) => {
      const error = data.toString();
      cloneError += error;
      logs.push(`Git Clone stderr: ${error.trim()}`);
    });
    
    cloneProcess.on('close', (code) => {
      logs.push(`Git Clone 进程退出，退出码: ${code}`);
      
      if (code !== 0) {
        logs.push(`❌ Git clone 失败: ${cloneError}`);
        reject(new Error(`Git clone failed: ${cloneError}`));
        return;
      }
      
      logs.push(`✅ Git clone 完成`);
      console.log(`✅ Git clone 完成`);
      
      // Step 2: Set sparse-checkout path
      const sparseProcess = spawn('git', [
        'sparse-checkout',
        'set',
        templatePath
      ], {
        cwd: tempDir,
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let sparseOutput = '';
      let sparseError = '';
      
      sparseProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        sparseOutput += output;
        logs.push(`Git Sparse-checkout stdout: ${output.trim()}`);
      });
      
      sparseProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        sparseError += error;
        logs.push(`Git Sparse-checkout stderr: ${error.trim()}`);
      });
      
      sparseProcess.on('close', (sparseCode) => {
        logs.push(`Git Sparse-checkout 进程退出，退出码: ${sparseCode}`);
        
        if (sparseCode !== 0) {
          logs.push(`❌ Git sparse-checkout 失败: ${sparseError}`);
          reject(new Error(`Git sparse-checkout failed: ${sparseError}`));
          return;
        }
        
        logs.push(`✅ Sparse-checkout 配置完成`);
        console.log(`✅ Sparse-checkout 配置完成`);
        resolve();
      });
    });
  });
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
 * 从固定模板生成项目
 */
export async function generateFromFixedTemplate(
  template: any, 
  projectName: string, 
  techStack: TechStack,
  logs: string[] = []
): Promise<TemplateResult> {
  
  const GITHUB_REPO = 'chuxiaoguo/scaffold-mcp-server';
  const GITHUB_BRANCH = 'mac';
  const TEMPLATE_PATH = `scaffold-template/${template.name}`;
  const REPO_URL = `https://github.com/${GITHUB_REPO}.git`;
  
  logs.push(`🚀 开始从GitHub拉取模板: ${template.name}`);
  logs.push(`📦 仓库地址: https://github.com/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${TEMPLATE_PATH}`);
  
  // 创建临时目录
  const tempDir = path.join(process.cwd(), '.temp-template', `${template.name}-${Date.now()}`);
  logs.push(`📁 创建临时目录: ${tempDir}`);
  console.log(`📁 创建临时目录: ${tempDir}`);
  await fs.mkdir(tempDir, { recursive: true });
  
  try {
    console.log(`🚀 正在从GitHub拉取模板: ${template.name}`);
    console.log(`📦 仓库地址: https://github.com/${GITHUB_REPO}/tree/${GITHUB_BRANCH}/${TEMPLATE_PATH}`);
    
    const startTime = Date.now();
    
    // 首先尝试使用 Git Sparse-Checkout（推荐方案）
    try {
      logs.push(`🔄 尝试使用 Git Sparse-Checkout...`);
      console.log(`🔄 尝试使用 Git Sparse-Checkout...`);
      await downloadWithSparseCheckout(REPO_URL, GITHUB_BRANCH, TEMPLATE_PATH, tempDir, logs);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      logs.push(`✅ Git Sparse-Checkout 成功 (耗时: ${duration}ms)`);
      console.log(`✅ Git Sparse-Checkout 成功 (耗时: ${duration}ms)`);
      
      // 检查模板文件是否存在
      const templateDir = path.join(tempDir, TEMPLATE_PATH);
      try {
        await fs.access(templateDir);
        logs.push(`📂 模板目录确认存在: ${templateDir}`);
        console.log(`📂 模板目录确认存在: ${templateDir}`);
      } catch {
        const error = `模板目录不存在: ${templateDir}`;
        logs.push(`❌ ${error}`);
        throw new Error(error);
      }
      
      // 统计下载的文件
      const fileCount = await countFiles(templateDir);
      logs.push(`📊 下载文件统计: 共 ${fileCount} 个文件`);
      console.log(`📊 下载文件统计: 共 ${fileCount} 个文件`);
      
      // 读取模板文件
      logs.push(`📖 正在读取模板文件...`);
      console.log(`📖 正在读取模板文件...`);
      const files: Record<string, string> = {};
      await readDirectoryRecursive(templateDir, files, templateDir);
      logs.push(`📋 成功读取 ${Object.keys(files).length} 个文件`);
      console.log(`📋 成功读取 ${Object.keys(files).length} 个文件`);
      
      // 读取 package.json
      let packageJson: any = {};
      try {
        const packageJsonPath = path.join(templateDir, 'package.json');
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        packageJson = JSON.parse(packageJsonContent);
        
        // 更新项目名称
        packageJson.name = projectName;
        logs.push(`📦 成功读取并更新 package.json`);
        console.log(`📦 成功读取并更新 package.json`);
      } catch (error) {
        logs.push('⚠️  未找到 package.json 文件');
        console.warn('⚠️  未找到 package.json 文件');
      }
      
      // 清理临时目录
      logs.push(`🧹 清理临时目录: ${tempDir}`);
      console.log(`🧹 清理临时目录: ${tempDir}`);
      await fs.rm(tempDir, { recursive: true, force: true });
      
      return { files, packageJson, processLogs: logs };
      
    } catch (sparseError: any) {
      logs.push(`⚠️  Git Sparse-Checkout 失败: ${sparseError.message}`);
      logs.push(`🔄 回退到 degit 方案...`);
      console.warn(`⚠️  Git Sparse-Checkout 失败: ${sparseError.message}`);
      console.log(`🔄 回退到 degit 方案...`);
      
      // 清理临时目录，准备重新创建
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
      await fs.mkdir(tempDir, { recursive: true });
      
      // 回退到 degit 方案
      const emitter = degit(`${GITHUB_REPO}/${TEMPLATE_PATH}#${GITHUB_BRANCH}`, {
        cache: false,
        force: true,
        verbose: true
      });
      
      // 监听 degit 事件
      emitter.on('info', (info: any) => {
        const message = `ℹ️  Degit Info: ${info.message}`;
        logs.push(message);
        console.log(message);
      });
      
      emitter.on('warn', (warn: any) => {
        const message = `⚠️  Degit Warning: ${warn.message}`;
        logs.push(message);
        console.log(message);
      });
      
      try {
        logs.push(`⬇️  开始 degit 下载模板文件...`);
        console.log(`⬇️  开始 degit 下载模板文件...`);
        const degitStartTime = Date.now();
        
        // 拉取模板到临时目录
        await emitter.clone(tempDir);
        
        const degitEndTime = Date.now();
        const degitDuration = degitEndTime - degitStartTime;
        logs.push(`✅ Degit 拉取成功: ${tempDir} (耗时: ${degitDuration}ms)`);
        console.log(`✅ Degit 拉取成功: ${tempDir} (耗时: ${degitDuration}ms)`);
        
        // 统计下载的文件
        const fileCount = await countFiles(tempDir);
        logs.push(`📊 下载文件统计: 共 ${fileCount} 个文件`);
        console.log(`📊 下载文件统计: 共 ${fileCount} 个文件`);
        
        // 读取模板文件
        logs.push(`📖 正在读取模板文件...`);
        console.log(`📖 正在读取模板文件...`);
        const files: Record<string, string> = {};
        await readDirectoryRecursive(tempDir, files, tempDir);
        logs.push(`📋 成功读取 ${Object.keys(files).length} 个文件`);
        console.log(`📋 成功读取 ${Object.keys(files).length} 个文件`);
        
        // 读取 package.json
        let packageJson: any = {};
        try {
          const packageJsonPath = path.join(tempDir, 'package.json');
          const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
          packageJson = JSON.parse(packageJsonContent);
          
          // 更新项目名称
          packageJson.name = projectName;
          logs.push(`📦 成功读取并更新 package.json`);
          console.log(`📦 成功读取并更新 package.json`);
        } catch (error) {
          logs.push('⚠️  未找到 package.json 文件');
          console.warn('⚠️  未找到 package.json 文件');
        }
        
        // 清理临时目录
        logs.push(`🧹 清理临时目录: ${tempDir}`);
        console.log(`🧹 清理临时目录: ${tempDir}`);
        await fs.rm(tempDir, { recursive: true, force: true });
        
        return { files, packageJson, processLogs: logs };
        
      } catch (degitError: any) {
        logs.push(`❌ Degit 拉取也失败了: ${degitError.message || degitError}`);
        console.error(`❌ Degit 拉取也失败了:`, degitError.message || degitError);
        
        // 清理临时目录
        await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
        
        // 最终回退到本地模板
        logs.push(`🔄 最终回退到本地模板: ${template.name}`);
        console.log(`🔄 最终回退到本地模板: ${template.name}`);
        const localResult = await generateFromLocalTemplate(template, projectName, techStack, logs);
        
        return { ...localResult, processLogs: logs };
      }
    }
    
  } catch (error: any) {
    logs.push(`❌ GitHub 模板拉取失败: ${error.message || error}`);
    console.error(`❌ GitHub 模板拉取失败:`, error.message || error);
    
    // 清理临时目录
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    
    // 回退到本地模板
    logs.push(`🔄 回退到本地模板: ${template.name}`);
    console.log(`🔄 回退到本地模板: ${template.name}`);
    const localResult = await generateFromLocalTemplate(template, projectName, techStack, logs);
    
    return { ...localResult, processLogs: logs };
  }
}

/**
 * 从本地模板生成项目（回退方案）
 */
export async function generateFromLocalTemplate(
  template: any, 
  projectName: string, 
  techStack: TechStack,
  logs: string[] = []
): Promise<TemplateResult> {
  
  logs.push(`🔍 开始本地模板路径计算:`);
  logs.push(`   - __dirname: ${__dirname}`);
  logs.push(`   - 模板名称: ${template.name}`);
  logs.push(`   - process.cwd(): ${process.cwd()}`);
  
  console.log(`🔍 本地模板路径计算:`);
  console.log(`   - __dirname: ${__dirname}`);
  console.log(`   - 模板名称: ${template.name}`);
  console.log(`   - process.cwd(): ${process.cwd()}`);
  
  // 多种路径查找策略
  const possiblePaths = [
    // 1. 相对于当前脚本的路径（开发环境）
    path.resolve(__dirname, '../../..', 'scaffold-template', template.name),
    // 2. 相对于当前工作目录的路径
    path.resolve(process.cwd(), 'scaffold-template', template.name),
    // 3. 相对于 package.json 所在目录的路径
    path.resolve(process.cwd(), '..', 'scaffold-template', template.name),
    // 4. npm 全局安装时的路径
    path.resolve(__dirname, '../../../..', 'scaffold-template', template.name),
    // 5. 检查是否在 node_modules 中
    path.resolve(__dirname, '../../../../scaffold-template', template.name)
  ];
  
  logs.push(`   - 尝试的路径列表:`);
  possiblePaths.forEach((p, i) => {
    logs.push(`     ${i + 1}. ${p}`);
  });
  
  console.log(`   - 尝试的路径列表:`);
  possiblePaths.forEach((p, i) => {
    console.log(`     ${i + 1}. ${p}`);
  });
  
  let templatePath: string | null = null;
  let templateContents: string[] = [];
  
  // 依次尝试每个可能的路径
  for (const possiblePath of possiblePaths) {
    try {
      logs.push(`📁 检查模板目录: ${possiblePath}`);
      console.log(`📁 检查模板目录: ${possiblePath}`);
      await fs.access(possiblePath);
      
      // 验证这是一个有效的模板目录（包含必要文件）
      const contents = await fs.readdir(possiblePath);
      if (contents.length > 0) {
        templatePath = possiblePath;
        templateContents = contents;
        logs.push(`✅ 找到有效模板目录: ${templatePath}`);
        logs.push(`📋 模板目录内容: ${templateContents.join(', ')}`);
        console.log(`✅ 找到有效模板目录: ${templatePath}`);
        console.log(`📋 模板目录内容: ${templateContents.join(', ')}`);
        break;
      }
    } catch (error) {
      logs.push(`   ❌ 路径不存在或无法访问: ${possiblePath}`);
      console.log(`   ❌ 路径不存在或无法访问: ${possiblePath}`);
    }
  }
  
  if (!templatePath) {
    logs.push(`❌ 所有路径都无法找到模板 ${template.name}`);
    logs.push(`🔄 回退到基础模板生成`);
    console.error(`❌ 所有路径都无法找到模板 ${template.name}`);
    console.log(`🔄 回退到基础模板生成`);
    
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
      },
      processLogs: logs
    };
  }
  
  try {
    logs.push(`📖 开始读取本地模板文件...`);
    console.log(`📖 开始读取本地模板文件...`);
    
    // 直接读取模板目录中的所有文件
    const files: Record<string, string> = {};
    await readDirectoryRecursive(templatePath, files, templatePath);
    logs.push(`📖 成功读取 ${Object.keys(files).length} 个文件`);
    console.log(`📖 成功读取 ${Object.keys(files).length} 个文件`);
    
    // 读取 package.json
    let packageJson: any = {};
    try {
      const packageJsonPath = path.join(templatePath, 'package.json');
      logs.push(`📦 尝试读取 package.json: ${packageJsonPath}`);
      const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
      packageJson = JSON.parse(packageJsonContent);
      
      // 更新项目名称
      packageJson.name = projectName;
      logs.push(`📦 成功读取并更新 package.json`);
      console.log(`📦 成功读取并更新 package.json`);
    } catch (error) {
      logs.push('⚠️  未找到 package.json 文件，将使用默认配置');
      console.warn('⚠️  未找到 package.json 文件，将使用默认配置');
      packageJson = {
        name: projectName,
        version: '1.0.0',
        description: `${template.name} 项目`,
        scripts: {
          dev: 'npm run start',
          build: 'npm run build:prod',
          start: 'npm run dev'
        },
        dependencies: {},
        devDependencies: {}
      };
    }
    
    return { files, packageJson, processLogs: logs };
    
  } catch (error) {
    logs.push(`❌ 读取模板文件失败: ${error}`);
    console.error(`❌ 读取模板文件失败:`, error);
    
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
      },
      processLogs: logs
    };
  }
}