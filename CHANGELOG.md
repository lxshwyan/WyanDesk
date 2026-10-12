# Changelog

All notable changes to WyanDesk are documented here.

## [Unreleased]

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
