import type { ToolInjector } from "./ToolInjector";

/**
 * TailwindCSS 工具注入器
 */
export class TailwindCSSInjector implements ToolInjector {
  name = "tailwindcss";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    // 确保 devDependencies 存在
    if (!updatedPackageJson.devDependencies) {
      updatedPackageJson.devDependencies = {};
    }

    console.log(`   - 添加 Tailwind CSS`);
    updatedPackageJson.devDependencies["tailwindcss"] = "^3.0.0";
    updatedPackageJson.devDependencies["autoprefixer"] = "^10.0.0";
    updatedPackageJson.devDependencies["postcss"] = "^8.0.0";

    // 添加 Tailwind 配置文件
    updatedFiles["tailwind.config.js"] =
      `/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,vue}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`;

    updatedFiles["postcss.config.js"] = `module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`;

    // 添加 Tailwind CSS 基础样式
    updatedFiles["src/styles/tailwind.css"] = `@tailwind base;
@tailwind components;
@tailwind utilities;`;

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
