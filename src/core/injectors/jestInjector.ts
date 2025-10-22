import type { ToolInjector } from "./ToolInjector";

/**
 * Jest 工具注入器
 */
export class JestInjector implements ToolInjector {
  name = "jest";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    // 确保 devDependencies 存在
    if (!updatedPackageJson.devDependencies) {
      updatedPackageJson.devDependencies = {};
    }

    // 确保 scripts 存在
    if (!updatedPackageJson.scripts) {
      updatedPackageJson.scripts = {};
    }

    console.log(`   - 添加 Jest 测试框架`);
    updatedPackageJson.devDependencies["jest"] = "^29.0.0";
    updatedPackageJson.devDependencies["@types/jest"] = "^29.0.0";
    updatedPackageJson.devDependencies["ts-jest"] = "^29.0.0";
    updatedPackageJson.scripts["test"] = "jest";
    updatedPackageJson.scripts["test:watch"] = "jest --watch";
    updatedPackageJson.scripts["test:coverage"] = "jest --coverage";

    // 添加 Jest 配置文件
    updatedFiles["jest.config.js"] = `module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
  ],
};`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
