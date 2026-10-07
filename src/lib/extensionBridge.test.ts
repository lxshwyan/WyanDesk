import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { applyExtensionCaptures, type ExtensionCaptureQueue } from './extensionBridge';

describe('applyExtensionCaptures', () => {
  it('adds a captured page to the requested desktop and category', () => {
    const state = createDefaultState();
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
    const state = createDefaultState();
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

  it('imports a native bookmark batch, preserves folders, and skips duplicate URLs', () => {
    const state = createDefaultState();
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
});
