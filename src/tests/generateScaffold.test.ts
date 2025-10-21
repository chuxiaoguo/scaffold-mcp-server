import { generateScaffold } from "../tools/generateScaffold";
import type { GenerateScaffoldParams } from "../types/index";

describe("generateScaffold", () => {
  it("should generate a basic Vue3 + Vite + TypeScript project", async () => {
    const params: GenerateScaffoldParams = {
      tech_stack: "vue3+vite+typescript",
      project_name: "test-vue3-project",
      output_dir: "/tmp",
      options: {
        dryRun: true, // 只预览不实际生成文件
      },
    };

    const result = await generateScaffold(params);

    expect(result.projectName).toBe("test-vue3-project");
    expect(result.templateSource).toContain("智能匹配模板");
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.processLogs).toBeDefined();
  });

  it("should generate a basic React + Webpack + TypeScript project", async () => {
    const params: GenerateScaffoldParams = {
      tech_stack: "react+webpack+typescript",
      project_name: "test-react-project",
      output_dir: "/tmp",
      options: {
        dryRun: true, // 只预览不实际生成文件
      },
    };

    const result = await generateScaffold(params);

    expect(result.projectName).toBe("test-react-project");
    expect(result.templateSource).toContain("智能匹配模板");
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.processLogs).toBeDefined();
  });

  it("should handle invalid tech stack gracefully", async () => {
    const params: GenerateScaffoldParams = {
      tech_stack: "invalid-tech-stack",
      project_name: "test-invalid-project",
      output_dir: "/tmp",
      options: {
        dryRun: true, // 只预览不实际生成文件
      },
    };

    const result = await generateScaffold(params);

    expect(result.projectName).toBe("test-invalid-project");
    // 应该回退到默认模板
    expect(result.templateSource).toContain("智能匹配模板");
    expect(result.files.length).toBeGreaterThan(0);
    expect(result.processLogs).toBeDefined();
  });
});
