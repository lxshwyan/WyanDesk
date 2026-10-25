import { SESSION_KEY, normalizeSessions, type SavedBrowserSession } from '../../extension/session-core.js';
import { isExtensionRuntime } from './extensionBridge';
import { readingURL } from './readingList';

export type { SavedBrowserSession };
export interface OpenBrowserTab { id: number; windowId: number; title: string; url: string; pinned?: boolean; active?: boolean }
interface BrowserAPI {
  permissions: { request: (options: { permissions: string[] }) => Promise<boolean> };
  runtime: { sendMessage: (value: unknown) => Promise<{ ok?: boolean; message?: string }> };
  tabs: {
    query: (options: { currentWindow: boolean }) => Promise<Array<Partial<OpenBrowserTab> & { incognito?: boolean }>>;
    get: (id: number) => Promise<{ windowId: number }>;
    create: (options: { windowId: number; url: string; pinned: boolean; active: boolean }) => Promise<{ id?: number }>;
    update: (id: number, options: { active?: boolean; pinned?: boolean }) => Promise<unknown>;
  };
  windows: { create: (options: { url: string; focused: boolean }) => Promise<{ id?: number; tabs?: Array<{ id?: number }> }>; update: (id: number, options: { focused: boolean }) => Promise<unknown> };
  storage: {
    local: { get: (key: string) => Promise<Record<string, unknown>> };
    onChanged: { addListener: (fn: (changes: Record<string, unknown>, area: string) => void) => void; removeListener: (fn: (changes: Record<string, unknown>, area: string) => void) => void };
  };
}
function browserAPI(): BrowserAPI {
  if (!isExtensionRuntime()) throw new Error('请在微言桌面扩展中使用窗口功能');
  return (globalThis as unknown as { chrome: BrowserAPI }).chrome;
}

export async function readOpenBrowserTabs(): Promise<OpenBrowserTab[]> {
  const api = browserAPI();
  // Call before any unrelated await to preserve Chrome's user-gesture boundary.
  if (!await api.permissions.request({ permissions: ['tabs'] })) throw new Error('未授权标签页权限；桌面搜索仍可使用');
  const tabs = await api.tabs.query({ currentWindow: true });
  return tabs.flatMap((tab) => {
    const url = readingURL(tab.url);
    if (!url || tab.incognito || typeof tab.id !== 'number' || typeof tab.windowId !== 'number') return [];
    return [{ id: tab.id, windowId: tab.windowId, url, title: tab.title || new URL(url).hostname, pinned: tab.pinned, active: tab.active }];
  });
}

export async function activateBrowserTab(tab: OpenBrowserTab): Promise<void> {
  const api = browserAPI();
  try {
    const current = await api.tabs.get(tab.id);
    await api.tabs.update(tab.id, { active: true });
    await api.windows.update(current.windowId, { focused: true });
  } catch { throw new Error('这个标签页已关闭或无法切换，请重新读取窗口标签'); }
}

export async function readBrowserSessions(): Promise<SavedBrowserSession[]> {
  const stored = await browserAPI().storage.local.get(SESSION_KEY);
  return normalizeSessions(stored[SESSION_KEY]);
}

export function watchBrowserSessions(onChange: () => void): () => void {
  const api = browserAPI();
  const listener = (changes: Record<string, unknown>, area: string) => { if (area === 'local' && changes[SESSION_KEY]) onChange(); };
  api.storage.onChanged.addListener(listener);
  return () => api.storage.onChanged.removeListener(listener);
}

export async function saveBrowserSession(title: string): Promise<void> {
  const tabs = await readOpenBrowserTabs();
  if (!tabs.length) throw new Error('当前窗口没有可保存的普通网页');
  if (tabs.length > 200) throw new Error('当前窗口超过 200 个网页，请分窗口保存');
  const session: SavedBrowserSession = {
    id: crypto.randomUUID(), title: title.trim().slice(0, 60) || '我的工作窗口', createdAt: new Date().toISOString(),
    tabs: tabs.map((tab) => ({ title: tab.title, url: tab.url, pinned: Boolean(tab.pinned), active: Boolean(tab.active) })),
  };
  const result = await browserAPI().runtime.sendMessage({ type: 'session.save', session });
  if (!result?.ok) throw new Error(result?.message || '窗口未保存成功，请重载扩展后再试');
}

export async function restoreBrowserSession(id: string): Promise<{ opened: number; failed: number }> {
  const api = browserAPI();
  const session = (await readBrowserSessions()).find((entry) => entry.id === id);
  if (!session) throw new Error('窗口记录已不存在，请刷新列表');
  const created = await api.windows.create({ url: session.tabs[0].url, focused: true });
  if (typeof created.id !== 'number') throw new Error('浏览器未能创建窗口，请重试');
  let opened = 1;
  let failed = 0;
  let activeId = session.tabs[0].active ? created.tabs?.[0]?.id : undefined;
  if (created.tabs?.[0]?.id && session.tabs[0].pinned) {
    try { await api.tabs.update(created.tabs[0].id, { pinned: true }); } catch { /* URL is still restored; pinning is best effort. */ }
  }
  for (const tab of session.tabs.slice(1)) {
    try {
      const next = await api.tabs.create({ windowId: created.id, url: tab.url, pinned: tab.pinned, active: false });
      if (tab.active) activeId = next.id;
      opened++;
    } catch { failed++; }
  }
  if (activeId) { try { await api.tabs.update(activeId, { active: true }); } catch { /* Leave the restored window usable. */ } }
  return { opened, failed };
}
