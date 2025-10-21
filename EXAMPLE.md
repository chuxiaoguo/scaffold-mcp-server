# 自动创建目录功能示例

## 功能说明

在 scaffold-mcp-server v1.1.17 版本中，我们添加了一个新功能：当用户指定的输出目录不存在时，系统会自动递归创建该目录，而不是报错。

这个功能默认是开启的（autoCreateDir: true）。

## 使用示例

### 1. 通过 API 调用

```json
{
  "tech_stack": "vue3+vite",
  "project_name": "my-app",
  "output_dir": "./non/existent/directory",
  "options": {
    "autoCreateDir": true
  }
}
```

在这个例子中，即使 `./non/existent/directory` 路径不存在，系统也会自动创建完整的目录结构，然后在该目录下生成项目。

### 2. 禁用自动创建目录

如果你不希望自动创建目录，可以将 `autoCreateDir` 设置为 `false`：

```json
{
  "tech_stack": "vue3+vite",
  "project_name": "my-app",
  "output_dir": "./non/existent/directory",
  "options": {
    "autoCreateDir": false
  }
}
```

在这种情况下，如果目录不存在，系统会返回错误信息，提示用户手动创建目录。

## 错误处理

当自动创建目录失败时（例如由于权限问题），系统会返回详细的错误信息和建议：

```json
{
  "valid": false,
  "message": "自动创建父目录 /path/to/dir 失败: EACCES: permission denied",
  "suggestions": [
    "检查目录权限",
    "使用管理员权限运行",
    "手动创建父目录"
  ]
}
```

## 技术实现

该功能在 `src/tools/pathResolver.ts` 文件中的 `validateProjectPath` 函数中实现：

```typescript
// 如果启用了自动创建目录功能，则尝试创建父目录
if (autoCreateDir) {
  try {
    // 使用递归方式创建目录
    fs.mkdirSync(parentDir, { recursive: true });
    console.log(`✅ 自动创建目录: ${parentDir}`);
    return { valid: true };
  } catch (error: any) {
    return {
      valid: false,
      message: `自动创建父目录 ${parentDir} 失败: ${error.message}`,
      suggestions: [
        '检查目录权限',
        '使用管理员权限运行',
        '手动创建父目录'
      ]
    };
  }
}
```

这个实现确保了用户友好的体验，同时提供了清晰的错误信息和解决建议。