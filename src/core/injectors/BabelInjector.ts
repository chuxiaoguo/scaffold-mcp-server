import type { ToolInjector } from "./ToolInjector";

/**
 * Babel 工具注入器
 */
export class BabelInjector implements ToolInjector {
  name = "babel";

  inject(files: Record<string, string>, packageJson: any) {
    const updatedFiles = { ...files };
    const updatedPackageJson = { ...packageJson };

    // 确保 devDependencies 存在
    if (!updatedPackageJson.devDependencies) {
      updatedPackageJson.devDependencies = {};
    }

    console.log(`   - 添加 Babel 配置`);

    // 添加 Babel 依赖
    updatedPackageJson.devDependencies["@babel/core"] = "^7.0.0";
    updatedPackageJson.devDependencies["@babel/preset-env"] = "^7.0.0";
    updatedPackageJson.devDependencies["babel-loader"] = "^9.0.0";

    // 检测项目类型
    const isVueProject = updatedPackageJson.dependencies?.["vue"] || 
                        files["src/App.vue"];
    const isReactProject = updatedPackageJson.dependencies?.["react"] || 
                          files["src/App.jsx"] || files["src/App.tsx"];

    // 根据项目类型添加相应的预设
    if (isVueProject) {
      // Vue项目通常不需要额外的Babel预设，vue-loader会处理
      console.log(`   - 检测到Vue项目，使用基础Babel配置`);
    } else if (isReactProject) {
      console.log(`   - 检测到React项目，添加React预设`);
      updatedPackageJson.devDependencies["@babel/preset-react"] = "^7.0.0";
    }

    // 添加 .babelrc 配置文件
    const presets = ["@babel/preset-env"];
    if (isReactProject) {
      presets.push("@babel/preset-react");
    }

    updatedFiles[".babelrc"] = JSON.stringify({
      presets: presets,
      plugins: []
    }, null, 2);

    return { files: updatedFiles, packageJson: updatedPackageJson };
  }
}