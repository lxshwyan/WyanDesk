import { describe, expect, it } from 'vitest';
import { appendQueue, bookmarkFolders, collectBookmarks, contextMenuEntries, normalizedURL, resolveDestination, selectBookmarkNodes } from './capture-core.js';

const summary = { activeWorkspaceId: 'work', workspaces: [{ id: 'work', name: '工作', categories: ['常用', '研发 & 资料'], shortcuts: [] }, { id: 'study', name: '学习', categories: ['参考'], shortcuts: [] }] };

describe('extension capture destinations', () => {
  it('remembers a valid workspace/category and repairs deleted destinations', () => {
    expect(resolveDestination(summary, { workspaceId: 'study', category: '参考' })).toEqual({ workspaceId: 'study', category: '参考' });
    expect(resolveDestination(summary, { workspaceId: 'gone', category: 'gone' })).toEqual({ workspaceId: 'work', category: '常用' });
  });
  it('builds unique menu IDs and escapes native menu accelerators', () => {
    const menus = contextMenuEntries(summary, { workspaceId: 'study', category: '参考' });
    expect(new Set(menus.map((item) => item.id)).size).toBe(menus.length);
    expect(menus[1].title).toContain('学习 / 参考');
    expect(menus.find((item) => item.title === '研发 && 资料')).toBeDefined();
    expect(menus.filter((item) => item.id.startsWith('destination:'))).toHaveLength(3);
  });
  it('accepts ordinary URLs but rejects browser pages and embedded credentials', () => {
    expect(normalizedURL('https://example.com/#a')).toBe('https://example.com/');
    expect(normalizedURL('https://example.com/#/projects')).toBe('https://example.com/#/projects');
    for (const value of ['chrome://newtab', 'javascript:alert(1)', 'https://u:p@example.com', 'bad']) expect(normalizedURL(value)).toBe('');
  });
  it('keeps legacy queue fields and refuses overflow without discarding pending data', () => {
    const queue = appendQueue({ items: Array.from({ length: 59 }, (_, id) => ({ id })), groups: [{ id: 'group' }] }, 'items', { id: 'new' });
    expect(queue.items).toHaveLength(60);
    expect(queue.items.at(-1).id).toBe('new');
    expect(queue.groups).toHaveLength(1);
    expect(queue.bookmarks).toEqual([]);
    expect(() => appendQueue(queue, 'items', { id: 'overflow' })).toThrow('已有收藏不会被覆盖');
    expect(() => appendQueue({}, 'invalid', {})).toThrow();
  });
});

describe('native bookmark planning', () => {
  const tree = [{ id: '0', title: '', children: [{ id: '1', title: '书签栏', children: [{ id: '2', title: '设计', children: [{ title: '文档', url: 'https://example.com/#a' }, { title: '重复', url: 'https://example.com/#b' }, { title: '内部页', url: 'chrome://settings' }] }, { id: '3', title: '空文件夹', children: [] }] }] }];
  it('offers folder paths without treating URL bookmarks as folders', () => {
    expect(bookmarkFolders(tree)).toEqual([{ id: '1', title: '书签栏' }, { id: '2', title: '书签栏 / 设计' }, { id: '3', title: '书签栏 / 空文件夹' }]);
  });
  it('imports everything into the explicitly selected category and reports skips', () => {
    const result = collectBookmarks(tree, { category: '我的资料' });
    expect(result.entries).toEqual([{ title: '文档', url: 'https://example.com/', category: '我的资料' }]);
    expect(result.duplicates).toBe(1);
    expect(result.unsupported).toBe(1);
  });
  it('preserves source folders only when requested', () => {
    expect(collectBookmarks(tree, { preserveFolders: true }).entries[0].category).toBe('设计');
    expect(collectBookmarks(selectBookmarkNodes(tree, '2'), { category: '其他', preserveFolders: true }).entries[0].category).toBe('设计');
    expect(selectBookmarkNodes(tree, 'unknown')).toEqual([]);
  });
  it('reports overflow, accepts untitled pages, and handles empty folders', () => {
    const result = collectBookmarks([{ url: 'https://a.example' }, { url: 'https://b.example' }], { limit: 1 });
    expect(result.entries[0].title).toBe('a.example');
    expect(result.overflow).toBe(1);
    expect(collectBookmarks([]).entries).toEqual([]);
  });
});
