import { validateProjectPath } from "../tools/pathResolver";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

describe("validateProjectPath with autoCreateDir", () => {
  const testDir = path.join(os.tmpdir(), "scaffold-test-auto-create");
  const nonExistentDir = path.join(testDir, "non-existent-dir");
  const projectPath = path.join(nonExistentDir, "test-project");

  beforeEach(() => {
    // 确保测试目录干净
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  afterEach(() => {
    // 清理测试目录
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  it("should automatically create parent directory when autoCreateDir is true", () => {
    // 确保父目录不存在
    expect(fs.existsSync(nonExistentDir)).toBe(false);

    // 验证路径，启用自动创建目录
    const result = validateProjectPath(projectPath, false, true);

    // 验证应该通过
    expect(result.valid).toBe(true);
    
    // 验证父目录应该已经被创建
    expect(fs.existsSync(nonExistentDir)).toBe(true);
    expect(fs.statSync(nonExistentDir).isDirectory()).toBe(true);
  });

  it("should not automatically create parent directory when autoCreateDir is false", () => {
    // 确保父目录不存在
    expect(fs.existsSync(nonExistentDir)).toBe(false);

    // 验证路径，禁用自动创建目录
    const result = validateProjectPath(projectPath, false, false);

    // 验证应该失败
    expect(result.valid).toBe(false);
    expect(result.message).toContain("父目录");
    
    // 验证父目录应该仍然不存在
    expect(fs.existsSync(nonExistentDir)).toBe(false);
  });

  it("should work normally when parent directory exists", () => {
    // 手动创建父目录
    fs.mkdirSync(nonExistentDir, { recursive: true });
    expect(fs.existsSync(nonExistentDir)).toBe(true);

    // 验证路径，启用自动创建目录
    const result = validateProjectPath(projectPath, false, true);

    // 验证应该通过
    expect(result.valid).toBe(true);
  });
});