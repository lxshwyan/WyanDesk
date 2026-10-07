import type { DeskTask } from '../types';

export function prioritizeTasks(tasks: DeskTask[], focusTaskId: string): DeskTask[] {
  if (!focusTaskId) return tasks;
  const focusIndex = tasks.findIndex((task) => task.id === focusTaskId);
  if (focusIndex <= 0) return tasks;
  return [tasks[focusIndex], ...tasks.slice(0, focusIndex), ...tasks.slice(focusIndex + 1)];
}

export function nextRecurringDate(date: string, recurrence: DeskTask['recurrence']): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !recurrence || recurrence === 'none') return '';
  const value = new Date(`${date}T12:00:00`);
  if (Number.isNaN(value.getTime())) return '';
  value.setDate(value.getDate() + (recurrence === 'weekly' ? 7 : 1));
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}
