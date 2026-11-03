import type { DeskWorkspace } from '../types';
import { DEFAULT_QUICK_ACTION_IDS } from './quickActions';
import { withRecommendedWidgetBackgrounds } from './blockBackground';
import { createDefaultWorkspaceLayout } from './widgetLayout';

export function cleanWorkspaceName(value: string): string {
  return value.trim().replace(/\s+/g, ' ').slice(0, 12);
}

export function createBlankWorkspace(id: string, name: string, appearance?: DeskWorkspace): DeskWorkspace {
  const base = withRecommendedWidgetBackgrounds(createDefaultWorkspaceLayout());
  const layout = appearance ? { ...base, railWidth: appearance.layout.railWidth, widgetOrder: appearance.layout.widgetOrder.filter((id) => !id.startsWith('note:')), widgets: Object.fromEntries(Object.entries(base.widgets).map(([id, size]) => [id, { ...size, ...appearance.layout.widgets[id as keyof typeof base.widgets], background: appearance.layout.widgets[id as keyof typeof base.widgets]?.background || size.background }])) as DeskWorkspace['layout']['widgets'] } : base;
  return {
    id,
    name: cleanWorkspaceName(name) || '新桌面',
    viewMode: appearance?.viewMode || 'work',
    shortcutStyle: appearance?.shortcutStyle || 'icons',
    categories: ['日用'],
    categoryBackgrounds: { 日用: appearance?.categoryBackgrounds?.[appearance.categories[0]] || { gradient: 'silver' } },
    shortcuts: [],
    shortcutGroups: [],
    quickActionIds: [...DEFAULT_QUICK_ACTION_IDS],
    tasks: [],
    focusTaskId: '',
    note: '',
    events: [],
    recentShortcutIds: [],
    layout,
  };
}

export function duplicateWorkspace(source: DeskWorkspace, id: string, name: string): DeskWorkspace {
  return {
    ...source,
    id,
    name: cleanWorkspaceName(name) || `${source.name}副本`.slice(0, 12),
    categories: [...source.categories],
    shortcuts: source.shortcuts.map((shortcut) => ({ ...shortcut })),
    shortcutGroups: source.shortcutGroups.map((group) => ({ ...group, shortcutIds: [...group.shortcutIds] })),
    quickActionIds: [...source.quickActionIds],
    noteCards: source.noteCards?.map((note) => ({ ...note })),
    tasks: source.tasks.map((task) => ({ ...task })),
    events: source.events.map((event) => ({ ...event })),
    recentShortcutIds: [...source.recentShortcutIds],
    layout: {
      ...source.layout,
      widgetOrder: [...source.layout.widgetOrder],
      widgets: Object.fromEntries(Object.entries(source.layout.widgets).map(([id, size]) => [id, { ...size }])) as DeskWorkspace['layout']['widgets'],
    },
  };
}

export function moveWorkspace(workspaces: DeskWorkspace[], id: string, direction: -1 | 1): DeskWorkspace[] {
  const index = workspaces.findIndex((workspace) => workspace.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= workspaces.length) return workspaces;
  const next = [...workspaces];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}
