import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist', 'build'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    },
    // 完全禁用UI和网络相关功能
    ui: false,
    open: false,
    watch: false,
    reporters: ['basic']
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});