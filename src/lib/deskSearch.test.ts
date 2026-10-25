import { describe, expect, it } from 'vitest';
import { createBalancedState } from '../data/defaults';
import { deskSearchItems, interleaveSearchResults, searchMatches } from './deskSearch';

describe('unified desktop search', () => {
  it('matches multiple terms across fields and normalizes full-width input', () => {
    expect(searchMatches('报告 学习', '学习桌面', '周五报告')).toBe(true);
    expect(searchMatches('ＰＤＦ', 'PDF 文献')).toBe(true);
    expect(searchMatches('missing', '报告')).toBe(false);
  });
  it('indexes tasks and note body across workspaces plus excerpts/remarks without external requests', () => {
    const state = createBalancedState();
    state.workspaces[0].note = '会议记录中的预算';
    state.workspaces[1].tasks = [{ id: 'homework', text: '周五交论文', done: false, createdAt: '', dueDate: '2026-10-24' }];
    state.inbox = [{ id: 'reading', kind: 'link', content: '一份资料', createdAt: '', excerpt: '可搜索的摘录', note: '我的批注', url: 'https://example.com' }];
    const entries = deskSearchItems(state);
    expect(entries.find((item) => searchMatches('预算', item.keywords))?.kind).toBe('note');
    expect(entries.find((item) => searchMatches('论文', item.keywords))).toMatchObject({ id: 'homework', workspaceId: state.workspaces[1].id });
    expect(entries.find((item) => searchMatches('批注', item.keywords))?.id).toBe('reading');
    expect(entries.find((item) => searchMatches('摘录', item.keywords))?.id).toBe('reading');
  });
  it('gives each result category room even with many matching commands', () => {
    expect(interleaveSearchResults([['note', 'reading'], ['site'], ['command-1', 'command-2']], 4)).toEqual(['note', 'site', 'command-1', 'reading']);
    expect(interleaveSearchResults([[], []])).toEqual([]);
  });
});
