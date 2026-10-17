# WyanDesk 自托管

WyanDesk 是一个静态前端应用。最简单的部署只需要构建 `dist/` 并由支持单页应用回退的 Web 服务器提供文件。

## 静态构建

```bash
npm ci
npm run build
npm run validate:pwa
```

`npm run build` 会在 Vite 构建结束后把实际生成的哈希运行资源注入 `dist/sw.js` 的预缓存清单；Source Map 不参与离线预缓存，避免占用手机存储。`npm run validate:pwa` 会核对安装清单、192/512 图标和全部运行资源。将 `dist/` 发布到静态主机，并确保未知页面路径回退到 `index.html`，但 `/api/*` 不得做页面回退。

为保证更新及时，建议对 `index.html`、`sw.js` 和 `manifest.webmanifest` 禁用长期缓存或使用每次重新验证，对 `/assets/*` 内容哈希资源启用长期不可变缓存。新 Service Worker 安装后会保持 waiting 状态，直到用户在页面中确认更新；不要在代理层把旧 `sw.js` 长期缓存。

## Docker

```bash
docker build -t wyandesk:local .
docker run --rm -p 8080:8080 wyandesk:local
```

仓库自带的 Nginx 配置监听 `8080`，包含单页应用回退、PWA 更新缓存策略和基础安全响应头。

若启用可选天气组件，浏览器需要能够直接访问 `https://geocoding-api.open-meteo.com` 和 `https://api.open-meteo.com`。天气不依赖自托管后端或 API 密钥；组件关闭时不会请求这两个地址。若站点自行配置 Content Security Policy，需要把这两个来源加入 `connect-src`。

## HTTPS 与 PWA

除 `localhost` 外，浏览器通常要求通过 HTTPS 才能完整启用 Service Worker、安装 PWA 和系统通知。生产环境应在容器前使用 Caddy、Nginx、Traefik 或云负载均衡终止 TLS。

Android、Chrome 和 Edge 可使用浏览器安装提示；iPhone / iPad 需要从 Safari 的“分享 → 添加到主屏幕”安装。安装不会获得设备文件夹权限，文件导入始终由用户主动触发系统选择器。基础桌面缓存就绪后，本地任务、网站和便签可离线打开；天气、同步、助手以及其他网络请求不会被 Service Worker 伪装成页面响应。

## 可选云服务

前端会尝试访问同源的以下接口，并在接口不存在或未登录时自动保持本地模式：

- `GET /api/desk/me`
- `GET|PUT|DELETE /api/desk/state`
- `GET /api/desk/revisions`
- `GET /api/desk/revisions/:version`
- `POST /api/desk/feedback`
- `GET /api/desk/assistant/config`
- `POST /api/desk/assistant/query`
- `POST /api/desk/assistant/feedback`

前五组接口提供身份、同步与用户正文反馈并强制登录；最后三条助手接口可单独使用“可选登录”网关，为游客与登录账号配置不同的每日点数额度并接收不含正文的有帮助/未解决结果。后端至少应同时限制全站、游客 IP 和个人三层额度，并在一个数据库事务内预占，避免并发穿透或局部误扣。游客客户端 ID 必须随机生成，客户端 IP 必须由受信任反向代理覆盖注入；两者都要先 HMAC 哈希再入库，不得直接保存账号、游客 ID 或 IP。助手后端应把厂商账号密钥和 SMTP 密码保存在服务端环境变量中，让任务档位映射真实模型；告警邮件不得包含问题、回答或身份。没有模型密钥或额度已用完时仍可返回确定性操作步骤。联网能力必须单独启用并返回可核对的 HTTPS 来源。不要把桌面状态、业务数据库内容或密钥传给浏览器、模型或搜索服务，也不要把问题和回答写入用量或结果反馈表。

官方 WyanHub 身份、同步与助手后端不包含在本仓库中。若自行实现兼容服务，请使用安全的会话 Cookie、CSRF 防护、访问控制、版本冲突处理和数据删除能力。WyanHub 工作区内的参考实现及完整助手配置见 `wyan-desk-api/docs/ASSISTANT_ARCHITECTURE.md`。
