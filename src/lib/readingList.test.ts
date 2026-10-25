import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { migrateDeskState, parseDeskBackup, serializeDeskBackup } from './storage';
import { normalizeInboxItems, organizeReadingItem, readingURL } from './readingList';

const item = { id: 'read-1', kind: 'link' as const, content: '研究资料', url: 'https://example.com/article', createdAt: '2026-10-23T00:00:00Z', excerpt: '重要的原文片段', note: '用于周五报告', readAt: '2026-10-23T01:00:00Z' };
describe('reading list persistence', () => {
  it('keeps legacy captures and preserves reading fields through backup and migration', () => {
    const state = createDefaultState();
    state.inbox = [item, { id: 'old', kind: 'note', content: '旧想法', createdAt: item.createdAt }];
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored.inbox[0]).toMatchObject(item);
    expect(restored.inbox[1]).toMatchObject({ content: '旧想法', kind: 'note' });
    expect(migrateDeskState(state).inbox).toEqual(restored.inbox);
  });
  it('bounds user text, deduplicates IDs, and rejects executable or credential-bearing sources', () => {
    const normalized = normalizeInboxItems([null, {}, item, item, { ...item, id: 'long', excerpt: 'x'.repeat(4000), note: 'y'.repeat(2000), readAt: 'bad', url: 'javascript:alert(1)' }]);
    expect(normalized).toHaveLength(2);
    expect(normalized[1].excerpt).toHaveLength(2000);
    expect(normalized[1].note).toHaveLength(1000);
    expect(normalized[1].readAt).toBeUndefined();
    expect(normalized[1].url).toBeUndefined();
    for (const url of ['data:text/html,test', 'chrome://settings', 'https://user:pass@example.com', 'not url']) expect(readingURL(url)).toBeUndefined();
  });
  it('retains excerpts and notes when organizing a link already present in a category', () => {
    const workspace = createDefaultState().workspaces[0];
    const first = organizeReadingItem(workspace, item, '研究', 'site-new');
    const second = organizeReadingItem(first, { ...item, note: '另一份备注' }, '其他', 'site-duplicate');
    expect(second.shortcuts.filter((shortcut) => shortcut.url === item.url)).toHaveLength(1);
    expect(second.note).toContain(item.excerpt);
    expect(second.note).toContain(item.note);
    expect(second.note).toContain('另一份备注');
    expect(second.note).toContain(item.url);
    expect(second.shortcuts.find((shortcut) => shortcut.url === item.url)?.category).toBe('研究');
  });
  it('does not turn an invalid source into a shortcut or lose note/task context', () => {
    const workspace = createDefaultState().workspaces[0];
    expect(organizeReadingItem(workspace, { ...item, url: 'javascript:test' }, '研究', 'bad')).toBe(workspace);
    expect(organizeReadingItem(workspace, { ...item, kind: 'note' }, '研究', 'note').note).toContain(item.url);
    expect(organizeReadingItem(workspace, { ...item, kind: 'task' }, '研究', 'task').tasks[0].text).toContain(item.excerpt);
  });
});
