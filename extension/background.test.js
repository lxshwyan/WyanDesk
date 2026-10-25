import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CAPTURE_KEY, DESTINATION_KEY, RESULT_KEY, SUMMARY_KEY } from './capture-core.js';

let data;
let api;
let events;
const event = (name) => ({ addListener: (listener) => { events[name] = listener; } });

beforeEach(() => {
  vi.resetModules();
  events = {};
  data = { [SUMMARY_KEY]: { activeWorkspaceId: 'work', workspaces: [{ id: 'work', name: '工作', categories: ['常用', '资料'], shortcuts: [] }] } };
  api = {
    runtime: { id: 'test', getURL: (path) => `chrome-extension://test/${path}`, getContexts: vi.fn(async () => []), onInstalled: event('installed'), onStartup: event('startup'), onMessage: event('message') },
    storage: { local: { get: vi.fn(async (keys) => Object.fromEntries((Array.isArray(keys) ? keys : [keys]).map((key) => [key, data[key]]))), set: vi.fn(async (values) => { Object.assign(data, values); }) }, onChanged: event('changed') },
    contextMenus: { create: vi.fn((_entry, done) => done()), removeAll: vi.fn(async () => {}), onClicked: event('click') },
    tabs: { query: vi.fn(async () => []), create: vi.fn(async () => ({ id: 1 })) },
    action: { setBadgeText: vi.fn(async () => {}), setBadgeBackgroundColor: vi.fn(async () => {}), setTitle: vi.fn(async () => {}) },
  };
  vi.stubGlobal('chrome', api);
});
afterEach(() => vi.unstubAllGlobals());

describe('capture background worker', () => {
  it('captures only the selected text and source, without reading page bodies or form fields', async () => {
    await import('./background.js');
    events.click({ menuItemId: 'reading-excerpt', pageUrl: 'https://example.com/article', selectionText: '用户主动选择的片段' }, { title: '参考资料' });
    await vi.waitFor(() => expect(data[RESULT_KEY]?.ok).toBe(true));
    expect(data[CAPTURE_KEY].items[0]).toMatchObject({ kind: 'reading', excerpt: '用户主动选择的片段', title: '参考资料', url: 'https://example.com/article' });
    delete data[RESULT_KEY];
    events.click({ menuItemId: 'reading-excerpt', pageUrl: 'https://example.com', selectionText: '不保存输入框', editable: true }, {});
    await vi.waitFor(() => expect(data[RESULT_KEY]?.ok).toBe(false));
    expect(data[CAPTURE_KEY].items).toHaveLength(1);
  });
  it('serializes desktop and popup session saves and accepts only its own pages', async () => {
    await import('./background.js');
    const session = (id) => ({ id, title: id, createdAt: new Date().toISOString(), tabs: [{ url: 'https://example.com' }] });
    const first = vi.fn(); const second = vi.fn(); const evil = vi.fn();
    events.message({ type: 'session.save', session: session('one') }, { id: 'test', url: 'chrome-extension://test/app/index.html' }, first);
    events.message({ type: 'session.save', session: session('two') }, { id: 'test', url: 'chrome-extension://test/popup.html' }, second);
    expect(events.message({ type: 'session.save', session: session('evil') }, { id: 'test', url: 'https://evil.example' }, evil)).toBeUndefined();
    await vi.waitFor(() => expect(second).toHaveBeenCalledWith({ ok: true }));
    expect(first).toHaveBeenCalledWith({ ok: true });
    expect(data['wyandesk.extension.sessions'].map((item) => item.id)).toEqual(['two', 'one']);
    expect(evil).not.toHaveBeenCalled();
    const invalid = vi.fn();
    events.message({ type: 'session.save', session: { ...session('big'), tabs: Array.from({ length: 201 }, () => ({ url: 'https://example.com' })) } }, { id: 'test', url: 'chrome-extension://test/app/index.html' }, invalid);
    await vi.waitFor(() => expect(invalid).toHaveBeenCalledWith(expect.objectContaining({ ok: false })));
    expect(data['wyandesk.extension.sessions']).toHaveLength(2);
  });
  it('explains an already-saved page without moving it into a different category', async () => {
    const { enqueueCapture } = await import('./background.js');
    data[SUMMARY_KEY].workspaces[0].shortcuts = [{ url: 'https://example.com/', category: '常用' }];
    const result = await enqueueCapture('items', { id: 'one', kind: 'link', url: 'https://example.com/#top', workspaceId: 'work', category: '资料' });
    expect(result.message).toContain('已在“常用”');
    expect(data[CAPTURE_KEY]).toBeUndefined();
  });
  it('serializes popup and context-menu writes without losing either capture', async () => {
    const { enqueueCapture } = await import('./background.js');
    await Promise.all([enqueueCapture('items', { id: 'one', workspaceId: 'work' }), enqueueCapture('items', { id: 'two', workspaceId: 'work' })]);
    expect(data[CAPTURE_KEY].items.map((item) => item.id)).toEqual(['one', 'two']);
    expect(api.tabs.create).toHaveBeenCalledWith({ url: 'chrome-extension://test/app/index.html', active: false });
  });
  it('does not open another desktop when one is already open', async () => {
    const { enqueueCapture } = await import('./background.js');
    api.runtime.getContexts.mockResolvedValue([{ documentUrl: 'chrome-extension://test/app/index.html#today' }]);
    await enqueueCapture('items', { id: 'one', workspaceId: 'work' });
    expect(api.tabs.create).not.toHaveBeenCalled();
  });
  it('saves right-clicked links into the chosen destination and remembers it', async () => {
    await import('./background.js');
    events.click({ menuItemId: `destination:${JSON.stringify({ workspaceId: 'work', category: '资料' })}`, linkUrl: 'https://example.com/article#section', pageUrl: 'https://source.example' }, { title: '来源页面' });
    await vi.waitFor(() => expect(data[RESULT_KEY]?.ok).toBe(true));
    expect(data[CAPTURE_KEY].items[0]).toMatchObject({ url: 'https://example.com/article', title: 'example.com', workspaceId: 'work', category: '资料' });
    expect(data[DESTINATION_KEY]).toEqual({ workspaceId: 'work', category: '资料' });
  });
  it('saves the current page title and rejects unsafe URLs/deleted targets without mutation', async () => {
    await import('./background.js');
    const menuItemId = `capture:${JSON.stringify({ workspaceId: 'work', category: '常用' })}`;
    events.click({ menuItemId, pageUrl: 'https://example.com' }, { title: '项目文档' });
    await vi.waitFor(() => expect(data[RESULT_KEY]?.ok).toBe(true));
    expect(data[CAPTURE_KEY].items[0].title).toBe('项目文档');
    delete data[RESULT_KEY];
    events.click({ menuItemId, linkUrl: 'javascript:alert(1)' }, {});
    await vi.waitFor(() => expect(data[RESULT_KEY]?.ok).toBe(false));
    expect(data[CAPTURE_KEY].items).toHaveLength(1);
    data[SUMMARY_KEY].workspaces[0].categories = ['新分类'];
    delete data[RESULT_KEY];
    events.click({ menuItemId, pageUrl: 'https://new.example' }, {});
    await vi.waitFor(() => expect(data[RESULT_KEY]?.message).toContain('目标分组已改变'));
    expect(data[CAPTURE_KEY].items).toHaveLength(1);
  });
  it('requires desktop initialization and reports background-open failures honestly', async () => {
    const { enqueueCapture } = await import('./background.js');
    delete data[SUMMARY_KEY];
    await expect(enqueueCapture('items', { workspaceId: 'work' })).rejects.toThrow('初始化');
    data[SUMMARY_KEY] = { workspaces: [{ id: 'work', categories: ['常用'] }] };
    api.tabs.create.mockRejectedValue(new Error('unavailable'));
    expect(await enqueueCapture('items', { id: 'one', workspaceId: 'work' })).toMatchObject({ ok: true, message: expect.stringContaining('已暂存') });
  });
  it('accepts capture messages only from its own popup', async () => {
    await import('./background.js');
    const respond = vi.fn();
    expect(events.message({ type: 'capture' }, { id: 'other', url: 'https://evil.example' }, respond)).toBeUndefined();
    expect(respond).not.toHaveBeenCalled();
    expect(events.message({ type: 'capture', kind: 'items', value: { id: 'one', workspaceId: 'work' } }, { id: 'test', url: 'chrome-extension://test/popup.html' }, respond)).toBe(true);
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith(expect.objectContaining({ ok: true })));
  });
  it('builds menus after install and refreshes only for destination/summary changes', async () => {
    await import('./background.js');
    events.installed();
    await vi.waitFor(() => expect(api.contextMenus.create).toHaveBeenCalledTimes(8));
    events.changed({ unrelated: {} }, 'local');
    expect(api.contextMenus.removeAll).toHaveBeenCalledTimes(1);
    data[DESTINATION_KEY] = { workspaceId: 'work', category: '资料' };
    events.changed({ [DESTINATION_KEY]: {} }, 'local');
    await vi.waitFor(() => expect(api.contextMenus.removeAll).toHaveBeenCalledTimes(2));
  });
  it('acknowledges only committed IDs, preserving concurrently added captures', async () => {
    const { enqueueCapture } = await import('./background.js');
    await enqueueCapture('items', { id: 'one', workspaceId: 'work' });
    const pending = enqueueCapture('items', { id: 'two', workspaceId: 'work' });
    const respond = vi.fn();
    events.message({ type: 'capture.ack', ids: { items: ['one'] } }, { id: 'test', url: 'chrome-extension://test/app/index.html' }, respond);
    await pending;
    await vi.waitFor(() => expect(respond).toHaveBeenCalledWith({ ok: true }));
    expect(data[CAPTURE_KEY].items.map((item) => item.id)).toEqual(['two']);
  });
});
