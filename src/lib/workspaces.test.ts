import { describe, expect, it } from 'vitest';
import { createBlankWorkspace, duplicateWorkspace, moveWorkspace } from './workspaces';

describe('workspace helpers', () => {
  it('creates a quiet empty workspace with one usable category', () => {
    const workspace = createBlankWorkspace('new', '  项目 A  ');
    expect(workspace.name).toBe('项目 A');
    expect(workspace.categories).toEqual(['常用']);
    expect(workspace.shortcuts).toEqual([]);
  });

  it('duplicates workspace data without sharing mutable arrays', () => {
    const source = createBlankWorkspace('source', '工作');
    source.tasks.push({ id: 'task', text: '任务', done: false, createdAt: '2026-10-06T00:00:00.000Z' });
    const copy = duplicateWorkspace(source, 'copy', '工作副本');
    copy.tasks[0].text = '已修改';
    copy.layout.widgets.tasks.height = 'tall';
    copy.layout.widgetOrder.reverse();
    expect(source.tasks[0].text).toBe('任务');
    expect(source.layout.widgets.tasks.height).toBe('standard');
    expect(source.layout.widgetOrder).toEqual(['quickActions', 'schedule', 'tasks', 'reminders', 'focus', 'notes', 'calendar', 'calculator', 'worldClock', 'dailyOverview']);
  });

  it('moves a workspace only inside valid bounds', () => {
    const first = createBlankWorkspace('first', '一');
    const second = createBlankWorkspace('second', '二');
    expect(moveWorkspace([first, second], 'second', -1).map((item) => item.id)).toEqual(['second', 'first']);
    expect(moveWorkspace([first, second], 'first', -1).map((item) => item.id)).toEqual(['first', 'second']);
  });
});
