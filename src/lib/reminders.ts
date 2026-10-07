import type { DeskReminder } from '../types';

export function minutesFromTime(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function getNextReminder(reminders: DeskReminder[], date = new Date()): DeskReminder | null {
  const enabled = reminders.filter((item) => item.enabled).sort((a, b) => a.time.localeCompare(b.time));
  if (!enabled.length) return null;
  const now = date.getHours() * 60 + date.getMinutes();
  return enabled.find((item) => minutesFromTime(item.time) >= now) || enabled[0];
}

export function reminderIsDue(reminder: DeskReminder, date = new Date()): boolean {
  const current = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  return reminder.enabled && reminder.time === current;
}
