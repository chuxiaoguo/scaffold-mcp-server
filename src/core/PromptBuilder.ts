import * as path from "path";
import frameworkPrompts from "../../configs/prompts/framework-prompts.json" assert { type: "json" };
import buildtoolPrompts from "../../configs/prompts/buildtool-prompts.json" assert { type: "json" };
import languages from "../../configs/prompts/languages.json" assert { type: "json" };
import styles from "../../configs/prompts/styles.json" assert { type: "json" };
import uiLibraries from "../../configs/prompts/ui-libraries.json" assert { type: "json" };
import routers from "../../configs/prompts/routers.json" assert { type: "json" };
import stateManagement from "../../configs/prompts/state-management.json" assert { type: "json" };
import tools from "../../configs/prompts/tools.json" assert { type: "json" };

/**
 * 提示词配置接口
 */
export interface PromptConfig {
  projectName: string;
  framework?: string;
  builder?: string;
  language?: string;
  ui?: string;
  style?: string;
  router?: string;
  state?: string;
  tools: string[];
}

/**
 * 提示词模板数据
 */
interface PromptTemplates {
  frameworks: Record<string, any>;
  buildtools: Record<string, any>;
  languages: Record<string, any>;
  styles: Record<string, any>;
  uiLibraries: Record<string, any>;
  routers: Record<string, any>;
  stateManagement: Record<string, any>;
  tools: Record<string, any>;
}

/**
 * 提示词构建器
 * 负责根据技术栈配置生成结构化的项目构建提示词
 */
export class PromptBuilder {
  private static templates: PromptTemplates | null = null;

  private static async loadPromptTemplates(): Promise<PromptTemplates> {
    if (this.templates) {
      return this.templates;
    }

    this.templates = {
      frameworks: frameworkPrompts,
      buildtools: buildtoolPrompts,
      languages: languages,
      styles: styles,
      uiLibraries: uiLibraries,
      routers: routers,
      stateManagement: stateManagement,
      tools: tools,
    };

    return this.templates;
  }

  /**
   * 构建完整的项目生成提示词
   */
  static async build(config: PromptConfig): Promise<string> {
    const templates = await this.loadPromptTemplates();

    const sections = [
      this.buildHeader(config),
      this.buildProjectInfo(config),
      this.buildTechStackSection(config, templates),
      this.buildStructureGuidelines(config, templates),
      this.buildConfigRequirements(config, templates),
      this.buildDependencies(config, templates),
      this.buildBestPractices(config, templates),
      this.buildGenerationRequirements(),
    ];

    return sections.filter((s) => s.trim()).join("\n\n");
  }

  /**
   * 构建提示词头部
   */
  private static buildHeader(config: PromptConfig): string {
    return `# 🎯 项目脚手架生成提示词

> 请根据以下详细规范，生成一个完整、可运行的 **${config.projectName}** 项目脚手架。
> 所有配置文件必须完整可用，依赖版本需要相互兼容，遵循最新的最佳实践。`;
  }

  /**
   * 构建项目基本信息
   */
  private static buildProjectInfo(config: PromptConfig): string {
    return `## 📋 一、项目基本信息

- **项目名称**: \`${config.projectName}\`
- **框架**: ${config.framework || "未指定"}
- **构建工具**: ${config.builder || "未指定"}
- **开发语言**: ${config.language || "JavaScript"}
- **UI 库**: ${config.ui || "无"}
- **样式方案**: ${config.style || "CSS"}
- **路由**: ${config.router || "无"}
- **状态管理**: ${config.state || "无"}
- **额外工具**: ${config.tools.filter((t) => !["vue3", "react", "vite", "webpack", "typescript", "javascript"].includes(t)).join(", ") || "无"}`;
  }

  /**
   * 构建技术栈详细说明
   */
  private static buildTechStackSection(
    config: PromptConfig,
    templates: PromptTemplates
  ): string {
    const sections: string[] = ["## 🔧 二、技术栈详细要求\n"];

    // 框架要求
    if (config.framework && templates.frameworks[config.framework]) {
      const fw = templates.frameworks[config.framework];
      sections.push(`### 2.1 核心框架: ${fw.name}`);
      sections.push(fw.description);
      sections.push(`\n**入口文件**: \`${fw.entry?.file || "src/main.ts"}\``);
      sections.push(fw.entry?.description || "");

      if (fw.bestPractices && fw.bestPractices.length > 0) {
        sections.push("\n**开发规范**:");
        fw.bestPractices.forEach((practice: string) => {
          sections.push(`- ${practice}`);
        });
      }
    }

    // 构建工具要求
    if (config.builder && templates.buildtools[config.builder]) {
      const bt = templates.buildtools[config.builder];
      sections.push(`\n### 2.2 构建工具: ${bt.name}`);
      sections.push(bt.description);

      if (bt.configFile) {
        sections.push(`\n**配置文件**: \`${bt.configFile}\``);
      }

      if (bt.features && bt.features.length > 0) {
        sections.push("\n**核心特性**:");
        bt.features.forEach((feature: string) => {
          sections.push(`- ${feature}`);
        });
      }

      // 框架集成配置
      if (
        config.framework &&
        bt.integration &&
        bt.integration[config.framework]
      ) {
        const integration = bt.integration[config.framework];
        sections.push(`\n**${config.framework} 集成配置**:`);
        sections.push(`- 插件: \`${integration.plugin}\``);
        sections.push(`- 导入: \`${integration.import}\``);
        sections.push(`- 配置: \`${integration.config}\``);
      }
    }

    // 语言要求
    if (config.language === "typescript" && templates.languages["typescript"]) {
      const ts = templates.languages["typescript"];
      sections.push(`\n### 2.3 开发语言: ${ts.name}`);
      sections.push(ts.description);
      sections.push(`\n**配置文件**: \`${ts.configFile}\``);
      sections.push("\n**必需配置**:");
      ts.essentials.forEach((essential: string) => {
        sections.push(`- ${essential}`);
      });
    }

    return sections.join("\n");
  }

  /**
   * 构建项目结构指南
   */
  private static buildStructureGuidelines(
    config: PromptConfig,
    templates: PromptTemplates
  ): string {
    const sections: string[] = ["## 📁 三、项目目录结构\n"];

    if (config.framework && templates.frameworks[config.framework]) {
      const fw = templates.frameworks[config.framework];

      if (fw.structure && fw.structure.directories) {
        sections.push("**标准目录结构**:");
        sections.push("```");
        sections.push(`${config.projectName}/`);
        fw.structure.directories.forEach((dir: string) => {
          sections.push(`├── ${dir}`);
        });
        sections.push("├── package.json");
        sections.push("├── tsconfig.json  # TypeScript 项目");
        if (config.builder === "vite") {
          sections.push("├── vite.config.ts");
        } else if (config.builder === "webpack") {
          sections.push("├── webpack.config.js");
        }
        sections.push("└── README.md");
        sections.push("```");

        if (fw.structure.description) {
          sections.push(`\n${fw.structure.description}`);
        }
      }

      // 核心文件说明
      if (fw.coreFiles) {
        sections.push("\n**核心文件**:");
        Object.entries(fw.coreFiles).forEach(([file, desc]) => {
          sections.push(`- \`${file}\`: ${desc}`);
        });
      }
    }

    return sections.join("\n");
  }

  /**
   * 构建配置文件要求
   */
  private static buildConfigRequirements(
    config: PromptConfig,
    templates: PromptTemplates
  ): string {
    const sections: string[] = ["## ⚙️ 四、配置文件要求\n"];

    // package.json
    sections.push("### 4.1 package.json");
    sections.push("必须包含以下字段:");
    sections.push("- `name`: 项目名称");
    sections.push("- `version`: 版本号 (1.0.0)");
    sections.push('- `type`: "module" (ESM 项目)');
    sections.push("- `scripts`: 必要的脚本命令");
    sections.push("- `dependencies`: 运行时依赖");
    sections.push("- `devDependencies`: 开发依赖\n");

    // 构建工具配置
    if (config.builder && templates.buildtools[config.builder]) {
      const bt = templates.buildtools[config.builder];

      if (bt.configFile) {
        sections.push(`### 4.2 ${bt.configFile}`);

        if (bt.configContent && bt.configContent.essentials) {
          sections.push("**必需配置**:");
          bt.configContent.essentials.forEach((essential: string) => {
            sections.push(`- ${essential}`);
          });
        }
      }

      if (bt.scripts) {
        sections.push("\n**npm scripts**:");
        Object.entries(bt.scripts).forEach(([name, cmd]) => {
          sections.push(`- \`${name}\`: \`${cmd}\``);
        });
      }
    }

    // TypeScript 配置
    if (config.language === "typescript" && templates.languages["typescript"]) {
      const ts = templates.languages["typescript"];
      sections.push("\n### 4.3 tsconfig.json");
      sections.push("**必需配置**:");
      ts.essentials.forEach((essential: string) => {
        sections.push(`- ${essential}`);
      });
    }

    // 样式方案
    const styleTools = ["tailwind", "sass", "less", "styled-components", "css"];
    styleTools.forEach((tool) => {
      if (config.style === tool && templates.styles[tool]) {
        const feature = templates.styles[tool];
        sections.push(`\n### 4.4 ${feature.name}`);

        if (feature.configFile) {
          sections.push(`**配置文件**: \`${feature.configFile}\``);
        } else if (feature.configFiles) {
          sections.push("配置文件**:");
          Object.entries(feature.configFiles).forEach(([file, desc]) => {
            sections.push(`- \`${file}\`: ${desc}`);
          });
        }

        if (feature.essentials) {
          sections.push("\n**必需配置**:");
          feature.essentials.forEach((essential: string) => {
            sections.push(`- ${essential}`);
          });
        }
      }
    });

    // 其他工具配置 (eslint, prettier, etc.)
    const featureTools = [
      "eslint",
      "prettier",
      "vitest",
      "jest",
      "commitlint",
      "husky",
      "lint-staged",
      "stylelint",
    ];
    featureTools.forEach((tool) => {
      if (config.tools.includes(tool) && templates.tools[tool]) {
        const feature = templates.tools[tool];
        sections.push(`\n### 4.4 ${feature.name}`);

        if (feature.configFile) {
          sections.push(`**配置文件**: \`${feature.configFile}\``);
        } else if (feature.configFiles) {
          sections.push("**配置文件**:");
          Object.entries(feature.configFiles).forEach(([file, desc]) => {
            sections.push(`- \`${file}\`: ${desc}`);
          });
        }

        if (feature.essentials) {
          sections.push("\n**必需配置**:");
          feature.essentials.forEach((essential: string) => {
            sections.push(`- ${essential}`);
          });
        }
      }
    });

    return sections.join("\n");
  }

  /**
   * 构建依赖清单
   */
  private static buildDependencies(
    config: PromptConfig,
    templates: PromptTemplates
  ): string {
    const sections: string[] = ["## 📦 五、依赖包清单\n"];

    const deps: Record<string, string> = {};
    const devDeps: Record<string, string> = {};

    // 收集框架依赖
    if (config.framework && templates.frameworks[config.framework]) {
      const fw = templates.frameworks[config.framework];
      Object.assign(deps, fw.dependencies || {});
      Object.assign(devDeps, fw.devDependencies || {});
    }

    // 收集构建工具依赖
    if (config.builder && templates.buildtools[config.builder]) {
      const bt = templates.buildtools[config.builder];
      Object.assign(deps, bt.dependencies || {});
      Object.assign(devDeps, bt.devDependencies || {});

      // 处理构建工具与框架的集成依赖（如 Webpack + Vue2 需要 vue-loader）
      if (
        config.framework &&
        bt.integration &&
        bt.integration[config.framework]
      ) {
        const integration = bt.integration[config.framework];
        if (integration.dependencies) {
          Object.assign(devDeps, integration.dependencies);
        }
      }

      // 处理构建工具与语言的集成依赖（如 Webpack + TypeScript 需要 ts-loader）
      if (
        config.language &&
        bt.integration &&
        bt.integration[config.language]
      ) {
        const integration = bt.integration[config.language];
        if (integration.dependencies) {
          Object.assign(devDeps, integration.dependencies);
        }
      }
    }

    // 收集语言依赖
    if (config.language === "typescript" && templates.languages["typescript"]) {
      const ts = templates.languages["typescript"];
      Object.assign(devDeps, ts.dependencies || {});
    }

    // 收集 UI 库依赖
    if (config.ui && templates.uiLibraries[config.ui]) {
      const ui = templates.uiLibraries[config.ui];
      Object.assign(deps, ui.dependencies || {});
      Object.assign(devDeps, ui.devDependencies || {});
    }

    // 收集样式工具依赖
    if (config.style && templates.styles[config.style]) {
      const style = templates.styles[config.style];
      Object.assign(deps, style.dependencies || {});
      Object.assign(devDeps, style.dependencies || {});
    }

    // 收集路由依赖
    if (config.router && templates.routers[config.router]) {
      const router = templates.routers[config.router];
      Object.assign(deps, router.dependencies || {});
    }

    // 收集状态管理依赖
    if (config.state && templates.stateManagement[config.state]) {
      const state = templates.stateManagement[config.state];
      Object.assign(deps, state.dependencies || {});
    }

    // 收集其他特性依赖
    config.tools.forEach((tool) => {
      // 样式工具
      if (templates.styles[tool]) {
        const feature = templates.styles[tool];
        Object.assign(deps, feature.dependencies || {});
        Object.assign(devDeps, feature.dependencies || {});
      }
      // UI库
      if (templates.uiLibraries[tool]) {
        const feature = templates.uiLibraries[tool];
        Object.assign(deps, feature.dependencies || {});
        Object.assign(devDeps, feature.devDependencies || {});
      }
      // 路由
      if (templates.routers[tool]) {
        const feature = templates.routers[tool];
        Object.assign(deps, feature.dependencies || {});
      }
      // 状态管理
      if (templates.stateManagement[tool]) {
        const feature = templates.stateManagement[tool];
        Object.assign(deps, feature.dependencies || {});
      }
      // 其他工具
      if (templates.tools[tool]) {
        const feature = templates.tools[tool];
        Object.assign(deps, feature.dependencies || {});
        Object.assign(devDeps, feature.dependencies || {});
      }
    });

    if (Object.keys(deps).length > 0) {
      sections.push("### 5.1 dependencies (运行时依赖)");
      sections.push("```json");
      sections.push(JSON.stringify(deps, null, 2));
      sections.push("```\n");
    }

    if (Object.keys(devDeps).length > 0) {
      sections.push("### 5.2 devDependencies (开发依赖)");
      sections.push("```json");
      sections.push(JSON.stringify(devDeps, null, 2));
      sections.push("```");
    }

    sections.push("\n**版本兼容性要求**:");
    sections.push("- 确保所有依赖版本相互兼容");
    sections.push("- 优先使用最新稳定版本");
    sections.push("- 注意 peer dependencies 的版本要求");

    return sections.join("\n");
  }

  /**
   * 构建最佳实践指南
   */
  private static buildBestPractices(
    config: PromptConfig,
    templates: PromptTemplates
  ): string {
    const sections: string[] = ["## 💡 六、开发规范与最佳实践\n"];

    const practices: string[] = [];

    // 框架最佳实践
    if (config.framework && templates.frameworks[config.framework]) {
      const fw = templates.frameworks[config.framework];
      if (fw.bestPractices) {
        practices.push(...fw.bestPractices);
      }
    }

    // 语言最佳实践
    if (config.language === "typescript" && templates.languages["typescript"]) {
      const ts = templates.languages["typescript"];
      if (ts.bestPractices) {
        practices.push(...ts.bestPractices);
      }
    }

    // 其他工具最佳实践
    config.tools.forEach((tool) => {
      // 样式工具
      if (templates.styles[tool]?.bestPractices) {
        practices.push(...templates.styles[tool].bestPractices);
      }
      // UI库
      if (templates.uiLibraries[tool]?.bestPractices) {
        practices.push(...templates.uiLibraries[tool].bestPractices);
      }
      // 路由
      if (templates.routers[tool]?.bestPractices) {
        practices.push(...templates.routers[tool].bestPractices);
      }
      // 状态管理
      if (templates.stateManagement[tool]?.bestPractices) {
        practices.push(...templates.stateManagement[tool].bestPractices);
      }
      // 其他工具
      if (templates.tools[tool]?.bestPractices) {
        practices.push(...templates.tools[tool].bestPractices);
      }
    });

    if (practices.length > 0) {
      practices.forEach((practice) => {
        sections.push(`- ${practice}`);
      });
    } else {
      sections.push("- 遵循框架官方推荐的最佳实践");
      sections.push("- 保持代码简洁、可维护");
      sections.push("- 添加适当的注释说明");
    }

    return sections.join("\n");
  }

  /**
   * 构建生成要求
   */
  private static buildGenerationRequirements(): string {
    return `## ✅ 七、项目生成要求

**请确保生成的项目满足以下标准**:

1. **完整性**
   - 所有配置文件完整且可用
   - package.json 包含所有必要依赖
   - 项目可以直接运行 \`npm install\` 安装依赖

2. **可运行性**
   - \`npm run dev\` 可以启动开发服务器
   - \`npm run build\` 可以成功构建项目
   - 无任何配置错误或依赖缺失

3. **代码质量**
   - 遵循框架官方推荐的代码风格
   - 适当的代码注释
   - 合理的文件组织结构

4. **现代化**
   - 使用最新稳定版本的依赖
   - 采用现代化的语法和特性
   - 遵循当前的最佳实践

5. **扩展性**
   - 结构清晰，易于扩展
   - 配置灵活，便于定制
   - 模块化设计，职责分离

---

**请立即生成符合上述所有要求的完整项目代码和配置文件。**`;
  }
}
