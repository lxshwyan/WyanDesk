import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ReminderSettingsModal } from './ReminderSettingsModal';

describe('ReminderSettingsModal', () => {
  it('keeps reminder timing and notification controls in a focused dialog', () => {
    const html = renderToStaticMarkup(
      <ReminderSettingsModal
        reminders={[{ id: 'water', title: '喝水时间到了', time: '10:00', enabled: true, kind: 'water' }]}
        systemNotifications={false}
        onAdd={vi.fn(() => true)}
        onClose={vi.fn()}
        onDelete={vi.fn()}
        onEnableNotifications={vi.fn()}
        onDisableNotifications={vi.fn()}
        onUpdate={vi.fn()}
      />,
    );

    expect(html).toContain('提醒设置');
    expect(html).toContain('喝水时间到了');
    expect(html).toContain('type="time"');
    expect(html).toContain('开启系统通知');
    expect(html).toContain('新增提醒');
    expect(html).toContain('删除喝水时间到了');
    expect(html).toContain('页面打开时才会检查提醒');
  });
});
