import { describe, expect, it } from 'vitest';
import { matchingWidgets, workspaceWidgetSearchItems } from './widgetSearch';
import { desktopSearchActions } from './searchActions';
import { deskRailWidgetIds } from './widgetLayout';

const workspace = { noteTitle: '灵感', noteCards: [{ id: 'note:project' as const, title: '发布清单', content: '', hidden: true }] };
const items = workspaceWidgetSearchItems(workspace);

describe('searchable desktop widgets', () => {
  it('covers every built-in widget once, plus independently named notes', () => {
    expect(items.filter((item) => !item.id.startsWith('note:')).map((item) => item.id).sort()).toEqual([...deskRailWidgetIds].sort());
    expect(new Set(items.map((item) => item.id)).size).toBe(items.length);
    expect(matchingWidgets('发布清单', items).map((item) => item.id)).toEqual(['note:project']);
    expect(workspace.noteCards[0].hidden).toBe(true);
    expect(workspace.noteCards[0].content).toBe('');
  });
  it.each([['换算', 'converter'], ['休息循环', 'focus'], ['日历', 'calendar'], ['计算器', 'calculator'], ['番茄钟', 'focus'], ['ＣＡＬＥＮＤＡＲ', 'calendar'], ['world clock', 'worldClock'], ['灵感', 'notes']])('matches alias %s', (query, id) => {
    expect(matchingWidgets(query, items)[0]?.id).toBe(id);
  });
  it('keeps a renamed primary note searchable by its old name and generic aliases', () => {
    expect(matchingWidgets('工作便签', items)[0].id).toBe('notes');
    expect(matchingWidgets('便签', items).map((item) => item.id)).toEqual(['notes', 'note:project']);
  });
  it('does not capture an unrelated web query or silently search note bodies', () => {
    expect(matchingWidgets('日历教程', items)).toEqual([]);
    expect(matchingWidgets('   ', items)).toEqual([]);
    expect(matchingWidgets('机密正文', workspaceWidgetSearchItems({ noteCards: [{ ...workspace.noteCards[0], content: '机密正文' }] }))).toEqual([]);
  });
  it('puts a matching widget first but retains explicit web search', () => {
    const actions = desktopSearchActions('日历', 'baidu', [], items);
    expect(actions.map((action) => action.kind)).toEqual(['widget', 'web']);
    expect(actions[0].widget?.id).toBe('calendar');
    expect(actions[1].url).toContain(encodeURIComponent('日历'));
    expect(desktopSearchActions('日历教程', 'baidu', [], items)[0].kind).toBe('web');
    expect(desktopSearchActions('calendar.example.com', 'bing', [], items)[0].kind).toBe('url');
  });
  it('ranks the exact note name first and bounds broad results', () => {
    const many = [...items, ...Array.from({ length: 10 }, (_, index) => ({ id: `note:${index}` as const, label: index === 8 ? '便签' : `便签 ${index}`, description: '', keywords: '便签' }))];
    const actions = desktopSearchActions('便签', 'bing', [], many);
    expect(actions).toHaveLength(5);
    expect(actions[0].widget?.id).toBe('note:8');
    expect(actions[4].kind).toBe('web');
  });
});
