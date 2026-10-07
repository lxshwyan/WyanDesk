import { describe, expect, it } from 'vitest';
import { nextRecurringDate, prioritizeTasks } from './tasks';

const tasks = [
  { id: 'a', text: '第一项', done: false, createdAt: '2026-10-06T00:00:00.000Z' },
  { id: 'b', text: '重点项', done: false, createdAt: '2026-10-06T00:01:00.000Z' },
  { id: 'c', text: '第三项', done: false, createdAt: '2026-10-06T00:02:00.000Z' },
];

describe('prioritizeTasks', () => {
  it('moves the focus task to the front without changing the remaining order', () => {
    expect(prioritizeTasks(tasks, 'b').map((task) => task.id)).toEqual(['b', 'a', 'c']);
  });

  it('returns the original list when the focus task is missing', () => {
    expect(prioritizeTasks(tasks, 'missing')).toBe(tasks);
  });
});

describe('nextRecurringDate', () => {
  it('advances daily and weekly dates across month boundaries', () => {
    expect(nextRecurringDate('2026-10-31', 'daily')).toBe('2026-11-01');
    expect(nextRecurringDate('2026-10-31', 'weekly')).toBe('2026-11-07');
  });

  it('ignores invalid or non-recurring tasks', () => {
    expect(nextRecurringDate('invalid', 'daily')).toBe('');
    expect(nextRecurringDate('2026-10-31', 'none')).toBe('');
  });
});
