# WyanDesk 自托管

WyanDesk 是一个静态前端应用。最简单的部署只需要构建 `dist/` 并由支持单页应用回退的 Web 服务器提供文件。

## 静态构建

```bash
npm ci
npm run build
```

将 `dist/` 发布到静态主机，并确保未知路径回退到 `index.html`。为保证 PWA 更新及时，建议对 `index.html` 和 `sw.js` 禁用长期缓存，对带内容哈希的静态资源启用长期缓存。

## Docker

```bash
docker build -t wyandesk:local .
docker run --rm -p 8080:8080 wyandesk:local
```

仓库自带的 Nginx 配置监听 `8080`，包含单页应用回退、PWA 更新缓存策略和基础安全响应头。

## HTTPS 与 PWA

除 `localhost` 外，浏览器通常要求通过 HTTPS 才能完整启用 Service Worker、安装 PWA 和系统通知。生产环境应在容器前使用 Caddy、Nginx、Traefik 或云负载均衡终止 TLS。

## 可选云同步

前端会尝试访问同源的以下接口，并在接口不存在或未登录时自动保持本地模式：

- `GET /api/desk/me`
- `GET|PUT|DELETE /api/desk/state`
- `GET /api/desk/revisions`
- `GET /api/desk/revisions/:version`
- `POST /api/desk/feedback`

官方 WyanHub 身份与同步后端不包含在本仓库中。若自行实现兼容服务，请使用安全的会话 Cookie、CSRF 防护、访问控制、版本冲突处理和数据删除能力。
