import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { activateBrowserTab, readBrowserSessions, readOpenBrowserTabs, restoreBrowserSession, saveBrowserSession } from './browserWorkspace';
import { SESSION_KEY } from '../../extension/session-core.js';

const tab = { id: 1, windowId: 2, title: '研究', url: 'https://example.com', pinned: true, active: true };
let api: any;
beforeEach(() => {
  vi.stubGlobal('location', { protocol: 'chrome-extension:' });
  api = {
    permissions: { request: vi.fn(async () => true) },
    tabs: { query: vi.fn(async () => [tab]), get: vi.fn(async () => ({ windowId: 2 })), update: vi.fn(async () => ({})), create: vi.fn(async () => ({ id: 22 })) },
    windows: { create: vi.fn(async () => ({ id: 3, tabs: [{ id: 21 }] })), update: vi.fn(async () => ({})) },
    runtime: { sendMessage: vi.fn(async () => ({ ok: true })) },
    storage: { local: { get: vi.fn(async () => ({ [SESSION_KEY]: [{ id: 'old', title: '旧窗口', createdAt: '2026-10-21T00:00:00Z', tabs: [tab, { ...tab, url: 'https://second.example', active: false }] }] })) } },
  };
  vi.stubGlobal('chrome', api);
});
afterEach(() => vi.unstubAllGlobals());

describe('explicit browser workspace access', () => {
  it('requests permission on the click path and never queries on denial', async () => {
    api.permissions.request.mockResolvedValue(false);
    const pending = readOpenBrowserTabs();
    expect(api.permissions.request).toHaveBeenCalledWith({ permissions: ['tabs'] });
    await expect(pending).rejects.toThrow('未授权');
    expect(api.tabs.query).not.toHaveBeenCalled();
  });
  it('reads only current-window normal tabs and does not include incognito or credentials', async () => {
    api.tabs.query.mockResolvedValue([tab, { ...tab, id: 2, url: 'chrome://newtab' }, { ...tab, id: 3, incognito: true }, { ...tab, id: 4, url: 'https://u:p@example.com' }]);
    expect(await readOpenBrowserTabs()).toHaveLength(1);
    expect(api.tabs.query).toHaveBeenCalledWith({ currentWindow: true });
  });
  it('switches an existing tab and reports stale IDs without opening a duplicate', async () => {
    await activateBrowserTab(tab);
    expect(api.tabs.update).toHaveBeenCalledWith(1, { active: true });
    expect(api.windows.update).toHaveBeenCalledWith(2, { focused: true });
    api.tabs.get.mockRejectedValue(new Error('gone'));
    await expect(activateBrowserTab(tab)).rejects.toThrow('已关闭');
    expect(api.tabs.create).not.toHaveBeenCalled();
  });
  it('saves only URLs/title/pinning through the serialized worker and reports failures', async () => {
    await saveBrowserSession('项目A');
    expect(api.runtime.sendMessage).toHaveBeenCalledWith({ type: 'session.save', session: expect.objectContaining({ title: '项目A', tabs: [{ title: '研究', url: 'https://example.com/', pinned: true, active: true }] }) });
    api.runtime.sendMessage.mockResolvedValue({ ok: false, message: '存储空间不足' });
    await expect(saveBrowserSession('项目A')).rejects.toThrow('存储空间不足');
  });
  it('reads legacy sessions without permission prompts and restores into a new window', async () => {
    expect(await readBrowserSessions()).toHaveLength(1);
    expect(api.permissions.request).not.toHaveBeenCalled();
    expect(await restoreBrowserSession('old')).toEqual({ opened: 2, failed: 0 });
    expect(api.windows.create).toHaveBeenCalledWith({ url: 'https://example.com/', focused: true });
    expect(api.tabs.create).toHaveBeenCalledWith({ windowId: 3, url: 'https://second.example/', pinned: true, active: false });
    expect(api.tabs.update).toHaveBeenCalledWith(21, { pinned: true });
  });
  it('reports partial restore honestly and leaves saved records untouched', async () => {
    api.tabs.create.mockRejectedValue(new Error('limit'));
    expect(await restoreBrowserSession('old')).toEqual({ opened: 1, failed: 1 });
    expect(api.runtime.sendMessage).not.toHaveBeenCalled();
    await expect(restoreBrowserSession('gone')).rejects.toThrow('不存在');
  });
  it('never exposes browser-only operations to the website', async () => {
    vi.stubGlobal('location', { protocol: 'https:' });
    await expect(readOpenBrowserTabs()).rejects.toThrow('扩展');
    expect(api.permissions.request).not.toHaveBeenCalled();
  });
});
