import { ToolInjectorManager } from "../../core/injectors/ToolInjectorManager";
import type { ToolInjector } from "../../core/injectors/ToolInjector";

describe("ToolInjectorManager", () => {
  let injectorManager: ToolInjectorManager;

  beforeEach(() => {
    injectorManager = new ToolInjectorManager();
  });

  it("should inject ESLint tool correctly", () => {
    const files: Record<string, string> = {};
    const packageJson: any = {
      devDependencies: {},
      scripts: {},
    };

    const result = injectorManager.injectTools(files, packageJson, ["eslint"]);

    // 验证 package.json 更新
    expect(result.packageJson.devDependencies.eslint).toBe("^8.0.0");
    expect(
      result.packageJson.devDependencies["@typescript-eslint/eslint-plugin"]
    ).toBe("^6.0.0");
    expect(
      result.packageJson.devDependencies["@typescript-eslint/parser"]
    ).toBe("^6.0.0");
    expect(result.packageJson.scripts.lint).toBe(
      "eslint . --ext .ts,.tsx,.js,.jsx"
    );
    expect(result.packageJson.scripts["lint:fix"]).toBe(
      "eslint . --ext .ts,.tsx,.js,.jsx --fix"
    );

    // 验证文件创建
    expect(result.files[".eslintrc.json"]).toBeDefined();
    expect(result.files[".eslintrc.json"]).toContain("eslint:recommended");
  });

  it("should inject multiple tools correctly", () => {
    const files: Record<string, string> = {};
    const packageJson: any = {
      devDependencies: {},
      scripts: {},
    };

    const result = injectorManager.injectTools(files, packageJson, [
      "eslint",
      "prettier",
    ]);

    // 验证 ESLint 注入
    expect(result.packageJson.devDependencies.eslint).toBe("^8.0.0");
    expect(result.files[".eslintrc.json"]).toBeDefined();

    // 验证 Prettier 注入
    expect(result.packageJson.devDependencies.prettier).toBe("^3.0.0");
    expect(result.packageJson.scripts.format).toBe("prettier --write .");
    expect(result.files[".prettierrc"]).toBeDefined();
    expect(result.files[".prettierignore"]).toBeDefined();
  });

  it("should handle unknown tools gracefully", () => {
    const files: Record<string, string> = {};
    const packageJson: any = {
      devDependencies: {},
      scripts: {},
    };

    const result = injectorManager.injectTools(files, packageJson, [
      "unknown-tool",
    ]);

    // 应该不修改输入
    expect(result.files).toEqual(files);
    expect(result.packageJson).toEqual(packageJson);
  });

  it("should handle empty tool list", () => {
    const files: Record<string, string> = {};
    const packageJson: any = {
      devDependencies: {},
      scripts: {},
    };

    const result = injectorManager.injectTools(files, packageJson, []);

    // 应该不修改输入
    expect(result.files).toEqual(files);
    expect(result.packageJson).toEqual(packageJson);
  });

  it("should get available tools list", () => {
    const tools = injectorManager.getAvailableTools();
    expect(tools).toContain("eslint");
    expect(tools).toContain("prettier");
    expect(tools).toContain("jest");
    expect(tools).toContain("husky");
    expect(tools).toContain("commitlint");
    expect(tools).toContain("tailwindcss");
  });

  it("should allow registering custom tool injectors", () => {
    const customInjector: ToolInjector = {
      name: "custom-tool",
      inject: (files, packageJson) => {
        const updatedFiles = { ...files, "custom.txt": "custom content" };
        const updatedPackageJson = {
          ...packageJson,
          devDependencies: {
            ...packageJson.devDependencies,
            "custom-dependency": "^1.0.0",
          },
        };
        return { files: updatedFiles, packageJson: updatedPackageJson };
      },
    };

    injectorManager.register(customInjector);

    const files: Record<string, string> = {};
    const packageJson: any = { devDependencies: {} };

    const result = injectorManager.injectTools(files, packageJson, [
      "custom-tool",
    ]);

    expect(result.files["custom.txt"]).toBe("custom content");
    expect(result.packageJson.devDependencies["custom-dependency"]).toBe(
      "^1.0.0"
    );
  });
});
