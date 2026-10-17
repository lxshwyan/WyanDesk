# Changelog

All notable changes to WyanDesk are documented here.

## [Unreleased]

## [0.4.4] - 2026-10-17

### Added

- Added a task-first mobile home order with an optional sites-first preference in Component Layout.
- Added a concise product-purpose introduction to first-run onboarding and a replayable guide under About & Support.

### Changed

- Limited the initial mobile shortcut view to four sites with an explicit expand action.
- Moved shortcuts below the configurable work widgets in the default phone layout while keeping the desktop layout unchanged.
- Replaced the desktop brand subtitle with the clearer “个人效率桌面” positioning.

### Verified

- Passed 44 test files / 160 tests, TypeScript checks, the production build, PWA/SEO validation, and desktop plus 390 × 844 mobile browser checks.

## [0.4.3] - 2026-10-16

### Fixed

- Prevented the static SEO product introduction from flashing before the React desktop on JavaScript-capable browsers, while retaining the full no-JavaScript page and restoring it automatically when the application bundle cannot take over.
- Advanced the PWA shell cache so the new startup document and hashed runtime assets replace the previous cached shell cleanly.

### Verified

- Passed 44 test files / 159 tests, TypeScript checks, the production build, SEO and PWA validators, plus browser checks for the guarded first paint, five-second failure fallback, normal React takeover and a clean console.

## [0.4.1] - 2026-10-16

### Fixed

- Added a direct “退出账号” action for signed-in users. It clears the shared WyanHub login session, returns to the local desktop, and keeps browser-local desktop data intact.

## [0.4.0] - 2026-10-16

### Added

- Added a unified WyanHub assistant with product knowledge, task-aware model routing, optional web search, cited sources, answer feedback, quota visibility, and a compact production-ready drawer experience.
- Added new-user desktop defaults, PWA install/update surfaces, weather, local clipboard and countdown widgets, category navigation, aligned clocks, and clearer local-to-cloud conflict actions.
- Added a complete install surface for Chromium and Android plus accurate Safari Add to Home Screen guidance for iPhone and iPad, without requesting device folder access.
- Added build-time injection and validation of the actual hashed runtime assets required for first-session offline reopening.

### Changed

- PWA updates now wait for user confirmation, show a non-blocking update notice, and reload only after the waiting worker is explicitly activated.
- The footer reports offline local persistence, while Settings distinguishes a registered worker from a page that is actually under Service Worker control.
- Desktop work cards in the same grid row now stretch to a shared height with a tighter 12px rhythm. Expanding a left-column card keeps it in the first left slot, while expanding a right-column card keeps it in the first right slot; surrounding cards pack around the primary card without changing the saved order.
- Widget width editing now exposes only the two layouts that are visually distinct in the stable two-column grid: single column and full row. Older saved medium-width values remain readable as full-row cards.

### Fixed

- Matched same-origin precached assets independently of `Vary: Origin`, so install-time cache entries are reused by module and stylesheet requests while offline.
- Kept `/api/*` outside the app-shell fallback in both the Service Worker and bundled Nginx configuration.

### Verified

- Passed first-controlled-session offline reopen checks on 1280px desktop and 390px iPhone emulation, iOS install-copy and overflow checks, a real waiting-worker update from cache v8 to v9, the PWA artifact validator, the complete test suite, TypeScript, production build, and extension validation.
- Passed 41 test files / 150 tests, TypeScript checks, production and extension builds, PWA and extension validators, the layout detector, 320/390px phone, 768px tablet, 1200px mid-screen, 1920px desktop, and 2560px wide-screen layout reviews, plus left/right expansion, long-content, sparse, mixed-size, and edit-mode checks.

## [0.3.2] - 2026-10-14

### Added

- Added an always-available height toggle to work widgets. One card at a time is promoted into a three-row primary slot without changing the saved widget order, its lists or note editor use the added space, and compact screens keep a natural single-column flow.

## [0.3.1] - 2026-10-13

### Added

- Added a distinct mobile login/account control in the compact header while keeping the full-screen lock action available from Settings.
- Added static Open Graph and Twitter metadata for link previews.

### Verified

- Passed 32 test files / 99 tests, TypeScript checks, the production build, and 390px/1280px visual checks.

## [0.3.0] - 2026-10-12

### Added

- Added optional browser-side AES-256-GCM end-to-end encryption for cloud sync, with a session-only passphrase and encrypted revision/conflict handling.
- Added extension capture targets for sites, tasks, and notes, plus local window-session save, restore, and deletion.
- Added a store-submission checklist, permission justifications, deterministic package validation, and SHA-256 package output.

### Changed

- Raised the compatible Desk API state envelope limit to 8 MB so encrypted payload overhead does not reduce usable desktop data.

### Verified

- Added encryption round-trip, wrong-password, extension-capture idempotency, and server-side encrypted-envelope validation tests.

## [0.2.14] - 2026-10-12

### Added

- Added an on-demand category website check with bounded concurrency, timeout handling, per-site reachability states, progress, and a clear browser-only monitoring boundary.

### Changed

- Deleting a category now explicitly confirms the number of contained websites and removes them instead of silently moving them into a neighboring category.
- Removing category websites also clears stale recent-use entries and website-group references.

### Verified

- Passed 30 test files / 95 tests, TypeScript checks, the production frontend build, and live browser checks for category deletion confirmation and completed group reachability results.

## [0.2.13] - 2026-10-12

### Changed

- Added privacy-limited page/click/engagement analytics through the same-origin WyanHub endpoint.
- Routed signed-in feedback to the unified WyanHub feedback center, while retaining the legacy Desk API fallback for older or self-hosted deployments.
- Added signed, metadata-only central operation auditing to Desk API without changing local-first desktop storage.

### Verified

- Passed the full Desk test suite, TypeScript production build, shared identity/audit SDK tests, and production authorization-boundary checks.

## [0.2.12] - 2026-10-10

### Changed

- Unified modal and drawer behavior so Escape closes only the top layer, Tab focus stays inside, page scrolling is locked, and focus returns to the control that opened the layer.
- Added outside-click dismissal and complete arrow/Home/End/Escape keyboard navigation to the desktop and application switchers.
- Increased compact-screen touch targets and tightened 320–390px behavior without introducing horizontal overflow.
- Hardened the service worker so API requests bypass the shell cache and only failed page navigations can fall back to `index.html`.

### Fixed

- Kept the desktop and application switchers above search, recent-work, and card surfaces, with bounded scrolling on short viewports instead of clipped or covered content.

### Verified

- Passed keyboard/focus browser flows, 320px and 390px responsive geometry checks, TypeScript checks, 29 test files / 91 tests, and the production frontend build.

## [0.2.11] - 2026-10-10

### Changed

- Added a queued, sound-backed center alert for reminders while WyanDesk is visible, with acknowledgement and five-minute snooze actions; background tabs continue to use optional browser notifications.
- Refined the desktop visual hierarchy with calmer panel shadows, clearer text contrast, quieter nested items, a unified header control group, intentional empty states, and a centered recent-work dock that shows all six retained items without disturbing the two-column baseline.
- Replaced fractional whole-page zoom on high-resolution displays with native responsive shell widths, rail proportions, typography tiers, and clock/search sizing for crisper text, icons, and one-pixel borders.

### Verified

- Passed TypeScript checks, 27 test files / 87 tests, the production frontend build, reminder firing at desktop and 390px mobile sizes, and responsive geometry checks through 3200px, including Windows-like 125% and 150% viewports.

## [0.2.10] - 2026-10-09

### Fixed

- Rebuilt the downloadable Chrome / Edge extension so the website, public release source, and bundled extension all contain the same current desktop features and version.

### Verified

- Passed TypeScript checks, 25 test files / 85 tests, the production frontend build, and extension packaging; the packaged extension reports version 0.2.10.

## [0.2.9] - 2026-10-09

### Added

- Added an optional world-clock widget for up to five selected cities. It is hidden by default, participates in the existing size and drag-order system, and uses only the browser's local IANA time-zone data.
- Added an optional daily-overview widget that summarizes existing tasks, today's schedule, the next reminder, and the current focus task without introducing another data-entry flow.
- Added opt-in month-calendar and quick-calculator widgets, custom reminders, task creation dialog, and configurable 1–240 minute focus sessions.

### Changed

- Refined the desktop component settings into a compact two-column layout with visibility, ordering, configuration, and a prominent layout-editing entry.
- Improved pointer-following component reordering, responsive card sizing, and default task-first widget placement without changing existing user content.

### Verified

- Passed TypeScript checks, 25 test files / 85 tests, the production frontend build, and local browser checks for optional component settings and rendering.

## [0.2.8] - 2026-10-09

### Changed

- Lock-screen activity stays silent after unlock instead of opening an automatic report.
- Activity history remains available on demand from Settings → Desktop lock → View records, with the same local-only privacy boundary and clear-history action.

### Verified

- Passed TypeScript checks, 19 test files / 72 tests, the production frontend build, and a browser flow covering lock activity, unlock without a modal, and explicit history opening.

## [0.2.7] - 2026-10-09

### Changed

- Improved desktop readability with centered density scaling for 1920px, 2K, and larger displays while preserving 1440px and mobile layouts.
- Added the official ICP filing number and MIIT link to the standard desktop footer without changing the privacy lock screen.

### Verified

- Checked the desktop, settings drawer, command palette, add-site modal, and lock screen across 390px, 1440px, 1920px, 2560px, and 3200px viewports.
- Passed TypeScript checks, 71 unit tests, and the production frontend build.

## [0.2.5-beta] - 2026-10-07

First public beta release.

### Added

- Local-first multi-workspace desktop with categorized websites and website groups.
- Browser bookmark, ICS, desktop backup, and privacy-safe template import/export.
- Optional Chrome / Edge new-tab extension with direct bookmark migration.
- Tasks, schedules, notes, configurable focus timer, reminders, and time events.
- Full-screen lock screen with optional PIN and local-only activity summaries.
- Adjustable widget dimensions and main-content proportions.
- Four switchable scene backgrounds, including a neon technology style.
- Optional official-site sync, conflict handling, history restore, feedback, and cloud-data deletion.

### Privacy

- No advertising or third-party behavioral analytics.
- Browser permissions are requested only when the related feature is used.
- Local data remains usable without an account or backend service.
