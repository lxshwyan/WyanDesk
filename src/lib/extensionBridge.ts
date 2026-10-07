import type { DeskState, DeskWorkspace, Shortcut } from '../types';

const SUMMARY_KEY = 'wyandesk.extension.summary';
const CAPTURE_KEY = 'wyandesk.extension.captures';

export interface ExtensionSummary {
  version: 1;
  activeWorkspaceId: string;
  workspaces: Array<{
    id: string;
    name: string;
    categories: string[];
    shortcuts: Array<{ id: string; title: string; url: string; category: string }>;
  }>;
}

export interface ExtensionCaptureItem {
  id: string;
  title: string;
  url: string;
  workspaceId: string;
  category: string;
}

export interface ExtensionCaptureGroup {
  id: string;
  title: string;
  workspaceId: string;
  category: string;
  tabs: Array<{ title: string; url: string }>;
}

export interface ExtensionBookmarkBatch {
  id: string;
  workspaceId: string;
  entries: Array<{ title: string; url: string; category: string }>;
}

export interface ExtensionCaptureQueue {
  version: 1;
  items: ExtensionCaptureItem[];
  groups: ExtensionCaptureGroup[];
  bookmarks: ExtensionBookmarkBatch[];
}

interface ChromeStorageArea {
  get: (key: string) => Promise<Record<string, unknown>>;
  set: (items: Record<string, unknown>) => Promise<void>;
}

interface ChromeLike {
  storage?: {
    local: ChromeStorageArea;
    onChanged: {
      addListener: (listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void) => void;
      removeListener: (listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void) => void;
    };
  };
}

function chromeAPI(): ChromeLike | undefined {
  return (globalThis as unknown as { chrome?: ChromeLike }).chrome;
}

export function isExtensionRuntime(): boolean {
  return window.location.protocol === 'chrome-extension:' && Boolean(chromeAPI()?.storage?.local);
}

export async function publishExtensionSummary(state: DeskState): Promise<void> {
  const storage = chromeAPI()?.storage?.local;
  if (!isExtensionRuntime() || !storage) return;
  const summary: ExtensionSummary = {
    version: 1,
    activeWorkspaceId: state.activeWorkspaceId,
    workspaces: state.workspaces.map((workspace) => ({
      id: workspace.id,
      name: workspace.name,
      categories: workspace.categories,
      shortcuts: workspace.shortcuts.map((shortcut) => ({
        id: shortcut.id,
        title: shortcut.title,
        url: shortcut.url,
        category: shortcut.category,
      })),
    })),
  };
  await storage.set({ [SUMMARY_KEY]: summary });
}

function validQueue(value: unknown): ExtensionCaptureQueue | null {
  if (!value || typeof value !== 'object') return null;
  const queue = value as Partial<ExtensionCaptureQueue>;
  if (!Array.isArray(queue.items) || !Array.isArray(queue.groups)) return null;
  return {
    version: 1,
    items: queue.items,
    groups: queue.groups,
    bookmarks: Array.isArray(queue.bookmarks) ? queue.bookmarks : [],
  };
}

export function subscribeExtensionCaptures(handler: (queue: ExtensionCaptureQueue) => void): () => void {
  const api = chromeAPI()?.storage;
  if (!isExtensionRuntime() || !api) return () => undefined;
  let active = true;
  const deliver = (value: unknown) => {
    const queue = validQueue(value);
    if (active && queue) handler(queue);
  };
  const listener = (changes: Record<string, { newValue?: unknown }>, areaName: string) => {
    if (areaName === 'local' && changes[CAPTURE_KEY]) deliver(changes[CAPTURE_KEY].newValue);
  };
  api.onChanged.addListener(listener);
  void api.local.get(CAPTURE_KEY).then((result) => deliver(result[CAPTURE_KEY]));
  return () => {
    active = false;
    api.onChanged.removeListener(listener);
  };
}

function normalized(value: string): string {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol)) return '';
    url.hash = '';
    return url.toString();
  } catch {
    return '';
  }
}

function shortcutFor(id: string, title: string, url: string, category: string): Shortcut {
  const cleanTitle = title.trim().slice(0, 50) || new URL(url).hostname;
  return {
    id,
    title: cleanTitle,
    url,
    category,
    icon: cleanTitle.slice(0, 2),
    accent: '#3478f6',
    description: '浏览器扩展收藏',
  };
}

function addCategory(workspace: DeskWorkspace, category: string): DeskWorkspace {
  return workspace.categories.includes(category) ? workspace : { ...workspace, categories: [...workspace.categories, category] };
}

export function applyExtensionCaptures(state: DeskState, queue: ExtensionCaptureQueue): { state: DeskState; addedSites: number; addedGroups: number } {
  let addedSites = 0;
  let addedGroups = 0;
  const workspaces = state.workspaces.map((workspace) => {
    let next = workspace;
    const captures = queue.items.filter((item) => item.workspaceId === workspace.id);
    for (const item of captures) {
      const url = normalized(item.url);
      if (!url || next.shortcuts.some((shortcut) => normalized(shortcut.url) === url)) continue;
      const category = item.category.trim().slice(0, 16) || next.categories[0] || '常用';
      next = addCategory(next, category);
      next = { ...next, shortcuts: [...next.shortcuts, shortcutFor(`extension-${item.id}`, item.title, url, category)] };
      addedSites += 1;
    }

    const groups = queue.groups.filter((group) => group.workspaceId === workspace.id);
    for (const group of groups) {
      const groupId = `extension-group-${group.id}`;
      if (next.shortcutGroups.some((item) => item.id === groupId)) continue;
      const category = group.category.trim().slice(0, 16) || next.categories[0] || '常用';
      next = addCategory(next, category);
      const shortcutIds: string[] = [];
      group.tabs.forEach((tab, index) => {
        const url = normalized(tab.url);
        if (!url) return;
        const existing = next.shortcuts.find((shortcut) => normalized(shortcut.url) === url);
        if (existing) {
          shortcutIds.push(existing.id);
          return;
        }
        const shortcut = shortcutFor(`extension-${group.id}-${index}`, tab.title, url, category);
        next = { ...next, shortcuts: [...next.shortcuts, shortcut] };
        shortcutIds.push(shortcut.id);
        addedSites += 1;
      });
      if (!shortcutIds.length) continue;
      next = { ...next, shortcutGroups: [...next.shortcutGroups, { id: groupId, title: group.title.trim().slice(0, 30) || '浏览器窗口', shortcutIds }] };
      addedGroups += 1;
    }

    const bookmarkBatches = queue.bookmarks.filter((batch) => batch.workspaceId === workspace.id);
    for (const batch of bookmarkBatches) {
      batch.entries.forEach((entry, index) => {
        const url = normalized(entry.url);
        if (!url || next.shortcuts.some((shortcut) => normalized(shortcut.url) === url)) return;
        const category = entry.category.trim().slice(0, 16) || next.categories[0] || '常用';
        next = addCategory(next, category);
        next = {
          ...next,
          shortcuts: [...next.shortcuts, shortcutFor(`extension-bookmark-${batch.id}-${index}`, entry.title, url, category)],
        };
        addedSites += 1;
      });
    }
    return next;
  });
  return { state: { ...state, workspaces }, addedSites, addedGroups };
}
