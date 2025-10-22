import { ToolInjectorManager } from "../../core/injectors/ToolInjectorManager";

// 简单测试，不依赖其他模块
describe("ToolInjectorManager Simple Test", () => {
  it("should create ToolInjectorManager instance", () => {
    const manager = new ToolInjectorManager();
    expect(manager).toBeDefined();
  });

  it("should get available tools", () => {
    const manager = new ToolInjectorManager();
    const tools = manager.getAvailableTools();
    expect(tools.length).toBeGreaterThan(0);
    expect(tools).toContain("eslint");
    expect(tools).toContain("prettier");
  });
});
