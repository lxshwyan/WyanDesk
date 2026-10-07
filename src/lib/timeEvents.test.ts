import { describe, expect, it } from 'vitest';
import { describeTimeEvent, isValidDateKey, normalizeTimeEvents } from './timeEvents';

describe('time events', () => {
  it('counts elapsed days with date-only arithmetic', () => {
    expect(describeTimeEvent({ id: 'one', title: '来到世界', date: '2026-10-01', type: 'elapsed', repeatYearly: false }, new Date(2026, 9, 7))).toMatchObject({ eyebrow: '已经', value: '6 天' });
  });

  it('supports one-time and yearly countdowns', () => {
    expect(describeTimeEvent({ id: 'one', title: '交付', date: '2026-10-10', type: 'countdown', repeatYearly: false }, new Date(2026, 9, 7))).toMatchObject({ eyebrow: '还有', value: '3 天' });
    expect(describeTimeEvent({ id: 'two', title: '周年', date: '2020-10-05', type: 'countdown', repeatYearly: true }, new Date(2026, 9, 7))).toMatchObject({ eyebrow: '还有', value: '363 天' });
  });

  it('clamps a leap-day yearly event in a non-leap year', () => {
    expect(describeTimeEvent({ id: 'leap', title: '特别一天', date: '2024-02-29', type: 'countdown', repeatYearly: true }, new Date(2025, 1, 27))).toMatchObject({ eyebrow: '还有', value: '1 天', caption: '每年 2月28日' });
  });

  it('filters invalid and duplicate stored values', () => {
    expect(isValidDateKey('2026-02-29')).toBe(false);
    expect(normalizeTimeEvents([
      { id: 'one', title: '  项目   上线 ', date: '2026-10-10', type: 'countdown', repeatYearly: false },
      { id: 'one', title: '重复', date: '2026-10-11', type: 'elapsed' },
      { id: 'bad', title: '', date: 'not-a-date', type: 'elapsed' },
    ])).toEqual([{ id: 'one', title: '项目 上线', date: '2026-10-10', type: 'countdown', repeatYearly: false }]);
  });
});
