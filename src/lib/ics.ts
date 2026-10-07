import type { DeskEvent, DeskTask, DeskWorkspace } from '../types';

function escapeText(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

function unescapeText(value: string): string {
  return value.replace(/\\n/gi, '\n').replace(/\\([\\,;])/g, '$1');
}

function compactDate(date: string): string {
  return date.replace(/-/g, '');
}

function nextDate(date: string): string {
  const value = new Date(`${date}T12:00:00`);
  value.setDate(value.getDate() + 1);
  const year = value.getFullYear();
  const month = `${value.getMonth() + 1}`.padStart(2, '0');
  const day = `${value.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function timestamp(value: Date): string {
  return value.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
}

function taskEvent(task: DeskTask, now: Date): string[] {
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeText(task.id)}@wyandesk`,
    `DTSTAMP:${timestamp(now)}`,
    `DTSTART;VALUE=DATE:${compactDate(task.dueDate || '')}`,
    `DTEND;VALUE=DATE:${compactDate(nextDate(task.dueDate || ''))}`,
    `SUMMARY:${escapeText(`待办：${task.text}`)}`,
    'X-WYANDESK-TYPE:TASK',
  ];
  if (task.recurrence === 'daily') lines.push('RRULE:FREQ=DAILY');
  if (task.recurrence === 'weekly') lines.push('RRULE:FREQ=WEEKLY');
  lines.push('END:VEVENT');
  return lines;
}

export function serializeWorkspaceICS(workspace: DeskWorkspace, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'CALSCALE:GREGORIAN', 'PRODID:-//WyanDesk//Calendar//ZH-CN'];
  for (const event of workspace.events) {
    lines.push(
      'BEGIN:VEVENT',
      `UID:${escapeText(event.id)}@wyandesk`,
      `DTSTAMP:${timestamp(now)}`,
      `DTSTART:${compactDate(event.date)}T${event.time.replace(':', '')}00`,
      `SUMMARY:${escapeText(event.title)}`,
      'X-WYANDESK-TYPE:EVENT',
      'END:VEVENT',
    );
  }
  for (const task of workspace.tasks) {
    if (task.dueDate && !task.done) lines.push(...taskEvent(task, now));
  }
  lines.push('END:VCALENDAR');
  return `${lines.join('\r\n')}\r\n`;
}

function dateAndTime(raw: string): { date: string; time: string } | null {
  const value = raw.trim();
  const match = value.match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2}))?/);
  if (!match) return null;
  return { date: `${match[1]}-${match[2]}-${match[3]}`, time: match[4] && match[5] ? `${match[4]}:${match[5]}` : '09:00' };
}

export function parseICS(value: string): DeskEvent[] {
  const lines = value.replace(/\r?\n[ \t]/g, '').split(/\r?\n/);
  const events: DeskEvent[] = [];
  let current: Record<string, string> | null = null;
  for (const line of lines) {
    if (line === 'BEGIN:VEVENT') {
      current = {};
      continue;
    }
    if (line === 'END:VEVENT') {
      if (current?.SUMMARY && current.DTSTART) {
        const parsed = dateAndTime(current.DTSTART);
        if (parsed) events.push({ id: `ics-${crypto.randomUUID()}`, title: unescapeText(current.SUMMARY).replace(/^待办：/, ''), ...parsed });
      }
      current = null;
      continue;
    }
    if (!current) continue;
    const separator = line.indexOf(':');
    if (separator < 0) continue;
    const key = line.slice(0, separator).split(';')[0].toUpperCase();
    if (key === 'SUMMARY' || key === 'DTSTART') current[key] = line.slice(separator + 1);
  }
  return events;
}
