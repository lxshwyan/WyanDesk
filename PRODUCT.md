# WyanDesk Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

WyanHub members who use a browser desktop to organize websites, tasks, schedules, notes, reminders, and lightweight work. They may be anonymous local-only users or signed-in users who opt into cloud services.

## Product Purpose

WyanDesk provides a quiet, configurable browser desktop that helps people reach frequently used sites, capture small pieces of work, and continue their day without opening a heavyweight management system. The WyanHub assistant extends that purpose with grounded desktop/product guidance, lightweight general help, and an explicitly separate live-search mode for current information.

## Positioning

WyanDesk is local-first: the core desktop remains useful without an account or backend. Optional cloud features are explicit and narrow. The assistant's distinct value remains grounded guidance across the actual WyanHub product and tool catalog; general knowledge is a supporting mode, and live search is separately configured and visibly sourced rather than blended into model memory.

## Operating Context

Users open WyanDesk as a normal web app, PWA, or browser new-tab extension. They move between shortcuts, tasks, schedules, notes, reminders, and WyanHub services. Questions to the assistant should be short, practical, and usually end in understanding a feature, choosing a product or tool, or opening the relevant destination.

## Capabilities and Constraints

- Anonymous users retain the complete local desktop and may explicitly send assistant requests within an administrator-controlled guest allowance; clearing site data resets their random local quota identifier but never uploads desktop content.
- Signed-in users may ask about WyanHub products, capabilities, workflows, privacy boundaries, and tools under a separate account allowance.
- When a model is configured, guests and signed-in users with remaining allowance may use a clearly labelled general mode for explanation, writing, translation, organization, learning, and calculation; it must not imply current web access.
- When a search provider is separately configured, guests and signed-in users with remaining allowance may use a clearly labelled live-search mode whose answers require validated external HTTPS sources.
- Exhausting or disabling upstream allowance must leave deterministic WyanHub product knowledge available and make the remaining allowance visible near the assistant status.
- Assistant requests pass through a WyanHub-owned backend. Provider credentials never reach the browser.
- The backend owns provider and model configuration so models can be replaced, added, or routed without changing the Desk client.
- WyanHub guidance must be grounded in a versioned WyanHub knowledge catalog and include supporting sources or destinations. Live-search answers must be grounded in the current search response; general answers must state their non-real-time boundary.
- The assistant does not read product databases, form answers, attachments, desktop notes, tasks, schedules, shortcuts, browsing history, or encrypted desktop state by default.
- The assistant must remain unavailable without degrading the local desktop when the backend or model provider is unconfigured or unavailable.
- Publishing, model credentials, production configuration, and deployment remain separate explicit operations.

## Brand Commitments

The product name is “微言桌面 WyanDesk.” User-facing language is concise Chinese, calm, factual, and action-oriented. Existing WyanHub and WyanDesk names, logo assets, local-first promise, privacy wording, and incumbent interface identity must be preserved.

## Evidence on Hand

## Product Principles

1. Preserve local usefulness: optional intelligence must never become a prerequisite for the desktop.
2. Guide before automating: grounded explanations and correct destinations come before write-capable agent actions.
3. Keep authority explicit: WyanHub owns knowledge, permissions, routing, and audit; the model supplies language generation.
4. Reveal data movement: users should understand when a question leaves the browser and what context is sent.
5. Prefer stable boundaries: provider, model, knowledge, tools, and presentation evolve independently behind documented interfaces.

## Accessibility & Inclusion

The desktop and assistant must remain keyboard operable, responsive on narrow mobile viewports, compatible with reduced motion, and clear without relying on color alone. Loading, cancellation, empty, refusal, and error states require readable text and programmatic status semantics.


## 首屏配色与工具入口（2026-10-30）

首屏在React加载前读取现有本机主题与自定义背景，8种场景的关键基础背景和完整桌面复用同一CSS变量；偏好更新时同步根页面背景，避免默认浅色与保存配色之间的闪烁。存储读取失败仍可进入默认桌面或原静态恢复路径；不复制桌面内容到额外存储或上传。

顶栏使用Wrench线图标与“小工具”文字，在新标签打开微言工具箱 `/tools`；小游戏弹层与账号慢互动消息铃铛暂不挂载，消息轮询随之停止。原慢互动组件、API、账号和记录保留，相关功能仍可通过工具箱自身入口使用。顶栏两项链接与“助手”共用14px正文、650字重、图标和间距，无下划线；窄屏收为有可访问名称的图标。沿用键盘焦点与现有布局，不新增权限或后台服务。

## 顶部小伴清单入口（2026-10-28）

桌面顶栏在“小工具”前提供常显“小伴清单”文字与ListChecks线图标，点击在新标签页打开固定HTTPS地址https://together.wyanhub.com/，保留原桌面。它是普通外链，不传递桌面任务、便签或账号，不合并两侧记录，不增加API或扩展权限；小伴清单登录与数据权限仍由其自身处理。网页、PWA及扩展包复用现有顶栏样式和键盘焦点。

## 网站发现与轻导航候选（2026-10-29）

沿用既有桌面视觉：本地图标按精确域名识别，保留自定义文字及失败回退；搜索旁可原位选择百度/必应。51项网站目录可搜索、选择目标分类、拦截重复并保留手动输入；不会自动恢复已删除网站。轻导航由每个桌面主动启用，只切换展示，往返保留任务、便签、设置和布局。分类数量/成员提示和现有网站组合的成员图标帮助辨认内容，不增加后端、扩展权限、浏览历史读取或运行时第三方图标请求。


## 常用分组、极简与弹窗约束（2026-11-01）

顶部九宫格为用户拥有的“常用分组”，各桌面共用。可自建/编辑/排序/删除组和网站，也可从快捷网站复制独立副本，原网站保留；默认六个入口可全部移除，不保留品牌导流或自动补回。初始内容与个人保存内容明确分开。

参考 iTab 的自定义分组与一键极简思路，沿用 Desk 独立视觉和现有本机优先能力；点击时间或顶栏当前模式按钮切换，保留组件配置。已有书签导入、按需组件和备份继续复用，不引入内容流或额外后台服务。

用户要求所有居中弹窗均衡、适度限高，长列表内部滚动；宽屏复制列表双列，手机单列。默认上限 min(640px,80dvh)，常用分组 min(580px,76dvh)，不强行拉高短表单。操作优先一步可达，次要配置按需出现。

2026-11-01 入口简化：顶栏原布局按钮位置提供当前模式与四种展示选择，搜索下方不重复；布局编辑通过桌面设置的组件布局页进入，沿用底部完成工具条。

## 操作入口与渐进配置

添加网站先粘贴网址，名称在本机自动填入，保留直接改名和分类；图标外观默认折叠，网站目录作为次要入口。快捷网站和常用分组复用同一表单，桌面顶栏显示“常用”，复制操作使用“复制到常用”。不抓取网页、不新增元数据接口。

普通搜索默认明确执行网页搜索，已收藏网站单独呈现，用户点选或用方向键选择后回车打开；直接网址仍优先打开。极简模式保留同一结果列表。跨桌面内容搜索继续使用原“全部内容”入口。

首次起点和组件设置用四种小型预览选择轻导航、图标桌面、卡片桌面、极简模式，只切展示，不重建个人内容；“开始使用”始终可直接进入。当前应用与手动安装包为 0.12.2。额外导入与安装按需查看；已有用户重新打开指南不出现初始内容模板，成功导入书签后也禁用该模板，避免覆盖。网页账号菜单“安装与扩展”直达设置首页，PWA和官网下载扩展步骤集中展示；Edge 商店提交记录见 docs/EXTENSION_STORE_SUBMISSION.md。

## 图标桌面与模式入口

顶栏当前模式按钮统一选择轻导航、图标桌面、卡片桌面和极简模式，并可直接选择组件、更换壁纸。图标桌面在宽幅画布中先呈现真实已开启组件，再呈现分组网站，移除网站区域的多层白色容器；轻导航使用分类卡片，卡片桌面保留原分栏与尺寸设置，极简单独排布大时钟与搜索并隐藏整个内容布局。切换不复制内容、不重置任务、便签或已存布局。

组件横排统一高196px，保持已存顺序；普通滚轮横向浏览，卡片内长内容优先纵向滚动，边界恢复页面滚动。箭头每次滚动一张，仍支持触控板、触摸与键盘。卡片右上角打开左上浮动副本，原卡片继续显示，两处共享便签、计算器、月历及本机草稿状态。浮窗只留关闭和右下角拉伸，可拖动标题或非交互空白处移动；键盘可移动、拉伸，关闭/Esc隐藏，再次打开恢复默认位置和尺寸，不重排原布局。组件可直接拖动标题或非交互空白处排序并保存；持久宽高在布局调整中修改；图标组件行不覆盖卡片桌面已存宽高。轻导航或极简中开启组件会返回可显示它的桌面；手机图标模式不重复显示快速记录。

非极简模式把时钟与搜索组成紧凑搜索带，时间事件在搜索下方显示为可编辑条目，不再在轻导航单独摆一张卡片或挤占工作区。八套环境、自定义图片与环境动效继续复用，另有四张自托管 CC0 精选照片与收藏、按本地日期轮换；未接入在线图片接口或视频壁纸库。模式菜单、外观设置及图标组标题提供可选“分组与组件背景”；六组柔和渐变（雾蓝、薄荷、暖杏、浅紫、晴空、云灰）、纯色和本地JPG/PNG/WebP可保存或恢复默认。所有组件可一键套用推荐配色，只改背景，不改内容、顺序和尺寸；已有用户不主动设置时保持原样。上传先在浏览器压缩，最长边640px、单张编码64KiB、全部区块共512KiB，经原JSON备份及可选整份同步保存，无独立图片上传服务。

首次初始化选择图标桌面与星夜地平线，默认按“今天 / 专注计时 / 便签 / 快捷操作 / 月历 / 计算器”排列六张推荐组件；配色以灰蓝为主，少量薄荷、暖杏点缀。AI、办公、日常三组各两个网站，共6个：DeepSeek、豆包、腾讯文档、QQ邮箱、哔哩哔哩、知乎；留出空间供用户自行添加，天气等联网组件按需开启。只对全新状态应用，已有桌面的场景、模式、显隐、内容和配色不重置；旧数据缺场景字段仍回退原深海值。

分组与组内网站默认全部展开，切换桌面和重新打开时恢复默认展开；超过四组时可手动“收起分组”只看前四组，超过六站的单组可手动“收起”只看前六站，并保留对应展开入口。分组与网站自然撑开页面，长内容随页面滚动，不设分组区或单组内部限高；宽屏四列、中屏双列、手机单列。桌面网站标识面56px、图片38px，手机52/34px。常态点击网站打开，超过阈值直接拖动网站或分组，触屏长按拖动；浮动影子反馈目标，拖到视口上下边缘时滚动页面。网站及组标题右键/Shift+F10复用原管理菜单，Alt+左右键可排序。分组收起/展开入口与管理、添加并列。网站区标题“快捷网址”不附总数量；快捷操作为三个主要动作加“全部操作”页脚的单卡。

## 独立便签与桌面继承（0.9.0）

便签标题可点击改名，复制后成为独立内容、背景、显隐和排序的卡片；每桌面最多十二张，沿用v9备份和整份同步。放大仍是同一张便签的同步视图，关闭只隐藏浮窗，不删除便签。全部十四类组件复用原位保留、左上浮窗、空白/标题拖动和右下角拉伸；紧凑与放大分别排版。专注提供5/15/25/45/60分钟与自定义时长。

新建空白桌面继承当前展示方式、基础组件顺序/尺寸/背景和分组色调，清空网站、任务及便签正文；不复制额外便签。缺少背景时使用系统推荐值。原“工作桌面”界面改称“卡片桌面”，保存的work标识不变。旧“常用”网站分类仅在仍完全由原默认网站构成且不冲突时改名“日用”，自建内容不动。顶部“常用”初始六项加入微境沙盘、移除工具箱/机房并将表单更名微言表单；用户修改过的列表保留。未新增身份、服务、API、数据库、扩展权限或图片上传。已核对架构边界不变。

0.11.0在统一搜索及组件选择中加入八类单位换算，默认不占桌面位置。专注可启用休息循环，每阶段结束后由用户开始下一阶段，截止时间校准后台计时，不后台自动播放或虚增轮数。壁纸在外观设置选择，收藏仅改收藏，照片/每日选择才替换背景。四张照片随站点和扩展分发，保留来源许可；不承诺在线每日新图。图标模式横排隐藏滚动条，保留滚轮、键盘、触摸和箭头。新偏好沿用v9备份/整份同步，原 API、身份、权限和数据库边界不变。

0.11.1撤下桌面常驻“继续上次工作”横栏，保存/重新打开网页保留在插件菜单；现有浏览器窗口记录不删除，不将网址恢复描述为编辑进度恢复。

透明外观是四模式共用的可选材质，不新增桌面模式，默认关闭。搜索/网站卡片无底色、无模糊；顶栏和组件以极淡半透明底分组、不画外框线，菜单/编辑/放大工作窗口保持可读。现有模块配色保留，关闭即可恢复；无新权限或外部依赖。

0.11.2将专注循环控件改为“结束后休息”，删除重复休息标签；以无填充SVG圆弧绘制真实计时进度，防止半透明中心透出蓝色扇形。保持手动开始下一阶段与原计时/存储边界。


0.12.0补齐专注的同来源本机接续和跨标签共享；独立会话不进入桌面云同步/备份，以Web Locks串行结算并认领一次提醒，缺少锁时保留可见完成状态而抑制潜在重复通知。可显示既有今日重点，结束后仍由用户开始下一段；不承诺浏览器关闭期间的系统闹钟。

外观设置内以三套方案进入真实桌面预览；只有应用才保存，取消还原，恢复只撤回外观而保留后续内容编辑。壁纸裁切、文字明暗及透明底色强度共用首屏与应用值。组件选择先显示可搜索的真实预览，再分别临时使用或添加到桌面；预览不可编辑，天气不额外请求。沿用既有设置、模式和浮窗，无新增顶栏入口或内容流。
