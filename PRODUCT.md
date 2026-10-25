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

- The implemented product, features, and usage boundaries are documented in `README.md` and `docs/PRIVACY.md`.
- The current UI implementation and design tokens live in `src/App.tsx`, `src/components/`, and `src/styles.css`.
- The Desk API authentication and cloud-data boundary are documented in `../wyan-desk-api/README.md`.
- The WyanHub product map and current functional scope are maintained in `../../wyanhub-infra/docs/项目说明.md`.
- No testimonials, adoption metrics, model-quality benchmark, or assistant production usage evidence is currently available; future work must not fabricate it.

## Product Principles

1. Preserve local usefulness: optional intelligence must never become a prerequisite for the desktop.
2. Guide before automating: grounded explanations and correct destinations come before write-capable agent actions.
3. Keep authority explicit: WyanHub owns knowledge, permissions, routing, and audit; the model supplies language generation.
4. Reveal data movement: users should understand when a question leaves the browser and what context is sent.
5. Prefer stable boundaries: provider, model, knowledge, tools, and presentation evolve independently behind documented interfaces.

## Accessibility & Inclusion

The desktop and assistant must remain keyboard operable, responsive on narrow mobile viewports, compatible with reduced motion, and clear without relying on color alone. Loading, cancellation, empty, refusal, and error states require readable text and programmatic status semantics.


## Local candidate: relaxation entry and private slow messages (2026-10-24)

An explicit header “小游戏” button opens a native popover with a locally chosen random short activity, six direct links, the full Toolbox /relax directory, friend slow interaction and realtime peer play. Outside click/Esc dismiss it and return focus; the mobile popover has 12px side margins. Signed-in users have a separate durable slow-interaction bell; it does not replace the local inbox, alter desktop widgets, or read notes/tasks. Existing web and extension authentication is reused. The panel shows friend requests, private invitations, actual current turns and other content updates. Reads are versioned, account changes/lock clear stale interface content, and a normal link opens the allowed Toolbox destination. Visible polling is bounded; no closed-page/system/email push is promised. Shared room content lives in Desk API and is not part of desktop end-to-end encrypted sync. This is an ordinary extension of the current visual world, released with Desk0.6.1/API0.4.0 on 2026-10-25; installed-extension authentication remains a separate unverified device boundary.


小游戏快捷入口沿用桌面工具栏的轻量按钮与原生非模态弹层，按随机短局、常用玩法、好友慢互动、实时五子棋和完整目录组织。弹层不透明，桌面自然紧凑宽度与手机边距独立处理；Esc返回触发按钮，外部点击收起。只有用户点击后打开公开入口，不读取桌面内容、不改变通知权限或云同步边界。
