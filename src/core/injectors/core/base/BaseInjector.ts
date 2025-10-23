import { AbstractCoreInjector, InjectionContext, InjectionResult, InjectorType } from '../interfaces.js';
import { TechStack } from '../../../../types/index.js';

/**
 * 基础文件注入器
 * 负责生成项目的基础文件：README.md, .gitignore, .npmrc
 */
export class BaseInjector extends AbstractCoreInjector {
  name = 'base';
  priority = 1; // 最高优先级，最先执行
  type = InjectorType.BASE;

  canHandle(techStack: TechStack): boolean {
    // 基础注入器对所有项目都适用
    return true;
  }

  inject(context: InjectionContext): InjectionResult {
    const { techStack, projectName, files, packageJson, logs } = context;
    
    this.addLog(logs, '生成基础项目文件');

    // 生成 README.md
    files['README.md'] = this.generateReadme(projectName, techStack);
    
    // 生成 .gitignore
    files['.gitignore'] = this.generateGitignore();
    
    // 生成 .npmrc
    files['.npmrc'] = this.generateNpmrc();

    // 设置基础 package.json 信息
    packageJson.name = projectName;
    packageJson.version = packageJson.version || '1.0.0';
    packageJson.description = packageJson.description || `基于 ${techStack.framework || 'JavaScript'} 的项目`;
    
    // 确保必要的字段存在
    if (!packageJson.scripts) packageJson.scripts = {};
    if (!packageJson.dependencies) packageJson.dependencies = {};
    if (!packageJson.devDependencies) packageJson.devDependencies = {};

    this.addLog(logs, '基础文件生成完成');

    return { files, packageJson, logs };
  }

  private generateReadme(projectName: string, techStack: TechStack): string {
    const techStackDesc = this.getTechStackDescription(techStack);
    
    return `# ${projectName}

${techStackDesc}

## 开发

\`\`\`bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建项目
npm run build
\`\`\`

## 项目结构

\`\`\`
${projectName}/
├── src/           # 源代码目录
├── dist/          # 构建输出目录
├── package.json   # 项目配置
└── README.md      # 项目说明
\`\`\`

## 技术栈

${this.getTechStackDetails(techStack)}
`;
  }

  private getTechStackDescription(techStack: TechStack): string {
    const parts = [];
    if (techStack.framework) parts.push(techStack.framework);
    if (techStack.builder) parts.push(techStack.builder);
    if (techStack.language) parts.push(techStack.language);
    
    return parts.length > 0 
      ? `基于 ${parts.join(' + ')} 的项目。`
      : '一个现代化的前端项目。';
  }

  private getTechStackDetails(techStack: TechStack): string {
    const details = [];
    
    if (techStack.framework) {
      details.push(`- **框架**: ${techStack.framework}`);
    }
    if (techStack.builder) {
      details.push(`- **构建工具**: ${techStack.builder}`);
    }
    if (techStack.language) {
      details.push(`- **语言**: ${techStack.language}`);
    }
    if (techStack.ui) {
      details.push(`- **UI库**: ${techStack.ui}`);
    }
    if (techStack.style) {
      details.push(`- **样式**: ${techStack.style}`);
    }
    if (techStack.router) {
      details.push(`- **路由**: ${techStack.router}`);
    }
    if (techStack.state) {
      details.push(`- **状态管理**: ${techStack.state}`);
    }

    return details.length > 0 ? details.join('\n') : '- **类型**: 通用项目';
  }

  private generateGitignore(): string {
    return `# 依赖
node_modules/
.pnpm-store/

# 构建输出
dist/
build/
out/

# 环境变量
.env.local
.env.*.local

# 日志
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# IDE
.vscode/
.idea/

# 操作系统
.DS_Store
Thumbs.db

# 临时文件
*.tmp
*.temp
.cache/

# 测试覆盖率
coverage/

# 其他
*.tgz
*.tar.gz`;
  }

  private generateNpmrc(): string {
    return `registry=https://registry.npmmirror.com/`;
  }
}