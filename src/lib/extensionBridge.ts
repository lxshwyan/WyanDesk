import type { DeskState, DeskWorkspace, Shortcut } from '../types';
import { readingURL } from './readingList';

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
    shortcutGroups: Array<{ id: string; title: string; shortcutIds: string[] }>;
  }>;
}

export interface ExtensionCaptureItem {
  id: string;
  kind?: 'link' | 'task' | 'note' | 'reading';
  excerpt?: string;
  title: string;
  url: string;
  workspaceId: string;
  category: string;
}

export interface ExtensionCaptureGroup {
  id: string;
  title: string;
  targetGroupId?: string;
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
  runtime?: { sendMessage: (message: unknown) => Promise<unknown> };
  storage?: {
    local: ChromeStorageArea;
    onChanged: {
      addListener: (listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void) => void;
      removeListener: (listener: (changes: Record<string, { newValue?: unknown }>, areaName: string) => void) => void;
    };
  };
}

export async function acknowledgeExtensionCaptures(queue: ExtensionCaptureQueue): Promise<void> {
  const runtime = chromeAPI()?.runtime;
  if (!isExtensionRuntime() || !runtime) return;
  await runtime.sendMessage({ type: 'capture.ack', ids: {
    items: queue.items.map((item) => item.id),
    groups: queue.groups.map((item) => item.id),
    bookmarks: queue.bookmarks.map((item) => item.id),
  } });
}

function chromeAPI(): ChromeLike | undefined {
  return (globalThis as unknown as { chrome?: ChromeLike }).chrome;
}

export function isExtensionRuntime(): boolean {
  return globalThis.location?.protocol === 'chrome-extension:' && Boolean(chromeAPI()?.storage?.local);
}

export function deskHomeURL(): string {
  return isExtensionRuntime() ? './index.html' : '/';
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
      shortcutGroups: workspace.shortcutGroups.map((group) => ({
        id: group.id,
        title: group.title,
        shortcutIds: group.shortcutIds,
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
    if (active && queue && (queue.items.length || queue.groups.length || queue.bookmarks.length)) handler(queue);
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
    if (!/^#(?:\/|!\/)/.test(url.hash)) url.hash = '';
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

export function applyExtensionCaptures(state: DeskState, queue: ExtensionCaptureQueue): { state: DeskState; addedSites: number; addedGroups: number; updatedGroups: number; addedTasks: number; addedNotes: number; addedReadings: number } {
  let addedSites = 0;
  let addedGroups = 0;
  let addedReadings = 0;
  const inbox = [...state.inbox];
  const workspaceIds = new Set(state.workspaces.map((item) => item.id));
  for (const item of queue.items) {
    if (item.kind !== 'reading' || !workspaceIds.has(item.workspaceId)) continue;
    const url = readingURL(item.url);
    if (!url) continue;
    const id = `extension-reading-${item.id}`;
    if (inbox.some((entry) => entry.id === id)) continue;
    const excerpt = typeof item.excerpt === 'string' ? item.excerpt.trim().slice(0, 2000) : '';
    const existingIndex = inbox.findIndex((entry) => entry.kind === 'link' && entry.url === url && (entry.excerpt || '') === excerpt);
    if (existingIndex >= 0) {
      if (inbox[existingIndex].readAt) { inbox[existingIndex] = { ...inbox[existingIndex], readAt: undefined }; addedReadings++; }
      continue;
    }
    inbox.unshift({ id, kind: 'link', content: item.title.trim().slice(0, 500) || new URL(url).hostname, url, createdAt: new Date().toISOString(), ...(excerpt ? { excerpt } : {}) });
    addedReadings++;
  }
	let updatedGroups = 0;
	let addedTasks = 0;
	let addedNotes = 0;
  const workspaces = state.workspaces.map((workspace) => {
    let next = workspace;
    const captures = queue.items.filter((item) => item.workspaceId === workspace.id);
    for (const item of captures) {
      if (item.kind === 'reading') continue;
      const url = normalized(item.url);
		if (!url) continue;
		if (item.kind === 'task') {
			const taskID = `extension-task-${item.id}`;
			if (next.tasks.some((task) => task.id === taskID)) continue;
			const text = `${item.title.trim().slice(0, 120) || new URL(url).hostname} — ${url}`;
			next = { ...next, tasks: [{ id: taskID, text, done: false, createdAt: new Date().toISOString() }, ...next.tasks] };
			addedTasks += 1;
			continue;
		}
		if (item.kind === 'note') {
			if (next.note.includes(url)) continue;
			const note = `${item.title.trim().slice(0, 120) || new URL(url).hostname}\n${url}`;
			next = { ...next, note: [next.note.trim(), note].filter(Boolean).join('\n\n') };
			addedNotes += 1;
			continue;
		}
		if (next.shortcuts.some((shortcut) => normalized(shortcut.url) === url)) continue;
      const category = item.category.trim().slice(0, 16) || next.categories[0] || '常用';
      next = addCategory(next, category);
      next = { ...next, shortcuts: [...next.shortcuts, shortcutFor(`extension-${item.id}`, item.title, url, category)] };
      addedSites += 1;
    }

    const groups = queue.groups.filter((group) => group.workspaceId === workspace.id);
    for (const group of groups) {
      const groupId = `extension-group-${group.id}`;
      const targetGroup = group.targetGroupId ? next.shortcutGroups.find((item) => item.id === group.targetGroupId) : undefined;
      if (!targetGroup && next.shortcutGroups.some((item) => item.id === groupId)) continue;
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
      if (targetGroup) {
        const mergedIds = [...new Set([...targetGroup.shortcutIds, ...shortcutIds])];
        if (mergedIds.length !== targetGroup.shortcutIds.length) {
          next = {
            ...next,
            shortcutGroups: next.shortcutGroups.map((item) => item.id === targetGroup.id ? { ...item, shortcutIds: mergedIds } : item),
          };
          updatedGroups += 1;
        }
        continue;
      }
      next = { ...next, shortcutGroups: [...next.shortcutGroups, { id: groupId, title: group.title.trim().slice(0, 30) || '浏览器窗口', shortcutIds }] };
      addedGroups += 1;
    }

    const bookmarkBatches = queue.bookmarks.filter((batch) => batch.workspaceId === workspace.id);
    const knownURLs = new Set(next.shortcuts.map((shortcut) => normalized(shortcut.url)));
    for (const batch of bookmarkBatches) {
      const additions: Shortcut[] = [];
      batch.entries.forEach((entry, index) => {
        const url = normalized(entry.url);
        if (!url || knownURLs.has(url)) return;
        knownURLs.add(url);
        const category = entry.category.trim().slice(0, 16) || next.categories[0] || '常用';
        next = addCategory(next, category);
        additions.push(shortcutFor(`extension-bookmark-${batch.id}-${index}`, entry.title, url, category));
        addedSites += 1;
      });
      if (additions.length) next = { ...next, shortcuts: [...next.shortcuts, ...additions] };
    }
    return next;
  });
  return { state: { ...state, workspaces, inbox }, addedSites, addedGroups, updatedGroups, addedTasks, addedNotes, addedReadings };
}
