import type { BlockBackground, DeskPreferences, DeskRailWidgetId, DeskState, DeskWidgetId, SceneId, WallpaperView } from '../types';
import { currentDesktopMode, type DesktopMode } from './desktopMode';
import { normalizeWallpaperPreferences } from './wallpapers';

export function normalizeWallpaperView(value: unknown): WallpaperView {
  const record = value && typeof value === 'object' ? value as Partial<WallpaperView> : {};
  const range = (number: unknown, fallback: number, max: number) => typeof number === 'number' && Number.isFinite(number) ? Math.max(0, Math.min(max, number)) : fallback;
  return { x: range(record.x, 50, 100), y: range(record.y, 50, 100), tone: record.tone === 'dark' ? 'dark' : 'light', strength: range(record.strength, 10, 30) };
}
const visibility = ['showQuickActions', 'showSchedule', 'showFocusTimer', 'showReminders', 'showTasks', 'showNotes', 'showCalendar', 'showCalculator', 'showWorldClock', 'showDailyOverview', 'showWeather', 'showClipboard', 'showCountdown', 'showConverter'] as const;
const widgetVisibility: Record<Exclude<DeskRailWidgetId, `note:${string}`>, typeof visibility[number]> = {
  quickActions: 'showQuickActions', schedule: 'showSchedule', focus: 'showFocusTimer', reminders: 'showReminders', tasks: 'showTasks', notes: 'showNotes', calendar: 'showCalendar', calculator: 'showCalculator', worldClock: 'showWorldClock', dailyOverview: 'showDailyOverview', weather: 'showWeather', clipboard: 'showClipboard', countdown: 'showCountdown', converter: 'showConverter',
};
export interface AppearanceSelection {
  workspaceId: string;
  mode: DesktopMode;
  baseMode: Exclude<DesktopMode, 'minimal'>;
  preferences: Pick<DeskPreferences, 'scene' | 'customBackground' | 'transparentAppearance' | 'wallpaper' | 'wallpaperView'> & Partial<Pick<DeskPreferences, typeof visibility[number]>>;
  widgetOrder: DeskRailWidgetId[];
  backgrounds: Partial<Record<DeskWidgetId, BlockBackground | undefined>>;
  categoryBackgrounds?: Record<string, BlockBackground>;
}
export function captureAppearance(state: DeskState): AppearanceSelection {
  const workspace = state.workspaces.find((item) => item.id === state.activeWorkspaceId) || state.workspaces[0];
  return { workspaceId: workspace.id, mode: currentDesktopMode(state), baseMode: workspace.shortcutStyle === 'icons' ? 'icons' : workspace.viewMode === 'navigation' ? 'navigation' : 'work', preferences: {
    scene: state.preferences.scene, customBackground: state.preferences.customBackground, transparentAppearance: state.preferences.transparentAppearance,
    wallpaper: state.preferences.wallpaper, wallpaperView: state.preferences.wallpaperView,
    ...Object.fromEntries(visibility.map((key) => [key, state.preferences[key]])),
  }, widgetOrder: [...workspace.layout.widgetOrder], backgrounds: Object.fromEntries(Object.entries(workspace.layout.widgets).map(([key, size]) => [key, size.background])), categoryBackgrounds: workspace.categoryBackgrounds };
}
export const appearancePresets = [
  { id: 'daily', name: '日常导航', detail: '图标 · 日常', mode: 'icons', scene: 'night', widgets: ['dailyOverview', 'quickActions', 'notes', 'calendar'] },
  { id: 'study', name: '学习专注', detail: '卡片 · 专注', mode: 'work', scene: 'ocean', widgets: ['focus', 'dailyOverview', 'notes', 'calendar'] },
  { id: 'clear', name: '清透壁纸', detail: '轻导航 · 壁纸', mode: 'navigation', scene: 'night', widgets: [] },
] as const;
export function selectAppearancePreset(state: DeskState, id: typeof appearancePresets[number]['id']): AppearanceSelection {
  const current = captureAppearance(state); const preset = appearancePresets.find((item) => item.id === id)!;
  const shown: readonly string[] = preset.widgets;
  const preferences = { ...current.preferences, scene: preset.scene as SceneId, customBackground: '', transparentAppearance: id === 'clear', wallpaperView: normalizeWallpaperView(undefined),
    wallpaper: { ...normalizeWallpaperPreferences(current.preferences.wallpaper), selectedId: id === 'clear' ? 'alpine-lake' : '', daily: false },
    ...Object.fromEntries(Object.entries(widgetVisibility).map(([widget, preference]) => [preference, shown.includes(widget)])),
  };
  // Independent notes and their visibility remain user-owned; only built-in display choices are preset.
  return { ...current, mode: preset.mode, baseMode: preset.mode, preferences,
    widgetOrder: [...preset.widgets, ...current.widgetOrder.filter((widget) => !shown.includes(widget))],
    backgrounds: id === 'clear' ? current.backgrounds : Object.fromEntries(Object.keys(current.backgrounds).map((widget) => [widget, { gradient: widget === 'focus' ? 'blue' : widget === 'notes' ? 'apricot' : 'silver' }])),
    categoryBackgrounds: id === 'clear' ? current.categoryBackgrounds : Object.fromEntries((state.workspaces.find((item) => item.id === current.workspaceId)?.categories || []).map((category) => [category, { gradient: 'silver' }])),
  };
}
export function applyAppearanceSelection(state: DeskState, selection: AppearanceSelection): DeskState {
  return { ...state, preferences: { ...state.preferences, ...selection.preferences, minimalMode: selection.mode === 'minimal' },
    workspaces: state.workspaces.map((workspace) => workspace.id !== selection.workspaceId ? workspace : { ...workspace,
      viewMode: (selection.mode === 'minimal' ? selection.baseMode : selection.mode) === 'navigation' ? 'navigation' : 'work', shortcutStyle: (selection.mode === 'minimal' ? selection.baseMode : selection.mode) === 'icons' ? 'icons' : 'cards',
      categoryBackgrounds: selection.categoryBackgrounds,
      layout: { ...workspace.layout, widgetOrder: [...selection.widgetOrder.filter((id) => workspace.layout.widgetOrder.includes(id)), ...workspace.layout.widgetOrder.filter((id) => !selection.widgetOrder.includes(id))],
        widgets: Object.fromEntries(Object.entries(workspace.layout.widgets).map(([id, size]) => [id, Object.hasOwn(selection.backgrounds, id) ? { ...size, background: selection.backgrounds[id as DeskWidgetId] } : size])) as typeof workspace.layout.widgets },
    }),
  };
}
