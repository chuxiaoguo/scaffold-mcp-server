import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 自定义插件：在构建完成后复制资源文件
const copyAssets = {
  name: "copy-assets",
  writeBundle() {
    try {
      // 使用 rsync 复制目录，排除 node_modules
      execSync("rsync -av configs dist/ --delete", { cwd: __dirname });
      execSync(
        "rsync -av scaffold-template dist/ --delete --exclude=node_modules",
        { cwd: __dirname }
      );
      console.log("✓ 资源文件复制完成");
    } catch (error) {
      console.error("✗ 资源文件复制失败:", error.message);
    }
  },
};

export default {
  input: "src/index.ts",
  output: {
    file: "dist/index.js",
    format: "es",
    banner: "#!/usr/bin/env node",
    inlineDynamicImports: true,
  },
  external: [
    "fs",
    "fs/promises",
    "path",
    "url",
    "crypto",
    "http",
    "https",
    "child_process",
    "stream",
    "util",
    "os",
    "events",
  ],
  plugins: [
    resolve({ preferBuiltins: true }),
    commonjs(),
    json(),
    typescript({
      tsconfig: "./tsconfig.json",
      declaration: false,
    }),
    copyAssets,
  ],
};
