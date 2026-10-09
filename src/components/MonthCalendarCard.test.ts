import { describe, expect, it } from 'vitest';
import { monthCalendarCells } from './MonthCalendarCard';

describe('month calendar cells', () => {
  it('builds a six-week Monday-first calendar', () => {
    const cells = monthCalendarCells(2026, 9);
    expect(cells).toHaveLength(42);
    expect(cells.indexOf(1)).toBe(3);
    expect(cells.filter(Boolean)).toHaveLength(31);
  });
});
