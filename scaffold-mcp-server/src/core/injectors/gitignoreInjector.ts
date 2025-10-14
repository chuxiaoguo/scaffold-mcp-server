import type { TechStack } from '../../types/index.js';
import type { IToolInjector, InjectorResult } from './index.js';

export class GitignoreInjector implements IToolInjector {
  async inject(techStack: TechStack, projectName: string): Promise<InjectorResult> {
    const result: InjectorResult = {
      files: {},
      devDependencies: {},
      scripts: {}
    };

    // 生成 .gitignore 文件
    result.files['.gitignore'] = this.generateGitignore(techStack);

    return result;
  }

  isRequired(techStack: TechStack): boolean {
    // .gitignore 对所有项目都是必需的
    return true;
  }

  private generateGitignore(techStack: TechStack): string {
    const sections = [
      this.getNodeSection(),
      this.getBuildSection(techStack),
      this.getIDESection(),
      this.getOSSection(),
      this.getLogSection(),
      this.getEnvironmentSection(),
      this.getCoverageSection(),
      this.getTempSection()
    ];

    return sections.join('\n\n');
  }

  private getNodeSection(): string {
    return `# Dependencies
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*`;
  }

  private getBuildSection(techStack: TechStack): string {
    let section = `# Build outputs
dist/
build/
out/`;

    if (techStack.builder === 'vite') {
      section += '\n.vite/';
    }

    if (techStack.builder === 'webpack') {
      section += '\nbundle/\nwebpack-stats.json';
    }

    if (techStack.builder === 'electron-vite') {
      section += '\nrelease/\napp/';
    }

    return section;
  }

  private getIDESection(): string {
    return `# IDE files
.vscode/
.idea/
*.swp
*.swo
*~`;
  }

  private getOSSection(): string {
    return `# OS files
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Thumbs.db`;
  }

  private getLogSection(): string {
    return `# Logs
logs/
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*`;
  }

  private getEnvironmentSection(): string {
    return `# Environment files
.env
.env.local
.env.development.local
.env.test.local
.env.production.local
.env.*.local`;
  }

  private getCoverageSection(): string {
    return `# Coverage directory used by tools like istanbul
coverage/
*.lcov
.nyc_output/`;
  }

  private getTempSection(): string {
    return `# Temporary files
*.tmp
*.temp
.cache/
.parcel-cache/
.next/
.nuxt/
.vuepress/dist/
.serverless/
.fusebox/
.dynamodb/
.tern-port`;
  }
}