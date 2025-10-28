import { AbstractUnifiedInjector } from "../AbstractUnifiedInjector.js";
import {
  InjectorCategory,
  InjectorPriority,
  UnifiedInjectionContext,
  UnifiedInjectionResult,
} from "../../../../types/index.js";

/**
 * Redux (Redux Toolkit) 状态管理注入器
 * 优先级: 55 (在 UI 库之后，代码质量之前)
 */
export class ReduxInjector extends AbstractUnifiedInjector {
  name = "redux";
  priority = 55;
  category = InjectorCategory.FRAMEWORK;

  override canHandle(tools: string[]): boolean {
    return tools.some(
      (tool) =>
        tool.toLowerCase() === "redux" || tool.toLowerCase() === "redux-toolkit"
    );
  }

  override async inject(
    context: UnifiedInjectionContext
  ): Promise<UnifiedInjectionResult> {
    const { files, packageJson, logs, framework, language } = context;

    try {
      this.addLog(logs, "开始注入 Redux Toolkit");

      // 只支持 React
      if (framework?.toLowerCase() !== "react") {
        this.addLog(logs, "⚠️  Redux 仅支持 React 项目，跳过注入");
        return {
          files,
          packageJson,
          logs,
          success: true,
        };
      }

      const isTypeScript =
        language === "typescript" ||
        context.tools.some((t) => t.toLowerCase() === "typescript");

      // 1. 添加依赖
      this.mergeDependencies(packageJson, {
        "@reduxjs/toolkit": "^2.0.1",
        "react-redux": "^9.0.4",
      });

      // 2. 创建 store 配置
      const ext = isTypeScript ? "ts" : "js";
      files[`src/store/index.${ext}`] = this.generateStoreConfig(isTypeScript);

      // 3. 创建示例 slice
      files[`src/store/counterSlice.${ext}`] =
        this.generateCounterSlice(isTypeScript);

      // 4. 创建 hooks (TypeScript only)
      if (isTypeScript) {
        files[`src/store/hooks.ts`] = this.generateHooks();
      }

      // 5. 修改 main.tsx/jsx
      const mainFile = isTypeScript ? "src/main.tsx" : "src/main.jsx";
      if (files[mainFile]) {
        files[mainFile] = this.injectProviderToMain(
          files[mainFile],
          isTypeScript
        );
        this.addLog(logs, `更新 ${mainFile}，添加 Redux Provider`);
      }

      this.addLog(logs, "✅ Redux Toolkit 注入完成");
      this.addLog(logs, "  - 已添加 @reduxjs/toolkit 和 react-redux");
      this.addLog(logs, "  - 已创建 store 配置");
      this.addLog(logs, "  - 已创建示例 counter slice");
      if (isTypeScript) {
        this.addLog(logs, "  - 已创建类型化 hooks");
      }

      return {
        files,
        packageJson,
        logs,
        success: true,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.addLog(logs, `❌ Redux 注入失败: ${errorMsg}`);
      return {
        files,
        packageJson,
        logs,
        success: false,
        errors: [errorMsg],
      };
    }
  }

  /**
   * 生成 store 配置
   */
  private generateStoreConfig(isTypeScript: boolean): string {
    if (isTypeScript) {
      return `import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})

// 导出类型
export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
`;
    } else {
      return `import { configureStore } from '@reduxjs/toolkit'
import counterReducer from './counterSlice'

export const store = configureStore({
  reducer: {
    counter: counterReducer,
  },
})
`;
    }
  }

  /**
   * 生成 counter slice
   */
  private generateCounterSlice(isTypeScript: boolean): string {
    if (isTypeScript) {
      return `import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface CounterState {
  value: number
}

const initialState: CounterState = {
  value: 0,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action: PayloadAction<number>) => {
      state.value += action.payload
    },
    reset: (state) => {
      state.value = 0
    },
  },
})

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions

export default counterSlice.reducer
`;
    } else {
      return `import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  value: 0,
}

export const counterSlice = createSlice({
  name: 'counter',
  initialState,
  reducers: {
    increment: (state) => {
      state.value += 1
    },
    decrement: (state) => {
      state.value -= 1
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload
    },
    reset: (state) => {
      state.value = 0
    },
  },
})

export const { increment, decrement, incrementByAmount, reset } = counterSlice.actions

export default counterSlice.reducer
`;
    }
  }

  /**
   * 生成类型化 hooks
   */
  private generateHooks(): string {
    return `import { useDispatch, useSelector } from 'react-redux'
import type { RootState, AppDispatch } from './index'

// 使用这些 hooks 而不是普通的 useDispatch 和 useSelector
export const useAppDispatch = useDispatch.withTypes<AppDispatch>()
export const useAppSelector = useSelector.withTypes<RootState>()
`;
  }

  /**
   * 在 main.tsx 中注入 Provider
   */
  private injectProviderToMain(content: string, isTypeScript: boolean): string {
    // 添加 imports
    if (!content.includes("import { Provider }")) {
      const importLine = "import { Provider } from 'react-redux'\n";
      const reactMatch = content.match(/import.*React.*from.*react.*/);
      if (reactMatch) {
        content = content.replace(
          reactMatch[0],
          `${reactMatch[0]}\n${importLine}`
        );
      } else {
        content = importLine + content;
      }
    }

    if (!content.includes("import { store }")) {
      const importLine = "import { store } from './store'\n";
      const reactMatch = content.match(/import.*React.*from.*react.*/);
      if (reactMatch) {
        content = content.replace(
          reactMatch[0],
          `${reactMatch[0]}\n${importLine}`
        );
      }
    }

    // 包装 <App /> 组件
    if (!content.includes("<Provider store={store}>")) {
      const appMatch = content.match(/<App\s*\/>/);
      if (appMatch) {
        content = content.replace(
          appMatch[0],
          `<Provider store={store}>\n    ${appMatch[0]}\n  </Provider>`
        );
      } else {
        // 尝试匹配 <App>...</App>
        const appMatch2 = content.match(/<App>([\s\S]*?)<\/App>/);
        if (appMatch2) {
          content = content.replace(
            appMatch2[0],
            `<Provider store={store}>\n    ${appMatch2[0]}\n  </Provider>`
          );
        }
      }
    }

    return content;
  }
}
