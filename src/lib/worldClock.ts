export interface WorldClockOption {
  id: string;
  city: string;
  region: string;
}

export interface WorldClockSnapshot {
  time: string;
  date: string;
  dayRelation: '昨天' | '今天' | '明天';
}

export const worldClockOptions: WorldClockOption[] = [
  { id: 'Asia/Shanghai', city: '北京', region: '中国' },
  { id: 'Asia/Tokyo', city: '东京', region: '日本' },
  { id: 'Asia/Singapore', city: '新加坡', region: '新加坡' },
  { id: 'Asia/Dubai', city: '迪拜', region: '阿联酋' },
  { id: 'Europe/London', city: '伦敦', region: '英国' },
  { id: 'Europe/Paris', city: '巴黎', region: '法国' },
  { id: 'America/New_York', city: '纽约', region: '美国东部' },
  { id: 'America/Los_Angeles', city: '洛杉矶', region: '美国西部' },
  { id: 'Australia/Sydney', city: '悉尼', region: '澳大利亚' },
  { id: 'Pacific/Auckland', city: '奥克兰', region: '新西兰' },
];

export const defaultWorldClockZones = ['Europe/London', 'America/New_York', 'Asia/Tokyo'];

const validZoneIds = new Set(worldClockOptions.map((option) => option.id));

export function normalizeWorldClockZones(value: unknown): string[] {
  if (!Array.isArray(value)) return [...defaultWorldClockZones];
  const zones = value.filter((zone): zone is string => typeof zone === 'string' && validZoneIds.has(zone));
  const unique = [...new Set(zones)].slice(0, 5);
  return unique.length ? unique : [...defaultWorldClockZones];
}

function dateNumber(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): number {
  return Number(parts.find((part) => part.type === type)?.value || 0);
}

export function worldClockSnapshot(now: Date, timeZone: string): WorldClockSnapshot {
  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone,
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(now);
  const year = dateNumber(parts, 'year');
  const month = dateNumber(parts, 'month');
  const day = dateNumber(parts, 'day');
  const hour = String(parts.find((part) => part.type === 'hour')?.value || '00').padStart(2, '0');
  const minute = String(parts.find((part) => part.type === 'minute')?.value || '00').padStart(2, '0');
  const weekday = parts.find((part) => part.type === 'weekday')?.value || '';
  const localDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const zonedDay = Date.UTC(year, month - 1, day);
  const difference = Math.round((zonedDay - localDay) / 86_400_000);
  return {
    time: `${hour}:${minute}`,
    date: `${month}月${day}日 ${weekday}`.trim(),
    dayRelation: difference < 0 ? '昨天' : difference > 0 ? '明天' : '今天',
  };
}
