import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { DailyOverviewCard } from './DailyOverviewCard';

describe('DailyOverviewCard', () => {
  it('summarizes existing desktop data without new input', () => {
    const html = renderToStaticMarkup(<DailyOverviewCard openTaskCount={3} todayEventCount={2} nextReminderTime="15:00" focusTaskTitle="整理需求" />);
    expect(html).toContain('3 项');
    expect(html).toContain('2 项');
    expect(html).toContain('15:00');
    expect(html).toContain('整理需求');
  });
});
