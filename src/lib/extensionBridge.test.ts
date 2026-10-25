import { afterEach, describe, expect, it, vi } from 'vitest';
import { createBalancedState } from '../data/defaults';
import { acknowledgeExtensionCaptures, applyExtensionCaptures, deskHomeURL, type ExtensionCaptureQueue } from './extensionBridge';

afterEach(() => vi.unstubAllGlobals());

describe('deskHomeURL', () => {
  it('acknowledges capture IDs without resending private desktop content', async () => {
    const sendMessage = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('location', { protocol: 'chrome-extension:' });
    vi.stubGlobal('chrome', { storage: { local: {} }, runtime: { sendMessage } });
    await acknowledgeExtensionCaptures({ version: 1, items: [{ id: 'one' } as never], groups: [], bookmarks: [] });
    expect(sendMessage).toHaveBeenCalledWith({ type: 'capture.ack', ids: { items: ['one'], groups: [], bookmarks: [] } });
  });
  it('keeps the brand link inside the packaged extension app', () => {
    vi.stubGlobal('location', { protocol: 'chrome-extension:' });
    vi.stubGlobal('chrome', { storage: { local: {} } });
    expect(deskHomeURL()).toBe('./index.html');
  });

  it('uses the website root outside the extension', () => {
    vi.stubGlobal('location', { protocol: 'https:' });
    expect(deskHomeURL()).toBe('/');
  });
});

describe('applyExtensionCaptures', () => {
  it('adds read-later excerpts once, without duplicating sites or losing the source', () => {
    const state = createBalancedState();
    const queue: ExtensionCaptureQueue = { version: 1, groups: [], bookmarks: [], items: [
      { id: 'reading', kind: 'reading', title: '论文', url: 'https://example.com/paper', excerpt: '一段重要摘录', workspaceId: state.activeWorkspaceId, category: '资料' },
      { id: 'bad', kind: 'reading', title: 'bad', url: 'javascript:alert(1)', workspaceId: state.activeWorkspaceId, category: '资料' },
    ] };
    const first = applyExtensionCaptures(state, queue);
    expect(first.addedReadings).toBe(1);
    expect(first.addedSites).toBe(0);
    expect(first.state.inbox[0]).toMatchObject({ content: '论文', url: 'https://example.com/paper', excerpt: '一段重要摘录' });
    expect(applyExtensionCaptures(first.state, queue).addedReadings).toBe(0);
    first.state.inbox[0] = { ...first.state.inbox[0], readAt: new Date().toISOString(), note: '原备注' };
    const readded = applyExtensionCaptures(first.state, { ...queue, items: [{ ...queue.items[0], id: 'reading-again' }] });
    expect(readded.state.inbox).toHaveLength(1);
    expect(readded.state.inbox[0].readAt).toBeUndefined();
    expect(readded.state.inbox[0].note).toBe('原备注');
  });
  it('preserves distinct hash-router pages when importing bookmarks', () => {
    const result = applyExtensionCaptures(createBalancedState(), { version: 1, groups: [], items: [], bookmarks: [{ id: 'routes', workspaceId: 'workspace-work', entries: [
      { title: '项目', url: 'https://example.com/#/projects', category: '资料' },
      { title: '任务', url: 'https://example.com/#/tasks', category: '资料' },
    ] }] });
    expect(result.addedSites).toBe(2);
    expect(result.state.workspaces[0].shortcuts.at(-1)?.url).toBe('https://example.com/#/tasks');
  });
  it('deduplicates large imports across batches without dropping source categories', () => {
    const state = createBalancedState();
    const entries = Array.from({ length: 5000 }, (_, index) => ({ title: `资料 ${index}`, url: `https://example.com/item/${index}`, category: '研究资料' }));
    const result = applyExtensionCaptures(state, { version: 1, items: [], groups: [], bookmarks: [
      { id: 'large', workspaceId: 'workspace-work', entries },
      { id: 'duplicate', workspaceId: 'workspace-work', entries: [entries[0]] },
    ] });
    expect(result.addedSites).toBe(5000);
    expect(result.state.workspaces[0].shortcuts.at(-1)?.category).toBe('研究资料');
  });
  it('adds a captured page to the requested desktop and category', () => {
    const state = createBalancedState();
    const queue: ExtensionCaptureQueue = {
      version: 1,
      items: [{ id: 'one', title: '示例', url: 'https://example.com/path#section', workspaceId: 'workspace-study', category: '资料' }],
      groups: [],
      bookmarks: [],
    };
    const result = applyExtensionCaptures(state, queue);
    const study = result.state.workspaces.find((item) => item.id === 'workspace-study')!;
    expect(result.addedSites).toBe(1);
    expect(study.categories).toContain('资料');
    expect(study.shortcuts.find((item) => item.id === 'extension-one')?.url).toBe('https://example.com/path');
  });

  it('creates an idempotent window group and reuses existing URLs', () => {
    const state = createBalancedState();
    const queue: ExtensionCaptureQueue = {
      version: 1,
      items: [],
      groups: [{
        id: 'window-one',
        title: '研究资料',
        workspaceId: 'workspace-work',
        category: '常用',
        tabs: [
          { title: '百度', url: 'https://www.baidu.com/' },
          { title: '示例', url: 'https://example.com/' },
        ],
      }],
      bookmarks: [],
    };
    const first = applyExtensionCaptures(state, queue);
    const second = applyExtensionCaptures(first.state, queue);
    expect(first.addedSites).toBe(1);
    expect(first.addedGroups).toBe(1);
    expect(second.addedSites).toBe(0);
    expect(second.addedGroups).toBe(0);
    expect(second.state.workspaces[0].shortcutGroups.find((group) => group.id === 'extension-group-window-one')?.shortcutIds).toHaveLength(2);
  });

  it('merges the current window into a selected group and keeps URLs unique', () => {
    const state = createBalancedState();
    const work = state.workspaces[0];
    const firstShortcut = work.shortcuts[0];
    const secondShortcut = work.shortcuts[1];
    work.shortcutGroups = [{ id: 'daily-work', title: '日常工作', shortcutIds: [firstShortcut.id] }];
    const queue: ExtensionCaptureQueue = {
      version: 1,
      items: [],
      groups: [{
        id: 'capture-one',
        title: '日常工作',
        targetGroupId: 'daily-work',
        workspaceId: work.id,
        category: '常用',
        tabs: [
          { title: secondShortcut.title, url: secondShortcut.url },
          { title: '新资料', url: 'https://example.com/research#today' },
          { title: '新资料重复页', url: 'https://example.com/research#later' },
        ],
      }],
      bookmarks: [],
    };

    const first = applyExtensionCaptures(state, queue);
    const second = applyExtensionCaptures(first.state, queue);
    const group = first.state.workspaces[0].shortcutGroups.find((item) => item.id === 'daily-work');
    expect(first.addedSites).toBe(1);
    expect(first.addedGroups).toBe(0);
    expect(first.updatedGroups).toBe(1);
    expect(group?.shortcutIds).toHaveLength(3);
    expect(second.addedSites).toBe(0);
    expect(second.updatedGroups).toBe(0);
  });

  it('imports a native bookmark batch, preserves folders, and skips duplicate URLs', () => {
    const state = createBalancedState();
    const queue: ExtensionCaptureQueue = {
      version: 1,
      items: [],
      groups: [],
      bookmarks: [{
        id: 'bookmark-batch',
        workspaceId: 'workspace-work',
        entries: [
          { title: '百度重复项', url: 'https://www.baidu.com/', category: '搜索' },
          { title: '设计资料', url: 'https://example.com/design#top', category: '设计收藏夹' },
        ],
      }],
    };

    const first = applyExtensionCaptures(state, queue);
    const second = applyExtensionCaptures(first.state, queue);
    expect(first.addedSites).toBe(1);
    expect(first.state.workspaces[0].categories).toContain('设计收藏夹');
    expect(first.state.workspaces[0].shortcuts.find((shortcut) => shortcut.url === 'https://example.com/design')?.category).toBe('设计收藏夹');
    expect(second.addedSites).toBe(0);
  });

  it('captures the current page as an idempotent task or note', () => {
    const state = createBalancedState();
    const queue: ExtensionCaptureQueue = {
      version: 1,
      items: [
        { id: 'task-one', kind: 'task', title: '跟进项目', url: 'https://example.com/task', workspaceId: 'workspace-work', category: '常用' },
        { id: 'note-one', kind: 'note', title: '参考资料', url: 'https://example.com/note', workspaceId: 'workspace-work', category: '常用' },
      ],
      groups: [],
      bookmarks: [],
    };
    const first = applyExtensionCaptures(state, queue);
    const second = applyExtensionCaptures(first.state, queue);
    expect(first.addedTasks).toBe(1);
    expect(first.addedNotes).toBe(1);
    expect(first.state.workspaces[0].tasks[0].text).toContain('https://example.com/task');
    expect(first.state.workspaces[0].note).toContain('https://example.com/note');
    expect(second.addedTasks).toBe(0);
    expect(second.addedNotes).toBe(0);
  });
});
