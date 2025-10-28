import { UnifiedInjectorManager } from "../core/injectors/unified/UnifiedInjectorManager.js";
import { TailwindInjector } from "../core/injectors/unified/styling/TailwindInjector.js";
import { SassInjector } from "../core/injectors/unified/styling/SassInjector.js";
import { LessInjector } from "../core/injectors/unified/styling/LessInjector.js";
import { ElementPlusInjector } from "../core/injectors/unified/ui-library/ElementPlusInjector.js";
import { AntdInjector } from "../core/injectors/unified/ui-library/AntdInjector.js";
import { UnifiedInjectionContext } from "../types/index.js";

describe("统一注入器系统测试", () => {
  let manager: UnifiedInjectorManager;

  beforeEach(() => {
    manager = new UnifiedInjectorManager();
  });

  describe("注入器注册", () => {
    it("应该能够注册注入器", () => {
      const tailwindInjector = new TailwindInjector();
      manager.register(tailwindInjector);

      const allInjectors = manager.getAllInjectors();
      expect(allInjectors).toHaveLength(1);
      expect(allInjectors[0].name).toBe("tailwind");
    });

    it("应该能够批量注册注入器", () => {
      const injectors = [
        new TailwindInjector(),
        new SassInjector(),
        new ElementPlusInjector(),
      ];

      manager.registerAll(injectors);

      const allInjectors = manager.getAllInjectors();
      expect(allInjectors).toHaveLength(3);
    });
  });

  describe("注入器选择", () => {
    beforeEach(() => {
      manager.registerAll([
        new TailwindInjector(),
        new SassInjector(),
        new LessInjector(),
        new ElementPlusInjector(),
        new AntdInjector(),
      ]);
    });

    it("应该根据工具集选择正确的样式注入器", async () => {
      const context: UnifiedInjectionContext = {
        projectName: "test-project",
        projectPath: "/test",
        files: {},
        packageJson: { name: "test-project" },
        tools: ["vue3", "vite", "tailwind"],
        framework: "vue3",
        buildTool: "vite",
        logs: [],
      };

      const result = await manager.injectAll(context);

      expect(result.success).toBe(true);
      expect(result.files["tailwind.config.js"]).toBeDefined();
      expect(result.files["postcss.config.js"]).toBeDefined();
      expect(result.packageJson.devDependencies?.tailwindcss).toBeDefined();
    });

    it("应该根据工具集选择正确的UI库注入器", async () => {
      const context: UnifiedInjectionContext = {
        projectName: "test-project",
        projectPath: "/test",
        files: {},
        packageJson: { name: "test-project" },
        tools: ["vue3", "vite", "element-plus"],
        framework: "vue3",
        buildTool: "vite",
        logs: [],
      };

      const result = await manager.injectAll(context);

      expect(result.success).toBe(true);
      expect(result.packageJson.dependencies?.["element-plus"]).toBeDefined();
    });
  });

  describe("优先级排序", () => {
    it("应该按优先级顺序执行注入器", async () => {
      // 样式层 (40) 应该在 UI库层 (50) 之前执行
      manager.registerAll([
        new ElementPlusInjector(), // priority: 50
        new TailwindInjector(), // priority: 40
      ]);

      const context: UnifiedInjectionContext = {
        projectName: "test-project",
        projectPath: "/test",
        files: {},
        packageJson: { name: "test-project" },
        tools: ["vue3", "tailwind", "element-plus"],
        framework: "vue3",
        logs: [],
      };

      const result = await manager.injectAll(context);

      expect(result.success).toBe(true);

      // 验证执行顺序：日志中 tailwind 应该在 element-plus 之前
      const logs = result.logs.join("\n");
      const tailwindIndex = logs.indexOf("tailwind");
      const elementPlusIndex = logs.indexOf("element-plus");

      expect(tailwindIndex).toBeLessThan(elementPlusIndex);
    });
  });

  describe("冲突检测", () => {
    it("应该检测到样式预处理器之间的冲突", async () => {
      manager.registerAll([new SassInjector(), new LessInjector()]);

      const context: UnifiedInjectionContext = {
        projectName: "test-project",
        projectPath: "/test",
        files: {},
        packageJson: { name: "test-project" },
        tools: ["vue3", "sass", "less"], // sass 和 less 冲突
        framework: "vue3",
        logs: [],
      };

      const result = await manager.injectAll(context);

      // 尽管有冲突警告，但仍会执行（由用户决定）
      expect(result.errors).toBeDefined();
      const errorsStr = result.errors?.join(" ") || "";
      expect(errorsStr).toContain("冲突");
    });
  });

  describe("依赖检查", () => {
    it("ElementPlus 应该依赖 Vue3", () => {
      const elementPlusInjector = new ElementPlusInjector();

      expect(elementPlusInjector.dependencies).toContain("vue3");
    });

    it("Antd 应该依赖 React", () => {
      const antdInjector = new AntdInjector();

      expect(antdInjector.dependencies).toContain("react");
    });
  });
});
