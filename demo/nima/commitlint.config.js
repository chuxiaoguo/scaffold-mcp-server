export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      [
        "feat", // 新功能
        "fix", // 修复
        "docs", // 文档变更
        "style", // 代码格式
        "refactor", // 重构
        "perf", // 性能优化
        "test", // 测试
        "chore", // 构建过程或辅助工具的变动
        "ci", // CI配置
        "build", // 构建系统
        "revert", // 回滚
      ],
    ],
    "subject-case": [0], // 允许任意大小写
    "subject-max-length": [2, "always", 100],
  },
};
