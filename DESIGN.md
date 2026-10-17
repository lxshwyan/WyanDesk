---
name: "微言桌面 WyanDesk"
description: "安静、本地优先的浏览器工作桌面；以冷白表面和功能蓝承载清晰、可信的操作。"
colors:
  functional-blue: "#2468d8"
  functional-blue-hover: "#1959c1"
  ink: "#172033"
  muted-ink: "#5f6f84"
  faint-ink: "#8794a6"
  page-cool: "#e8eef7"
  glass: "rgba(250, 252, 255, .88)"
  glass-strong: "rgba(252, 253, 255, .95)"
  item-surface: "rgba(255, 255, 255, .64)"
  muted-surface: "rgba(229, 236, 245, .58)"
  quiet-line: "rgba(94, 116, 148, .16)"
  assistant-surface: "#f8fafd"
  assistant-context: "#f3f6fa"
  user-answer: "#e8f1fd"
  success: "#2d8b69"
  danger: "#8b4848"
typography:
  headline:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "20px"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.03em"
  title:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "16px"
    fontWeight: 680
    lineHeight: 1.35
    letterSpacing: "-0.02em"
  body:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "14px"
    fontWeight: 400
    lineHeight: 1.65
    letterSpacing: "normal"
  label:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "13px"
    fontWeight: 650
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "-apple-system, BlinkMacSystemFont, SF Pro Display, Segoe UI, PingFang SC, Microsoft YaHei, sans-serif"
    fontSize: "12px"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
rounded:
  control: "9px"
  card: "12px"
  composer: "14px"
  panel: "18px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  xxl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.functional-blue}"
    textColor: "#ffffff"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 13px"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.functional-blue-hover}"
    textColor: "#ffffff"
    rounded: "{rounded.control}"
  button-quiet:
    backgroundColor: "{colors.item-surface}"
    textColor: "{colors.muted-ink}"
    typography: "{typography.body}"
    rounded: "{rounded.control}"
    padding: "0 10px"
    height: "32px"
  panel-glass:
    backgroundColor: "{colors.glass}"
    textColor: "{colors.ink}"
    rounded: "{rounded.panel}"
  assistant-drawer:
    backgroundColor: "{colors.assistant-surface}"
    textColor: "{colors.ink}"
    width: "min(500px, 100vw)"
  assistant-composer:
    backgroundColor: "#ffffff"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.composer}"
    padding: "6px"
  assistant-source-row:
    backgroundColor: "transparent"
    textColor: "#355675"
    typography: "{typography.label}"
    padding: "7px 3px"
    height: "47px"
---

# Design System: 微言桌面 WyanDesk

## Overview

**Creative North Star: “安静的工作桌面”**

WyanDesk 的设计语言来自一个克制、可长期停留的浏览器桌面，而不是营销站、后台模板或通用聊天产品。冷白与浅蓝表面浮在可切换的环境背景之上，功能蓝只标记动作、焦点和少量状态；紧凑的系统字体、Lucide 线性图标、静默边框与轻微偏移阴影共同维持清楚但不吵闹的工作感。

WyanHub 助手是这套桌面的延伸：它以右侧参考抽屉保留桌面上下文，用开放文本组织回答，以轻量来源行建立可核对性。WyanHub、通用和联网三个模式使用同一套克制结构，并以文字而不是视觉噱头区分数据边界。它不把“AI”做成独立视觉世界，不依赖装饰性渐变、机器人意象或连续气泡来制造存在感。

本地优先也是视觉约束。游客、登录用户、额度用完、服务不可用、知识模式和模型模式都必须有清楚状态，但不能让助手遮蔽或贬低桌面的本地能力。剩余额度使用状态行内的 caption 层级；用完后在输入器上方显示非阻塞提示，游客就近提供登录入口，并保留产品知识查询。隐私边界应在操作前可见，恢复动作应与错误信息相邻。

**Raster provenance:** `.impeccable/review/desktop.png`（1440×1000）与 `.impeccable/review/mobile.png`（390×844）是 2026-10-15 由本地已登录 mock 服务生成的本地 QA 截图。它们只用于核对布局和响应式表现，不是生产环境可用性、生产模型配置、生产数据或线上发布状态的证据。

**Key Characteristics:**

- 冷白、浅蓝和蓝灰构成工作表面，功能蓝保持稀缺。
- 11–20px 的紧凑工作型字号为基础，用字重与节奏而不是夸张尺寸建立层级。
- 12–18px 圆角、细边框、偏移阴影和 16–18px Lucide 图标保持一致。
- 弹层有明确层级、键盘闭环和滚动边界；移动端优先保证触控与输入可用性。
- 助手回答是开放文本，来源是受控行列表，隐私披露位于操作上下文内。

## Colors

色彩以低饱和冷色中性为底，单一功能蓝承担主要交互；成功、危险和模式状态只在语义需要时出现。

### Primary

- **功能蓝：** 用于主动作、选中状态、焦点提示、链接悬停和少量品牌标记。不要把大面积内容容器全部染蓝。
- **功能蓝悬停：** 只用于蓝色主动作的悬停或按压反馈，避免成为第二套常驻强调色。

### Neutral

- **墨色与蓝灰文字：** 正文使用深墨色；说明、元数据和次级状态逐级使用 muted 与 faint。文本层级不能只靠透明度压低到难读。
- **冷页底与玻璃面：** 页面底色承接环境场景，玻璃面用于桌面卡片，强玻璃面用于需要更稳定对比的浮层或控件。
- **助手冷白面：** 助手抽屉保持不透明度更高的冷白，状态/隐私条使用更轻的蓝灰底，确保回答阅读不被场景背景干扰。
- **静默分隔线：** 细线用于分组和行分隔，不用于给每段内容再套一层卡片。

### Secondary

- **状态绿：** 仅表达已启用的模型综合或明确成功状态，必须同时配有文本。
- **克制红：** 仅用于请求错误、破坏性操作和需要恢复的状态，不作装饰。

**The One Functional Accent Rule.** 常规界面只保留一套功能蓝；状态色表达含义，不与主动作争夺层级。

**The Text-With-Status Rule.** 状态点永远与“模型综合”“知识模式”“暂未开放”等文字同行，不用颜色单独传达系统状态。

## Typography

**Display Font:** 系统无衬线栈，以 Apple/Windows 原生界面字体和中文系统字体回退。

**Body Font:** 与显示字体共用同一系统栈，保持跨 PWA、浏览器新标签页和普通网页的一致速度与清晰度。

**Character:** 字体是紧凑、务实的工作字体，不追求海报式对比。层级主要来自 11、12、13、14、16、18、20px 的连续刻度、600–700 左右的关键字重和短促的负字距标题。

### Hierarchy

- **Headline**（20px，700，1.25）：抽屉和对话框标题；只在当前任务的最高层级使用。
- **Title**（16px，约 680，1.35）：面板标题、品牌主名和强分组标题。
- **Body**（14px，400，通常 1.5–1.72）：说明、空状态和助手回答。助手答案使用更松的 1.72 行高，并允许保留换行与任意长词换行。
- **Label**（13px，约 650，1.4）：按钮、状态、来源标题和紧凑控件。
- **Caption**（12px，400，1.5）与 **Micro**（11px）：来源标记、提示、计数和组合键说明，不承载关键操作结果。

移动端的 `textarea` 和 `select` 使用 16px，避免浏览器输入缩放并保证实际阅读；这不是把全站字号放大到 16px 的理由。1800px 与 3200px 以上可按现有原生响应式字号令牌递增，不使用整页缩放。

**The Workhorse Type Rule.** 用一套系统字体和有限字号梯度完成层级；不为助手引入展示字体、等宽聊天字体或夸张的 AI 标题。

## Layout

桌面主体维持可调组件网格，助手作为托管弹层从右侧进入，不重排桌面。桌面助手宽度为 `min(500px, 100vw)`，高度使用 `100dvh`，内部按“标题、状态/隐私、可滚动对话、底部输入器”四行组织。桌面端的 500px 上限让回答有足够行长，同时保留被遮罩的桌面语境；抽屉没有额外最大内容容器。

标题区桌面最小高度 78px，状态/隐私条最小高度 44px。其下用一个三等分模式条展示 WyanHub、通用和联网；不可用能力保留位置但禁用并说明原因。对话区是唯一纵向滚动区域，使用 `overscroll-behavior: contain` 和可见但安静的细滚动条；输入器固定在抽屉底部，并吸收安全区底边。新消息和发送状态出现时滚到对话末端，但滚动不应推动页面背景。

620px 及以下，抽屉占满视口宽度并取消左边框；标题收紧，回答左右内边距降至 15px，底部输入器左右内边距降至 12px。关闭、发送、取消、隐私披露和模型选择等关键触控区域至少 44px；手机表单文字至少 16px。状态条可隐藏用户名，但不能隐藏模式或隐私入口。

托管弹层打开时锁定 `html` 与 `body` 滚动，Tab/Shift+Tab 约束在最上层弹层，Esc 关闭，关闭后焦点返回原触发控件。叠加弹层必须遵循同一栈规则，不自行竞争焦点或恢复页面滚动。

**The Preserved Desktop Rule.** 助手覆盖桌面但不改写桌面布局；关闭后用户回到原先的工作位置和触发点。

## Elevation & Depth

WyanDesk 使用“玻璃面 + 静默描边 + 轻偏移阴影”的混合深度。普通桌面卡片使用低对比玻璃和柔和双层阴影；抽屉使用向左展开的结构性阴影（`-20px 0 70px rgba(20,33,55,.16)`）与半透明遮罩，明确其为最上层工作面。按钮和来源行通常不增加阴影，助手标记只用一层小型蓝色偏移阴影。

悬停最多抬升约 1px，并伴随轻微颜色变化。进入动画短而直接；系统启用减少动态时，动画和过渡应压缩到接近即时，不能保留无止境的等待脉冲或位移动效。

**The Structural Depth Rule.** 阴影只解释层级或交互反馈；不能给每条回答、每个来源或每个建议问题都制造独立浮层。

## Shapes

控件采用轻弧形 9px 圆角，内容卡片约 12px，输入器与强调容器约 14px，大面板约 18px。圆角随容器尺度递增，而不是所有元素统一成胶囊。圆形只用于状态点、计数徽标和少量图标按钮。

助手抽屉保持平直的视口边缘，依靠左侧边线和阴影与桌面分层。用户问题可以使用不对称的 `14px 14px 4px 14px` 气泡来标识输入；助手回答保持开放文本，不镜像成另一种气泡。来源、建议和设置入口使用整行命中区与底部分隔线，避免嵌套圆角卡片。

Lucide 图标保持 13–18px 的细线风格，图标只是标签的辅助；关键动作和状态必须有可访问名称或可见文字。

## Components

### Buttons

- **Primary:** 功能蓝实底、白字、9px 圆角；只承担当前区域的主要提交或登录动作。悬停进入更深蓝，禁用态变为冷灰并停止点击反馈。
- **Quiet / icon:** 透明或浅白底、蓝灰文字；悬停时使用浅蓝灰底。桌面图标按钮通常为 36–38px，移动端关键按钮扩大到 44px。
- **Focus:** 全局 `:focus-visible` 使用 3px 半透明蓝色轮廓和 2px 外偏移；复合输入器同时使用 `:focus-within` 的边框与柔光，但不能删除键盘轮廓而不给等价反馈。

### Cards / Containers

- **Glass panel:** 冷白半透明表面、安静边框、18px 大面板圆角和轻微背景模糊，是桌面工作卡片的默认容器。
- **Assistant drawer:** 更实的冷白底、左侧细边和结构性阴影；宽度有上限，内容区不再套总卡片。
- **State / empty surfaces:** 通过留白、图标、标题和正文组织，不为每种加载、错误或空状态重新发明卡片样式。

### Inputs / Fields

- **Composer:** 白底、14px 圆角、细蓝灰边框；文本域无内部边框，发送/取消按钮贴近右下角。Enter 发送，Shift+Enter 换行，输入法组合阶段不得误发送。
- **Model select:** 仅当服务端允许且存在多个模型时显示。它是次级设置，不得占据标题或主操作层级。
- **Mobile:** 文本域和选择器字号固定为 16px；发送、取消和选择控件至少 44px。

### Navigation

助手入口沿用桌面顶栏的文字按钮与 Sparkles 线性图标，打开时只改变功能蓝和浅白底状态。1050px 以下隐藏“助手”文字、保留带可访问名称的图标按钮；620px 以下与其他顶栏入口共享 42px 外部尺寸。

### Assistant Answer & Sources

助手回答使用开放文本块，消息之间以 22px 节奏分隔。用户输入可收敛为右对齐浅蓝气泡；助手输出不加背景、边框或头像。附加说明用 caption 层级置于回答之后。

来源区在回答下方以一条上分隔线开始，标题为“相关来源”。每个来源是最小 47px 的链接行，展示主标题、来源标签和外链图标；长文本截断，但整行可操作。来源必须经过安全 URL 过滤并在新标签页打开，不能把来源做成彩色徽章、横向卡片轮播或正文内脚注噪声。

### Privacy Disclosure & Service State

标题下的上下文条同时显示当前回答范围和隐私披露。指南/通用使用“只发送提问 · 不读桌面”，联网模式使用“联网检索 · 不读桌面”；展开后说明不会读取桌面卡片、云同步内容或其他业务数据。它必须在首次提问前可见，不能藏在设置页或页脚。

加载使用 `role="status"`，请求错误使用 `role="alert"`，对话区使用 `aria-live="polite"`。抽屉本身是带标题与描述关联的模态 dialog；关闭、清空、发送、取消、重试和外链都要保留明确的可访问名称。服务失败时给出相邻恢复动作，助手不可用时明确说明本地桌面不受影响。

## Do's and Don'ts

### Do:

- **Do** 继承 WyanDesk 的冷白/浅蓝表面、系统字体、Lucide 线条、9–18px 圆角和安静阴影。
- **Do** 把助手作为右侧参考抽屉，让桌面上下文保持可辨识，并在移动端切换为全宽 `100dvh` 工作面。
- **Do** 让助手回答以开放文本呈现，只把用户输入做成轻量气泡。
- **Do** 用克制的来源行展示标题、来源标签和外链动作，并保留清晰分隔与至少 47px 行高。
- **Do** 在提问前展示隐私边界，同时用文字说明模式、错误和恢复路径。
- **Do** 维持 Esc 关闭、焦点约束与返回、背景滚动锁定、语义状态播报和减少动态支持。
- **Do** 在手机上为关键助手控件提供至少 44px 触控尺寸，为文本域和选择器使用至少 16px 字号。
- **Do** 把 `.impeccable/review/desktop.png` 和 `mobile.png` 标注为 2026-10-15 的本地已登录 mock QA 产物，而非生产证据。

### Don't:

- **Don't** 把助手改造成独立聊天首页、装饰性 AI 卡片墙或与 WyanDesk 无关的紫色霓虹设计系统。
- **Don't** 给助手回答、引用、建议问题和状态分别嵌套卡片或复制一套左右双气泡聊天视觉。
- **Don't** 让功能蓝覆盖大面积内容，也不要用仅有颜色的圆点表达模式或健康状态。
- **Don't** 把隐私说明藏在设置或法律文本里，不要暗示助手会读取桌面、同步内容或业务数据。
- **Don't** 在移动端使用小于 44px 的关键触控控件或小于 16px 的表单文字。
- **Don't** 让抽屉滚动带动页面、破坏焦点返回，或在减少动态模式下保留持续动画。
- **Don't** 把本地 mock 截图、模拟登录态或 QA 文案描述成生产可用性证明。
