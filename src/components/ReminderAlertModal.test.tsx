import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ReminderAlertModal } from './ReminderAlertModal';

describe('ReminderAlertModal', () => {
  it('renders a focused reminder with acknowledgement and snooze actions', () => {
    const html = renderToStaticMarkup(
      <ReminderAlertModal
        alert={{ id: 'lunch', title: '午餐时间到了', time: '12:00', context: '今日', kind: 'meal', notificationTitle: '微言桌面' }}
        onDismiss={vi.fn()}
        onSnooze={vi.fn()}
      />,
    );

    expect(html).toContain('role="alertdialog"');
    expect(html).toContain('午餐时间到了');
    expect(html).toContain('今日 · 12:00');
    expect(html).toContain('5 分钟后提醒');
    expect(html).toContain('知道了');
  });
});
