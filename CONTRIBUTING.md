# Contributing to WyanDesk

感谢你愿意帮助改进 WyanDesk。

## 开始之前

- 功能建议和问题请先搜索现有 Issues，避免重复。
- 涉及安全或隐私的问题不要创建公开 Issue，请按 [安全策略](SECURITY.md) 私下报告。
- 截图、导出文件和日志中请移除网址、账号、便签和任务等个人信息。

## 本地开发

需要 Node.js `^20.19.0` 或 `>=22.12.0`。

```bash
npm ci
npm run dev
```

提交 Pull Request 前请执行：

```bash
npm test
npm run typecheck
npm run build
```

## 提交原则

- 一个 Pull Request 尽量只解决一个问题。
- 新增行为时补充对应测试；视觉变化请附前后截图。
- 不提交构建目录、依赖目录、账号数据、`.env` 或任何密钥。
- 保持本地优先、按需出现、可撤销和无障碍操作这些产品原则。
