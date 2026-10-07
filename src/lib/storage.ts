import { categoryOrder, createDefaultState, defaultShortcuts } from '../data/defaults';
import type { DeskInboxItem, DeskState, DeskWorkspace, Shortcut, ShortcutGroup } from '../types';
import { createBlankWorkspace } from './workspaces';
import { normalizeFocusMinutes } from './focusTimer';
import { normalizeTimeEvents } from './timeEvents';
import { normalizeWorkspaceLayout } from './widgetLayout';

const STORAGE_KEY = 'wyandesk.state.v1';
const RECOVERY_KEY = 'wyandesk.state.recovery.v1';

export interface DeskStateReadResult {
  state: DeskState;
  recovered: boolean;
  isNew: boolean;
}

type SavedWorkspace = Partial<Omit<DeskWorkspace, 'id' | 'name'>> & {
  id?: unknown;
  name?: unknown;
  version?: number;
};

type SavedDeskState = Partial<Omit<DeskState, 'version' | 'workspaces' | 'activeWorkspaceId'>> & SavedWorkspace & {
  version?: number;
  activeWorkspaceId?: unknown;
  workspaces?: unknown;
};

interface DeskBackup {
  product: 'WyanDesk';
  exportedAt: string;
  state: DeskState;
}

function migrateShortcuts(saved: SavedWorkspace, defaults: DeskWorkspace): Shortcut[] {
  if (!Array.isArray(saved.shortcuts)) return defaults.shortcuts.map((shortcut) => ({ ...shortcut }));
  if ((saved.version || 0) >= 2) return saved.shortcuts;

  const current = saved.shortcuts.map((shortcut) => {
    if (shortcut.id === 'chatgpt' || shortcut.id === 'deepseek') return { ...shortcut, category: 'AI' };
    return shortcut;
  });
  const existingIds = new Set(current.map((shortcut) => shortcut.id));
  const introducedInV2 = new Set(['kimi', 'doubao', 'wecom', 'tencent-meeting', 'zoom', 'aliyun-drive', 'baidu-pan', 'quark-drive']);
  const additions = defaultShortcuts.filter((shortcut) => introducedInV2.has(shortcut.id) && !existingIds.has(shortcut.id));
  return [...current, ...additions.map((shortcut) => ({ ...shortcut }))];
}

export function categoriesFromShortcuts(shortcuts: Shortcut[], preferredOrder: string[] = categoryOrder): string[] {
  const present = new Set(shortcuts.map((shortcut) => shortcut.category.trim()).filter(Boolean));
  const categories = preferredOrder.filter((category) => present.has(category));
  for (const shortcut of shortcuts) {
    const category = shortcut.category.trim();
    if (category && !categories.includes(category)) categories.push(category);
  }
  return categories.length ? categories : ['常用'];
}

function migrateCategories(saved: SavedWorkspace, shortcuts: Shortcut[]): string[] {
  const categories: string[] = [];
  if ((saved.version || 0) >= 3 && Array.isArray(saved.categories)) {
    for (const value of saved.categories) {
      const category = typeof value === 'string' ? value.trim() : '';
      if (category && !categories.includes(category)) categories.push(category);
    }
  } else {
    categories.push(...categoriesFromShortcuts(shortcuts));
  }
  for (const shortcut of shortcuts) {
    const category = shortcut.category.trim();
    if (category && !categories.includes(category)) categories.push(category);
  }
  return categories.length ? categories : ['常用'];
}

function migrateShortcutGroups(saved: SavedWorkspace, shortcuts: Shortcut[]): ShortcutGroup[] {
  if (!Array.isArray(saved.shortcutGroups)) return [];
  const shortcutIds = new Set(shortcuts.map((shortcut) => shortcut.id));
  const seenIds = new Set<string>();
  const groups: ShortcutGroup[] = [];
  for (const value of saved.shortcutGroups as unknown[]) {
    if (!value || typeof value !== 'object') continue;
    const record = value as Record<string, unknown>;
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    const title = typeof record.title === 'string' ? record.title.trim().slice(0, 30) : '';
    if (!id || !title || seenIds.has(id)) continue;
    const ids = Array.isArray(record.shortcutIds)
      ? record.shortcutIds.filter((item): item is string => typeof item === 'string' && shortcutIds.has(item))
      : [];
    groups.push({ id, title, shortcutIds: [...new Set(ids)] });
    seenIds.add(id);
  }
  return groups;
}

function migrateWorkspace(saved: SavedWorkspace, defaults: DeskWorkspace, id: string, name: string): DeskWorkspace {
  const shortcuts = migrateShortcuts(saved, defaults);
  const tasks = Array.isArray(saved.tasks) ? saved.tasks : defaults.tasks.map((task) => ({ ...task }));
  const focusTaskId = typeof saved.focusTaskId === 'string' && tasks.some((task) => task.id === saved.focusTaskId && !task.done)
    ? saved.focusTaskId
    : '';
  return {
    id,
    name,
    categories: migrateCategories(saved, shortcuts),
    shortcuts,
    shortcutGroups: migrateShortcutGroups(saved, shortcuts),
    tasks,
    focusTaskId,
    note: typeof saved.note === 'string' ? saved.note : defaults.note,
    events: Array.isArray(saved.events) ? saved.events : defaults.events.map((event) => ({ ...event })),
    recentShortcutIds: Array.isArray(saved.recentShortcutIds)
      ? saved.recentShortcutIds.filter((item): item is string => typeof item === 'string').slice(0, 6)
      : [...defaults.recentShortcutIds],
    layout: normalizeWorkspaceLayout(saved.layout),
  };
}

function migrateCurrentWorkspaces(saved: SavedDeskState, defaults: DeskState): DeskWorkspace[] {
  if (!Array.isArray(saved.workspaces)) return [];
  const seenIds = new Set<string>();
  const workspaces: DeskWorkspace[] = [];
  saved.workspaces.forEach((value, index) => {
    if (!value || typeof value !== 'object') return;
    const record = value as SavedWorkspace;
    const rawId = typeof record.id === 'string' ? record.id.trim() : '';
    let id = rawId && !seenIds.has(rawId) ? rawId : `workspace-${index + 1}`;
    while (seenIds.has(id)) id = `${id}-copy`;
    const rawName = typeof record.name === 'string' ? record.name.trim().replace(/\s+/g, ' ').slice(0, 12) : '';
    const fallback = createBlankWorkspace(id, rawName || `桌面 ${workspaces.length + 1}`);
    workspaces.push(migrateWorkspace({ ...record, version: 8 }, fallback, id, rawName || fallback.name));
    seenIds.add(id);
  });
  return workspaces.length ? workspaces : defaults.workspaces;
}

export function migrateDeskState(value: unknown): DeskState {
  const defaults = createDefaultState();
  if (!value || typeof value !== 'object') return defaults;
  const saved = value as SavedDeskState;
  const isCurrent = (saved.version || 0) >= 5 && Array.isArray(saved.workspaces);
  const workspaces = isCurrent
    ? migrateCurrentWorkspaces(saved, defaults)
    : [migrateWorkspace(saved, defaults.workspaces[0], 'workspace-work', '工作')];
  const requestedActiveId = typeof saved.activeWorkspaceId === 'string' ? saved.activeWorkspaceId : '';
  const activeWorkspaceId = workspaces.some((workspace) => workspace.id === requestedActiveId)
    ? requestedActiveId
    : workspaces[0].id;
  const preferences = saved.preferences && typeof saved.preferences === 'object' ? saved.preferences : {};
  const legacy = (saved.version || 0) < 6;
  const inbox: DeskInboxItem[] = Array.isArray(saved.inbox)
    ? saved.inbox.flatMap((value) => {
      if (!value || typeof value !== 'object') return [];
      const item = value as Partial<DeskInboxItem>;
      const kind = item.kind === 'link' || item.kind === 'task' || item.kind === 'note' ? item.kind : null;
      const content = typeof item.content === 'string' ? item.content.trim().slice(0, 500) : '';
      if (!kind || !content || typeof item.id !== 'string') return [];
      return [{ id: item.id, kind, content, url: typeof item.url === 'string' ? item.url : undefined, createdAt: typeof item.createdAt === 'string' ? item.createdAt : new Date().toISOString() }];
    })
    : [];
  return {
    version: 8,
    activeWorkspaceId,
    workspaces,
    inbox,
    reminders: Array.isArray(saved.reminders) ? saved.reminders : defaults.reminders,
    timeEvents: normalizeTimeEvents(saved.timeEvents),
    preferences: {
      ...defaults.preferences,
      ...preferences,
      lockActivityEnabled: typeof (preferences as Partial<DeskState['preferences']>).lockActivityEnabled === 'boolean'
        ? (preferences as Partial<DeskState['preferences']>).lockActivityEnabled!
        : true,
      focusDurationMinutes: normalizeFocusMinutes((preferences as Partial<DeskState['preferences']>).focusDurationMinutes),
      lockMessage: typeof (preferences as Partial<DeskState['preferences']>).lockMessage === 'string'
        ? (preferences as Partial<DeskState['preferences']>).lockMessage!.slice(0, 48)
        : '',
      onboardingCompleted: legacy ? true : Boolean((preferences as Partial<DeskState['preferences']>).onboardingCompleted),
      productDiscoveryDismissed: legacy ? true : Boolean((preferences as Partial<DeskState['preferences']>).productDiscoveryDismissed),
    },
  };
}

export function readDeskStateWithStatus(): DeskStateReadResult {
  const recoveryAvailable = Boolean(window.localStorage.getItem(RECOVERY_KEY));
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return { state: createDefaultState(), recovered: recoveryAvailable, isNew: !recoveryAvailable };
  }
  try {
    return { state: migrateDeskState(JSON.parse(raw)), recovered: recoveryAvailable, isNew: false };
  } catch {
    try {
      window.localStorage.setItem(RECOVERY_KEY, raw);
    } catch {
      // Continue with a usable default state even if storage is already full.
    }
    return { state: createDefaultState(), recovered: true, isNew: false };
  }
}

export function readDeskState(): DeskState {
  return readDeskStateWithStatus().state;
}

export function readRecoverySnapshot(): string {
  return window.localStorage.getItem(RECOVERY_KEY) || '';
}

export function clearRecoverySnapshot(): void {
  window.localStorage.removeItem(RECOVERY_KEY);
}

export function writeDeskState(state: DeskState): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function clearDeskState(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function serializeDeskBackup(state: DeskState, exportedAt = new Date()): string {
  const backup: DeskBackup = {
    product: 'WyanDesk',
    exportedAt: exportedAt.toISOString(),
    state,
  };
  return JSON.stringify(backup, null, 2);
}

export function parseDeskBackup(value: string): DeskState {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('备份文件不是有效的 JSON');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('备份文件内容无效');
  const record = parsed as { product?: unknown; state?: unknown };
  const candidate = record.product === 'WyanDesk' ? record.state : parsed;
  if (!candidate || typeof candidate !== 'object') throw new Error('备份文件内容无效');
  const saved = candidate as Record<string, unknown>;
  const isCurrent = Array.isArray(saved.workspaces);
  const isLegacy = Array.isArray(saved.shortcuts) && Array.isArray(saved.tasks) && typeof saved.note === 'string';
  if (!isCurrent && !isLegacy) {
    throw new Error('不是可识别的 WyanDesk 备份');
  }
  return migrateDeskState(candidate);
}

export function normalizeURL(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const candidate = /^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  const parsed = new URL(candidate);
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('仅支持 HTTP 或 HTTPS 网址');
  return parsed.toString();
}
