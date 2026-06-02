## 语言与注释规范

- 项目内容默认使用中文表达，必要时保留英文技术术语、API 名称、项目名称及关键信息原文。
- 重要或核心函数必须添加中文注释，注释应简洁说明其核心作用，避免冗余描述。
- AI API 返回内容应以中文呈现，同时保留必要的英文原文信息，确保技术含义准确。

## Codex 构建命令注意事项

- 在 Codex 沙箱中运行 `npm run build` 可能会因 Next.js build worker 使用 `child_process.fork()` 触发 `spawn EPERM` 并卡住。
- Codex 需要验证生产构建时，应使用提升权限运行 `npm run build`。
- 不要在默认沙箱中直接长时间等待 `npm run build`。
