import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { LockActivityModal } from './LockActivityModal';

describe('LockActivityModal', () => {
  it('renders activity history only when explicitly mounted', () => {
    const html = renderToStaticMarkup(
      <LockActivityModal
        entries={[{
          id: 'activity-1',
          sessionId: 'session-1',
          sessionStartedAt: '2026-10-09T08:00:00.000Z',
          kind: 'pointer',
          firstAt: '2026-10-09T08:01:00.000Z',
          lastAt: '2026-10-09T08:01:01.000Z',
          count: 2,
        }]}
        onClose={vi.fn()}
        onClear={vi.fn()}
      />,
    );

    expect(html).toContain('锁屏活动记录');
    expect(html).toContain('鼠标或触控操作');
    expect(html).not.toContain('锁屏期间检测到活动');
    expect(html).not.toContain('查看全部');
  });
});
