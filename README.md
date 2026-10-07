<p align="center">
  <img src="public/pwa-192.png" width="96" height="96" alt="WyanDesk 图标" />
</p>

<h1 align="center">微言桌面 WyanDesk</h1>

<p align="center">把常用网站、任务、日程、便签和专注计时放进一个安静、可定制的浏览器桌面。</p>

<p align="center">
  <a href="https://desk.wyanhub.com"><strong>在线体验</strong></a> ·
  <a href="README.en.md">English</a> ·
  <a href="https://github.com/lxshwyan/WyanDesk/releases">下载扩展</a>
</p>

<p align="center">
  <a href="https://github.com/lxshwyan/WyanDesk/releases"><img alt="GitHub Release" src="https://img.shields.io/github/v/release/lxshwyan/WyanDesk?include_prereleases&style=flat-square" /></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-2563eb?style=flat-square" /></a>
  <img alt="Local first" src="https://img.shields.io/badge/data-local--first-149668?style=flat-square" />
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-7c3aed?style=flat-square" />
</p>

![WyanDesk 桌面总览](docs/images/wyandesk-overview.png)

> 在线站点当前处于域名备案与证书链路逐步生效阶段。如果暂时无法打开，可以按下方步骤在本地运行；本地模式不需要账号和后端服务。

## 为什么做 WyanDesk

浏览器新标签页往往要么只有搜索框，要么塞满信息流。WyanDesk 希望保持另一种节奏：打开页面就能找到常用入口，记下当下的事情，然后继续工作。

- **本地优先**：未登录也能完整使用，网站、任务、便签和设置默认保存在当前浏览器。
- **需要时才出现**：时间事件、日程、提醒和扩展权限都按需启用，不强迫用户配置整套系统。
- **桌面而不是后台**：常用操作集中在首页，分类、组件尺寸和背景可以调整，手机端自动回落为单列。
- **可迁移**：支持浏览器书签、ICS 日历和桌面数据导入导出，登录后可选择跨设备同步。

## 主要功能

| 区域 | 能力 |
| --- | --- |
| 快捷网站 | 分类增删改排、网址拖动排序、重复保护、网站组合、命令搜索、最近使用 |
| 工作桌面 | 工作 / 学习 / 生活多桌面，新建、复制、改名、排序与独立数据 |
| 轻量效率 | 今日任务、长文本详情、日程、工作便签、自定义 1–240 分钟专注计时 |
| 时间与提醒 | 翻页时钟、累计日 / 倒计时 / 周年事件、上班 / 喝水 / 用餐 / 下班提醒 |
| 个性化 | 四套立体环境、自定义背景、减少动效、卡片宽高与主区域比例调整 |
| 隐私锁屏 | 全屏锁屏、可选 PIN、空闲自动锁定与仅保存在本机的活动摘要 |
| 数据迁移 | 书签 HTML、浏览器扩展直连书签、ICS、桌面备份与隐私安全模板 |
| 安装方式 | PWA、Chrome / Edge 新标签页扩展、静态站点或 Docker 自托管 |

## 快速开始

环境要求：Node.js `^20.19.0` 或 `>=22.12.0`。

```bash
git clone https://github.com/lxshwyan/WyanDesk.git
cd WyanDesk
npm ci
npm run dev
```

浏览器打开 `http://localhost:8097`。本地没有启动 WyanDesk API 时，应用会自动保持本地模式。

常用命令：

```bash
npm test                   # 运行单元测试
npm run typecheck          # TypeScript 检查
npm run build              # 生成 dist/
npm run package:extension  # 构建并打包浏览器扩展
```

## 浏览器扩展

1. 从 [Releases](https://github.com/lxshwyan/WyanDesk/releases) 下载 `wyandesk-extension.zip` 并解压。
2. 打开 Chrome / Edge 扩展管理页并启用“开发者模式”。
3. 选择“加载已解压的扩展程序”，指向解压目录。

扩展默认只使用 `activeTab` 和 `storage`。保存整个窗口与直接迁移浏览器书签时，才会分别申请可选的 `tabs` 和 `bookmarks` 权限。

## Docker 自托管

```bash
docker build -t wyandesk:local .
docker run --rm -p 8080:8080 wyandesk:local
```

打开 `http://localhost:8080`。更完整的反向代理、PWA 和可选云同步说明见 [自托管指南](docs/SELF_HOSTING.md)。

## 数据与隐私

- 默认数据保存在浏览器 `localStorage`，清理浏览器数据前请先导出备份。
- 当前版本不接入广告或第三方行为统计。
- 系统通知、书签和标签页权限只在用户主动使用相应功能时申请。
- 官方站点登录后可选择云同步、历史恢复、反馈和自助删除云端数据。
- 自托管前端不包含 WyanHub 账号与同步后端；不配置后端时仍可完整使用本地功能。

详情见 [隐私说明](docs/PRIVACY.md)。

## 项目结构

```text
src/                 React 应用与测试
extension/           Chrome / Edge 扩展源码
public/              PWA 资源与扩展下载包
scripts/             扩展构建与打包脚本
docs/                截图、隐私和自托管文档
```

## 参与项目

欢迎提交问题、建议和 Pull Request。请先阅读 [贡献指南](CONTRIBUTING.md) 与 [安全策略](SECURITY.md)。版本变化记录在 [CHANGELOG](CHANGELOG.md)。

## License

[MIT](LICENSE) © 2026 WyanDesk contributors
