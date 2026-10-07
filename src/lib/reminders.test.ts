import { describe, expect, it } from 'vitest';
import { getNextReminder, reminderIsDue } from './reminders';
import type { DeskReminder } from '../types';

const reminders: DeskReminder[] = [
  { id: 'morning', title: '上班', time: '09:00', enabled: true, kind: 'work' },
  { id: 'water', title: '喝水', time: '10:00', enabled: true, kind: 'water' },
  { id: 'off', title: '关闭', time: '11:00', enabled: false, kind: 'rest' },
];

describe('reminders', () => {
  it('finds the next enabled reminder', () => {
    expect(getNextReminder(reminders, new Date('2026-10-05T09:30:00'))?.id).toBe('water');
  });

  it('wraps to the first reminder after the final reminder', () => {
    expect(getNextReminder(reminders, new Date('2026-10-05T20:00:00'))?.id).toBe('morning');
  });

  it('matches only the exact enabled minute', () => {
    expect(reminderIsDue(reminders[1], new Date('2026-10-05T10:00:20'))).toBe(true);
    expect(reminderIsDue(reminders[2], new Date('2026-10-05T11:00:00'))).toBe(false);
  });
});
