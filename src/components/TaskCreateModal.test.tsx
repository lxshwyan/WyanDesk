import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { TaskCreateModal } from './TaskCreateModal';

describe('TaskCreateModal', () => {
  it('offers task content and optional scheduling fields', () => {
    const html = renderToStaticMarkup(
      <TaskCreateModal todayKey="2026-10-09" onClose={vi.fn()} onSave={vi.fn(() => true)} />,
    );

    expect(html).toContain('新建任务');
    expect(html).toContain('任务内容');
    expect(html).toContain('日期（可选）');
    expect(html).toContain('提醒时间');
    expect(html).toContain('重复');
    expect(html).toContain('min="2026-10-09"');
    expect(html).toContain('添加任务');
  });
});
