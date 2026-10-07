import { describe, expect, it, vi } from 'vitest';
import { createBlankWorkspace } from './workspaces';
import { parseICS, serializeWorkspaceICS } from './ics';

describe('ICS calendar exchange', () => {
  it('exports events and dated recurring tasks', () => {
    const workspace = createBlankWorkspace('work', '工作');
    workspace.events = [{ id: 'event-1', title: '项目周会', date: '2026-10-08', time: '10:30' }];
    workspace.tasks = [{ id: 'task-1', text: '提交报告', done: false, createdAt: '2026-10-06T00:00:00.000Z', dueDate: '2026-10-09', recurrence: 'weekly' }];
    const value = serializeWorkspaceICS(workspace, new Date('2026-10-06T04:00:00.000Z'));
    expect(value).toContain('DTSTART:20261008T103000');
    expect(value).toContain('SUMMARY:待办：提交报告');
    expect(value).toContain('RRULE:FREQ=WEEKLY');
  });

  it('imports timed and all-day calendar events', () => {
    vi.stubGlobal('crypto', { randomUUID: () => 'id' });
    const value = 'BEGIN:VCALENDAR\r\nBEGIN:VEVENT\r\nDTSTART:20261008T103000\r\nSUMMARY:项目\\,周会\r\nEND:VEVENT\r\nBEGIN:VEVENT\r\nDTSTART;VALUE=DATE:20261009\r\nSUMMARY:全天事项\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n';
    expect(parseICS(value).map((item) => [item.title, item.date, item.time])).toEqual([
      ['项目,周会', '2026-10-08', '10:30'],
      ['全天事项', '2026-10-09', '09:00'],
    ]);
    vi.unstubAllGlobals();
  });
});
