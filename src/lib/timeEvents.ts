import type { DeskTimeEvent } from '../types';

const DAY_MS = 86_400_000;

interface DateParts {
  year: number;
  month: number;
  day: number;
}

export interface TimeEventDisplay {
  eyebrow: '已经' | '还有' | '已过' | '就是今天';
  value: string;
  caption: string;
  tone: 'elapsed' | 'future' | 'past' | 'today';
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

function parseDateKey(value: string): DateParts | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return { year, month, day };
}

function dateKey(parts: DateParts): string {
  return `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`;
}

function dayNumber(parts: DateParts): number {
  return Math.floor(Date.UTC(parts.year, parts.month - 1, parts.day) / DAY_MS);
}

function localToday(value: Date): DateParts {
  return { year: value.getFullYear(), month: value.getMonth() + 1, day: value.getDate() };
}

function annualTarget(source: DateParts, today: DateParts): DateParts {
  const inYear = (year: number): DateParts => {
    const lastDay = new Date(Date.UTC(year, source.month, 0)).getUTCDate();
    return { year, month: source.month, day: Math.min(source.day, lastDay) };
  };
  const current = inYear(today.year);
  return dayNumber(current) >= dayNumber(today) ? current : inYear(today.year + 1);
}

export function isValidDateKey(value: string): boolean {
  return Boolean(parseDateKey(value));
}

export function formatTimeEventDate(value: string, includeYear = true): string {
  const parts = parseDateKey(value);
  if (!parts) return '';
  return `${includeYear ? `${parts.year}年` : ''}${parts.month}月${parts.day}日`;
}

export function describeTimeEvent(event: DeskTimeEvent, now = new Date()): TimeEventDisplay {
  const source = parseDateKey(event.date);
  if (!source) return { eyebrow: '还有', value: '--', caption: '日期无效', tone: 'past' };
  const today = localToday(now);
  const todayNumber = dayNumber(today);

  if (event.type === 'elapsed') {
    const difference = todayNumber - dayNumber(source);
    if (difference === 0) return { eyebrow: '就是今天', value: '今天', caption: `${formatTimeEventDate(event.date)} 开始`, tone: 'today' };
    if (difference > 0) return { eyebrow: '已经', value: `${difference} 天`, caption: `${formatTimeEventDate(event.date)} 至今`, tone: 'elapsed' };
    return { eyebrow: '还有', value: `${Math.abs(difference)} 天`, caption: `${formatTimeEventDate(event.date)} 开始`, tone: 'future' };
  }

  const target = event.repeatYearly ? annualTarget(source, today) : source;
  const difference = dayNumber(target) - todayNumber;
  const caption = event.repeatYearly
    ? `每年 ${formatTimeEventDate(dateKey(target), false)}`
    : formatTimeEventDate(event.date);
  if (difference === 0) return { eyebrow: '就是今天', value: '今天', caption, tone: 'today' };
  if (difference > 0) return { eyebrow: '还有', value: `${difference} 天`, caption, tone: 'future' };
  return { eyebrow: '已过', value: `${Math.abs(difference)} 天`, caption, tone: 'past' };
}

export function normalizeTimeEvents(value: unknown): DeskTimeEvent[] {
  if (!Array.isArray(value)) return [];
  const seenIds = new Set<string>();
  const result: DeskTimeEvent[] = [];
  for (const item of value) {
    if (!item || typeof item !== 'object') continue;
    const record = item as Partial<DeskTimeEvent>;
    const id = typeof record.id === 'string' ? record.id.trim() : '';
    const title = typeof record.title === 'string' ? record.title.trim().replace(/\s+/g, ' ').slice(0, 24) : '';
    const date = typeof record.date === 'string' ? record.date : '';
    const type = record.type === 'elapsed' || record.type === 'countdown' ? record.type : null;
    if (!id || seenIds.has(id) || !title || !type || !isValidDateKey(date)) continue;
    result.push({ id, title, date, type, repeatYearly: type === 'countdown' && record.repeatYearly === true });
    seenIds.add(id);
    if (result.length >= 20) break;
  }
  return result;
}
