import { renderToStaticMarkup } from 'react-dom/server';
import { CalendarPlus, ListTodo, TimerReset } from 'lucide-react';
import { describe, expect, it, vi } from 'vitest';
import { QuickActionsCard } from './QuickActionsCard';

describe('QuickActionsCard', () => {
  it('shows the configured actions, settings, and the complete command entry', () => {
    const html = renderToStaticMarkup(
      <QuickActionsCard
        actions={[
          { id: 'task', label: '新任务', description: '添加任务', keywords: '', icon: <ListTodo />, run: vi.fn() },
          { id: 'event', label: '新日程', description: '添加日程', keywords: '', icon: <CalendarPlus />, run: vi.fn() },
          { id: 'focus', label: '开始专注', description: '开始计时', keywords: '', icon: <TimerReset />, run: vi.fn() },
        ]}
        onOpenAll={vi.fn()}
        onManage={vi.fn()}
      />,
    );

    expect(html).toContain('新任务');
    expect(html).toContain('新日程');
    expect(html).toContain('开始专注');
    expect(html).toContain('设置');
    expect(html).toContain('更多');
  });
});
