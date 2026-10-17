import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DailyOverviewCard } from './DailyOverviewCard';

describe('DailyOverviewCard', () => {
  it('renders actionable tasks and the next schedule without creating separate state', () => {
    const html = renderToStaticMarkup(
      <DailyOverviewCard
        tasks={[{ id: 'task-1', text: '整理需求', done: false, createdAt: '2026-10-16T08:00:00.000Z', dueDate: '2026-10-16', recurrence: 'none' }]}
        openTaskCount={1}
        focusTaskId="task-1"
        todayKey="2026-10-16"
        nextEvent={{ id: 'event-1', title: '项目会议', date: '2026-10-16', time: '15:00' }}
        nextReminder={{ title: '休息一下', time: '16:00' }}
        onAddTask={() => true}
        onAddEvent={() => undefined}
        onOpenTask={() => undefined}
        onToggleTask={() => undefined}
      />,
    );
    expect(html).toContain('今天');
    expect(html).toContain('整理需求');
    expect(html).toContain('添加今日任务');
    expect(html).toContain('项目会议 · 15:00');
    expect(html).toContain('休息一下 · 16:00');
  });
});
