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

    // 检测项目类型
    const isWebpackProject = updatedPackageJson.devDependencies?.["webpack"] || 
                            updatedPackageJson.devDependencies?.["webpack-cli"] ||
                            files["webpack.config.js"];

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

    // 如果是webpack项目，添加postcss-loader
    if (isWebpackProject) {
      console.log(`   - 为webpack项目添加postcss-loader`);
      updatedPackageJson.devDependencies["postcss-loader"] = "^7.0.0";
      
      // 如果存在webpack.config.js，修改它以支持PostCSS
      if (updatedFiles["webpack.config.js"]) {
        let webpackConfig = updatedFiles["webpack.config.js"];
        
        // 在CSS规则中添加postcss-loader
        webpackConfig = webpackConfig.replace(
          /use: \['vue-style-loader', 'css-loader'\]/,
          "use: ['vue-style-loader', 'css-loader', 'postcss-loader']"
        );
        
        updatedFiles["webpack.config.js"] = webpackConfig;
      }
    }

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}
