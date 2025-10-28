import { generateFromNonFixedTemplate } from "../tools/dynamicGenerator.js";
import { UnifiedProjectGenerator } from "../core/UnifiedProjectGenerator.js";
import { TechStack } from "../types/index.js";

describe("Phase 3 & 4: 动态生成器重构与集成测试", () => {
  describe("Phase 3: 动态生成器重构", () => {
    it("应该使用统一注入系统生成 Vue3 + Vite + TypeScript 项目", async () => {
      const techStack: TechStack = {
        framework: "vue3",
        builder: "vite",
        language: "typescript",
      };

      const result = await generateFromNonFixedTemplate(
        techStack,
        "test-vue3-project",
        [],
        []
      );

      // 验证生成的文件
      expect(result.files["tsconfig.json"]).toBeDefined();
      expect(result.files["src/main.ts"]).toBeDefined();
      expect(result.files["src/App.vue"]).toBeDefined();
      expect(result.files["index.html"]).toBeDefined();
      expect(result.files["vite.config.ts"]).toBeDefined();

      // 验证 package.json
      expect(result.packageJson.name).toBe("test-vue3-project");
      expect(result.packageJson.dependencies?.vue).toBeDefined();
      expect(result.packageJson.devDependencies?.typescript).toBeDefined();
      expect(result.packageJson.devDependencies?.vite).toBeDefined();
    });

    it("应该支持额外工具注入", async () => {
      const techStack: TechStack = {
        framework: "react",
        builder: "vite",
        language: "typescript",
      };

      const extraTools = ["eslint", "prettier", "tailwind"];

      const result = await generateFromNonFixedTemplate(
        techStack,
        "test-react-with-tools",
        extraTools,
        []
      );

      // 验证核心文件
      expect(result.files["tsconfig.json"]).toBeDefined();
      expect(result.files["src/main.tsx"]).toBeDefined();
      expect(result.files["vite.config.ts"]).toBeDefined();

      // 验证额外工具文件
      expect(result.files[".eslintrc.json"]).toBeDefined();
      expect(result.files[".prettierrc"]).toBeDefined();
      expect(result.files["tailwind.config.js"]).toBeDefined();

      // 验证依赖
      expect(result.packageJson.devDependencies?.eslint).toBeDefined();
      expect(result.packageJson.devDependencies?.prettier).toBeDefined();
      expect(result.packageJson.devDependencies?.tailwindcss).toBeDefined();
    });

    it("应该正确解析技术栈为工具集", async () => {
      const techStack: TechStack = {
        framework: "vue3",
        builder: "vite",
        language: "typescript",
        style: "tailwindcss",
        ui: "element-plus",
      };

      const result = await generateFromNonFixedTemplate(
        techStack,
        "test-full-stack",
        [],
        []
      );

      // 验证所有工具都被正确注入
      expect(result.files["tsconfig.json"]).toBeDefined(); // typescript
      expect(result.files["src/main.ts"]).toBeDefined(); // vue3
      expect(result.files["vite.config.ts"]).toBeDefined(); // vite
      expect(result.files["tailwind.config.js"]).toBeDefined(); // tailwind
      expect(result.packageJson.dependencies?.["element-plus"]).toBeDefined(); // element-plus
    });
  });

  describe("Phase 4: UnifiedProjectGenerator 集成", () => {
    let generator: UnifiedProjectGenerator;

    beforeEach(() => {
      generator = new UnifiedProjectGenerator();
    });

    it("应该不再使用旧的 ToolInjectorManager 和 CoreInjectorManager", () => {
      // 验证新的 generator 不包含旧的管理器
      expect(generator["toolInjectorManager"]).toBeUndefined();
      expect(generator["coreInjectorManager"]).toBeUndefined();
    });
  });

  describe("集成测试", () => {
    it("应该从头到尾使用统一注入系统", async () => {
      const techStack: TechStack = {
        framework: "vue3",
        builder: "vite",
        language: "typescript",
        style: "tailwindcss",
        ui: "element-plus",
      };

      const extraTools = ["eslint", "prettier", "jest", "husky", "commitlint"];

      const result = await generateFromNonFixedTemplate(
        techStack,
        "test-full-integration",
        extraTools,
        []
      );

      // 验证所有层级的工具都被正确注入
      expect(result.files["tsconfig.json"]).toBeDefined(); // 语言层
      expect(result.files["src/main.ts"]).toBeDefined(); // 框架层
      expect(result.files["vite.config.ts"]).toBeDefined(); // 构建层
      expect(result.files["tailwind.config.js"]).toBeDefined(); // 样式层
      expect(result.packageJson.dependencies?.["element-plus"]).toBeDefined(); // UI库层
      expect(result.files[".eslintrc.json"]).toBeDefined(); // 代码质量层
      expect(result.files["jest.config.ts"]).toBeDefined(); // 测试层
      expect(result.files[".husky/pre-commit"]).toBeDefined(); // Git工具层

      // 验证执行顺序（通过检查文件是否存在）
      expect(Object.keys(result.files).length).toBeGreaterThan(10);
    });
  });
});
