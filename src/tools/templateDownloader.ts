import * as path from "path";
import * as fs from "fs/promises";
import { fileURLToPath } from "url";
import type { TechStack } from "../types/index.js";
import { logger } from "../utils/logger.js";

// 获取 __dirname 的 ES 模块等价方式
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface TemplateResult {
  files: Record<string, string>;
  packageJson: any;
  processLogs?: string[]; // 添加过程日志字段，用于故障排除（后续会移除）
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
async function readDirectoryRecursive(
  dir: string,
  files: Record<string, string>,
  baseDir: string
): Promise<void> {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relativePath = path.relative(baseDir, fullPath);

    // 跳过某些文件和目录
    if (entry.name.startsWith(".") && !entry.name.startsWith(".git")) {
      continue;
    }
    if (
      entry.name === "node_modules" ||
      entry.name === "dist" ||
      entry.name === "build"
    ) {
      continue;
    }

    if (entry.isDirectory()) {
      await readDirectoryRecursive(fullPath, files, baseDir);
    } else {
      try {
        const content = await fs.readFile(fullPath, "utf-8");
        files[relativePath] = content;
      } catch (error) {
        // 跳过二进制文件或无法读取的文件
        console.warn(`跳过文件 ${relativePath}:`, error);
      }
    }
  }
}

export async function generateFromFixedTemplate(
  template: any,
  projectName: string,
  techStack: TechStack,
  logs: string[] = []
): Promise<TemplateResult> {
  logs.push(`🚀 开始使用本地模板: ${template.name}`);
  console.log(`🚀 开始使用本地模板: ${template.name}`);

  // 直接使用本地模板，不再从GitHub拉取
  const localResult = await generateFromLocalTemplate(
    template,
    projectName,
    techStack,
    logs
  );

  return { ...localResult, processLogs: logs };
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

  // 检测是否在npx环境中
  const isNpxEnvironment =
    __dirname.includes("_npx") ||
    __dirname.includes("node_modules/scaffold-mcp-server");
  logs.push(`   - 是否npx环境: ${isNpxEnvironment}`);
  console.log(`   - 是否npx环境: ${isNpxEnvironment}`);

  let projectRoot: string = path.resolve(__dirname, "../../..");
  let possiblePaths: string[] = [];

  if (isNpxEnvironment) {
    // npx环境：__dirname 通常是 /path/to/_npx/xxx/node_modules/scaffold-mcp-server/dist/tools
    // 需要找到 scaffold-mcp-server 包的根目录
    const packageRootMatch = __dirname.match(/(.*\/scaffold-mcp-server)/);
    if (packageRootMatch && packageRootMatch[1]) {
      projectRoot = packageRootMatch[1];
      logs.push(`   - npx包根目录: ${projectRoot}`);
      console.log(`   - npx包根目录: ${projectRoot}`);

      // npx环境下的路径策略
      possiblePaths = [
        // 1. 直接在包根目录下的scaffold-template
        path.resolve(projectRoot, "scaffold-template", template.name),
        // 2. 相对于dist目录的上级目录
        path.resolve(__dirname, "../..", "scaffold-template", template.name),
        // 3. 相对于当前脚本目录的上级目录
        path.resolve(__dirname, "../../scaffold-template", template.name),
      ];
    } else {
      // 如果无法解析包根目录，使用传统方法
      projectRoot = path.resolve(__dirname, "../../..");
      possiblePaths = [
        path.resolve(__dirname, "../../..", "scaffold-template", template.name),
        path.resolve(__dirname, "../..", "scaffold-template", template.name),
      ];
    }
  } else {
    // 开发环境或本地安装环境
    projectRoot = path.resolve(__dirname, "../../..");
    possiblePaths = [
      // 1. 相对于当前脚本的路径（开发环境）
      path.resolve(__dirname, "../../..", "scaffold-template", template.name),
      // 2. 相对于项目根目录的路径
      path.resolve(projectRoot, "scaffold-template", template.name),
      // 3. 在dist目录下的模板路径（构建后的环境）
      path.resolve(__dirname, "..", "scaffold-template", template.name),
      // 4. 相对于项目根目录上级的路径
      path.resolve(projectRoot, "..", "scaffold-template", template.name),
      // 5. npm 全局安装时的路径
      path.resolve(
        __dirname,
        "../../../..",
        "scaffold-template",
        template.name
      ),
      // 6. 检查是否在 node_modules 中
      path.resolve(__dirname, "../../../../scaffold-template", template.name),
    ];
  }

  logs.push(`   - 项目根目录: ${projectRoot}`);
  console.log(`🔍 本地模板路径计算:`);
  console.log(`   - __dirname: ${__dirname}`);
  console.log(`   - 模板名称: ${template.name}`);
  console.log(`   - 是否npx环境: ${isNpxEnvironment}`);
  console.log(`   - 项目根目录: ${projectRoot}`);

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
        logs.push(`📋 模板目录内容: ${templateContents.join(", ")}`);
        console.log(`✅ 找到有效模板目录: ${templatePath}`);
        console.log(`📋 模板目录内容: ${templateContents.join(", ")}`);
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
        "src/main.ts": `// ${template.name} 项目入口文件\nconsole.log('Hello ${projectName}!');`,
        "README.md": `# ${projectName}\n\n基于 ${template.name} 模板创建的项目。`,
        ".gitignore": "node_modules/\ndist/\n.env.local",
      },
      packageJson: {
        name: projectName,
        version: "1.0.0",
        description: `${template.name} 项目`,
        scripts: {
          dev: "npm run start",
          build: "npm run build:prod",
          start: "npm run dev",
        },
        dependencies: {},
        devDependencies: {},
      },
      processLogs: logs,
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
      const packageJsonPath = path.join(templatePath, "package.json");
      logs.push(`📦 尝试读取 package.json: ${packageJsonPath}`);
      const packageJsonContent = await fs.readFile(packageJsonPath, "utf-8");
      packageJson = JSON.parse(packageJsonContent);

      // 更新项目名称
      packageJson.name = projectName;
      logs.push(`📦 成功读取并更新 package.json`);
      console.log(`📦 成功读取并更新 package.json`);
    } catch (error) {
      logs.push("⚠️  未找到 package.json 文件，将使用默认配置");
      console.warn("⚠️  未找到 package.json 文件，将使用默认配置");
      packageJson = {
        name: projectName,
        version: "1.0.0",
        description: `${template.name} 项目`,
        scripts: {
          dev: "npm run start",
          build: "npm run build:prod",
          start: "npm run dev",
        },
        dependencies: {},
        devDependencies: {},
      };
    }

    return { files, packageJson, processLogs: logs };
  } catch (error) {
    logs.push(`❌ 读取模板文件失败: ${error}`);
    console.error(`❌ 读取模板文件失败:`, error);

    // 回退到基础模板
    return {
      files: {
        "src/main.ts": `// ${template.name} 项目入口文件\nconsole.log('Hello ${projectName}!');`,
        "README.md": `# ${projectName}\n\n基于 ${template.name} 模板创建的项目。`,
        ".gitignore": "node_modules/\ndist/\n.env.local",
      },
      packageJson: {
        name: projectName,
        version: "1.0.0",
        description: `${template.name} 项目`,
        scripts: {
          dev: "vite",
          build: "vite build",
          preview: "vite preview",
        },
        dependencies: {},
        devDependencies: {
          vite: "^5.0.0",
          typescript: "^5.0.0",
        },
      },
      processLogs: logs,
    };
  }
}