# WyanDesk 扩展商店提交指南

本文档是 Chrome Web Store 和 Microsoft Edge Add-ons 的可复用提交材料。实际上架需要对应商店的开发者账号，不在代码构建和自动化范围内。

## 商店文案

- 名称：微言桌面 WyanDesk
- 简短说明：把微言桌面设为新标签页，快速收藏网页、生成任务/便签，并保存可恢复的窗口会话。
- 详细说明：WyanDesk 是本地优先的浏览器桌面，集中管理常用网站、任务、日程、便签和专注计时。扩展可将当前页存为网站、任务或便签，也可在用户授权后保存/恢复当前窗口以及导入/导出书签。未登录也能完整使用，数据默认留在浏览器。
- 分类：Productivity（生产力）
- 官网：`https://desk.wyanhub.com/`
- 隐私说明：发布 `docs/PRIVACY.md` 的站点版本，提交时填写可公开访问的 HTTPS URL。

## 权限解释

| 权限 | 类型 | 用途与触发时机 |
| --- | --- | --- |
| `storage` | 必需 | 在扩展本地保存桌面状态摘要、待处理收藏和最多 20 个窗口会话。 |
| `activeTab` | 必需 | 仅在用户点击“收藏当前网页/保存为任务/便签”时读取当前页标题和 URL。 |
| `tabs` | 可选 | 仅在用户保存或恢复当前窗口时申请，读写标题、URL、顺序和固定状态。 |
| `bookmarks` | 可选 | 仅在用户选择直接导入或导出浏览器书签时申请。 |

扩展不声明主机权限、内容脚本或常驻后台服务，不执行远程代码。

## 审核测试路径

1. 安装后打开新标签页，确认 WyanDesk 可在未登录状态使用。
2. 打开任意 HTTPS 页面，点击扩展，分别将页面保存为网站、任务和便签；回到新标签页验证内容。
3. 点击“保存当前窗口”，同意可选 `tabs` 权限，关闭测试窗口后在扩展中恢复。
4. 点击导入或导出书签，验证只在该操作中请求可选 `bookmarks` 权限。
5. 拒绝任一可选权限，验证应用显示错误提示且本地桌面仍然可用。

## 打包与提交前检查

```bash
npm ci
npm test
npm run typecheck
npm run package:extension
unzip -t public/downloads/wyandesk-extension.zip
(cd public/downloads && shasum -a 256 -c wyandesk-extension.zip.sha256)
```

`package:extension` 会校验 Manifest V3、版本号、权限白名单、禁止主机/内容脚本权限，并检查 HTML 未引用远程脚本。最终产物为：

- `public/downloads/wyandesk-extension.zip`
- `public/downloads/wyandesk-extension.zip.sha256`

提交前还需人工确认：开发者账号、可公开隐私 URL、商店当前要求的截图、图标/宣传图、版本更新说明和联系邮箱。本仓库不保存商店密码或付款信息。
