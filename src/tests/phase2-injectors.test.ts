import { UnifiedInjectorManager } from "../core/injectors/unified/UnifiedInjectorManager.js";
import { InjectorRegistry } from "../core/injectors/unified/InjectorRegistry.js";
import { UnifiedInjectionContext } from "../types/index.js";

describe("Phase 2: 完整注入器生态测试", () => {
  let manager: UnifiedInjectorManager;

  beforeEach(() => {
    manager = InjectorRegistry.getInstance().getManager();
  });

  describe("注入器注册验证", () => {
    it("应该注册所有 18 个注入器", () => {
      const allInjectors = manager.getAllInjectors();
      expect(allInjectors.length).toBe(18);
    });

    it("应该包含所有层级的注入器", () => {
      const allInjectors = manager.getAllInjectors();
      const names = allInjectors.map((inj) => inj.name);

      // 语言层 (1个)
      expect(names).toContain("typescript");

      // 框架层 (2个)
      expect(names).toContain("vue3");
      expect(names).toContain("react");

      // 构建层 (2个)
      expect(names).toContain("vite");
      expect(names).toContain("webpack");

      // 样式层 (3个)
      expect(names).toContain("tailwind");
      expect(names).toContain("sass");
      expect(names).toContain("less");

      // UI库层 (3个)
      expect(names).toContain("element-plus");
      expect(names).toContain("antd");
      expect(names).toContain("vuetify");

      // 代码质量层 (2个)
      expect(names).toContain("eslint");
      expect(names).toContain("prettier");

      // 测试层 (2个)
      expect(names).toContain("jest");
      expect(names).toContain("vitest");

      // Git工具层 (3个)
      expect(names).toContain("husky");
      expect(names).toContain("commitlint");
      expect(names).toContain("lint-staged");
    });
  });

  describe("完整项目生成测试", () => {
    it("应该生成 Vue3 + Vite + TypeScript + Tailwind + Element Plus 项目", async () => {
      const context: UnifiedInjectionContext = {
        projectName: "vue3-full-project",
        projectPath: "/test",
        files: {},
        packageJson: { name: "vue3-full-project" },
        tools: [
          "vue3",
          "vite",
          "typescript",
          "tailwind",
          "element-plus",
          "eslint",
          "prettier",
        ],
        framework: "vue3",
        buildTool: "vite",
        language: "typescript",
        logs: [],
      };

      const result = await manager.injectAll(context);

      expect(result.success).toBe(true);

      // 验证生成的文件
      expect(result.files["tsconfig.json"]).toBeDefined();
      expect(result.files["src/main.ts"]).toBeDefined();
      expect(result.files["src/App.vue"]).toBeDefined();
      expect(result.files["index.html"]).toBeDefined();
      expect(result.files["vite.config.ts"]).toBeDefined();
      expect(result.files["tailwind.config.js"]).toBeDefined();
      expect(result.files[".eslintrc.json"]).toBeDefined();
      expect(result.files[".prettierrc"]).toBeDefined();

      // 验证依赖
      expect(result.packageJson.dependencies?.vue).toBeDefined();
      expect(result.packageJson.dependencies?.["element-plus"]).toBeDefined();
      expect(result.packageJson.devDependencies?.typescript).toBeDefined();
      expect(result.packageJson.devDependencies?.vite).toBeDefined();
      expect(result.packageJson.devDependencies?.tailwindcss).toBeDefined();
      expect(result.packageJson.devDependencies?.eslint).toBeDefined();
      expect(result.packageJson.devDependencies?.prettier).toBeDefined();
    });

    it("应该生成 React + Webpack + TypeScript 项目", async () => {
      const context: UnifiedInjectionContext = {
        projectName: "react-webpack-project",
        projectPath: "/test",
        files: {},
        packageJson: { name: "react-webpack-project" },
        tools: ["react", "webpack", "typescript", "antd"],
        framework: "react",
        buildTool: "webpack",
        language: "typescript",
        logs: [],
      };

      const result = await manager.injectAll(context);

      expect(result.success).toBe(true);

      // 验证生成的文件
      expect(result.files["tsconfig.json"]).toBeDefined();
      expect(result.files["src/main.tsx"]).toBeDefined();
      expect(result.files["src/App.tsx"]).toBeDefined();
      expect(result.files["webpack.config.js"]).toBeDefined();

      // 验证依赖
      expect(result.packageJson.dependencies?.react).toBeDefined();
      expect(result.packageJson.dependencies?.["react-dom"]).toBeDefined();
      expect(result.packageJson.dependencies?.antd).toBeDefined();
      expect(result.packageJson.devDependencies?.typescript).toBeDefined();
      expect(result.packageJson.devDependencies?.webpack).toBeDefined();
    });
  });

  describe("优先级排序验证", () => {
    it("应该按正确顺序执行注入器", async () => {
      const context: UnifiedInjectionContext = {
        projectName: "priority-test",
        projectPath: "/test",
        files: {},
        packageJson: { name: "priority-test" },
        tools: [
          "typescript",
          "vue3",
          "vite",
          "tailwind",
          "element-plus",
          "eslint",
          "jest",
          "husky",
        ],
        framework: "vue3",
        buildTool: "vite",
        language: "typescript",
        logs: [],
      };

      const result = await manager.injectAll(context);

      expect(result.success).toBe(true);

      // 从日志中验证执行顺序
      const logs = result.logs.join("\n");

      // TypeScript (10) 应该在 Vue3 (20) 之前
      const tsIndex = logs.indexOf("typescript");
      const vue3Index = logs.indexOf("vue3");
      expect(tsIndex).toBeLessThan(vue3Index);

      // Vue3 (20) 应该在 Vite (30) 之前
      const viteIndex = logs.indexOf("vite");
      expect(vue3Index).toBeLessThan(viteIndex);

      // Vite (30) 应该在 Tailwind (40) 之前
      const tailwindIndex = logs.indexOf("tailwind");
      expect(viteIndex).toBeLessThan(tailwindIndex);

      // Tailwind (40) 应该在 Element Plus (50) 之前
      const epIndex = logs.indexOf("element-plus");
      expect(tailwindIndex).toBeLessThan(epIndex);

      // Element Plus (50) 应该在 ESLint (60) 之前
      const eslintIndex = logs.indexOf("eslint");
      expect(epIndex).toBeLessThan(eslintIndex);

      // ESLint (60) 应该在 Jest (70) 之前
      const jestIndex = logs.indexOf("jest");
      expect(eslintIndex).toBeLessThan(jestIndex);

      // Jest (70) 应该在 Husky (80) 之前
      const huskyIndex = logs.indexOf("husky");
      expect(jestIndex).toBeLessThan(huskyIndex);
    });
  });

  describe("依赖关系验证", () => {
    it("Vitest 应该依赖 Vite", () => {
      const allInjectors = manager.getAllInjectors();
      const vitestInjector = allInjectors.find((inj) => inj.name === "vitest");

      expect(vitestInjector?.dependencies).toContain("vite");
    });

    it("Commitlint 应该依赖 Husky", () => {
      const allInjectors = manager.getAllInjectors();
      const commitlintInjector = allInjectors.find(
        (inj) => inj.name === "commitlint"
      );

      expect(commitlintInjector?.dependencies).toContain("husky");
    });

    it("Lint-staged 应该依赖 Husky", () => {
      const allInjectors = manager.getAllInjectors();
      const lintStagedInjector = allInjectors.find(
        (inj) => inj.name === "lint-staged"
      );

      expect(lintStagedInjector?.dependencies).toContain("husky");
    });
  });

  describe("Git 工具链集成测试", () => {
    it("应该正确配置 Husky + Commitlint + Lint-staged", async () => {
      const context: UnifiedInjectionContext = {
        projectName: "git-tools-test",
        projectPath: "/test",
        files: {},
        packageJson: { name: "git-tools-test" },
        tools: [
          "vue3",
          "vite",
          "eslint",
          "prettier",
          "husky",
          "commitlint",
          "lint-staged",
        ],
        framework: "vue3",
        buildTool: "vite",
        logs: [],
      };

      const result = await manager.injectAll(context);

      expect(result.success).toBe(true);

      // 验证 Husky 文件
      expect(result.files[".husky/pre-commit"]).toBeDefined();
      expect(result.files[".husky/commit-msg"]).toBeDefined();

      // 验证 Commitlint 配置
      expect(result.files["commitlint.config.js"]).toBeDefined();

      // 验证 Lint-staged 配置
      expect(result.packageJson["lint-staged"]).toBeDefined();

      // 验证依赖
      expect(result.packageJson.devDependencies?.husky).toBeDefined();
      expect(
        result.packageJson.devDependencies?.["@commitlint/cli"]
      ).toBeDefined();
      expect(result.packageJson.devDependencies?.["lint-staged"]).toBeDefined();
    });
  });
});
