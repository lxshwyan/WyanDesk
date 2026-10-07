export type LockActivityKind = 'pointer' | 'keyboard' | 'context-switch' | 'fullscreen-exit' | 'failed-unlock';

export interface LockActivityEntry {
  id: string;
  sessionId: string;
  sessionStartedAt: string;
  kind: LockActivityKind;
  firstAt: string;
  lastAt: string;
  count: number;
}

export interface LockActivityInput {
  id: string;
  sessionId: string;
  sessionStartedAt: string;
  kind: LockActivityKind;
  occurredAt: string;
}

const STORAGE_KEY = 'wyandesk.lock-activity.v1';
export const LOCK_ACTIVITY_LIMIT = 80;
export const LOCK_ACTIVITY_MERGE_WINDOW_MS = 1_500;

const activityKinds = new Set<LockActivityKind>(['pointer', 'keyboard', 'context-switch', 'fullscreen-exit', 'failed-unlock']);

function validDate(value: unknown): value is string {
  return typeof value === 'string' && Number.isFinite(Date.parse(value));
}

export function normalizeLockActivityLog(value: unknown): LockActivityEntry[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const record = item as Partial<LockActivityEntry>;
    if (typeof record.id !== 'string' || typeof record.sessionId !== 'string' || !activityKinds.has(record.kind as LockActivityKind)) return [];
    if (!validDate(record.sessionStartedAt) || !validDate(record.firstAt) || !validDate(record.lastAt)) return [];
    const count = typeof record.count === 'number' && Number.isFinite(record.count) ? Math.max(1, Math.min(9_999, Math.round(record.count))) : 1;
    return [{
      id: record.id,
      sessionId: record.sessionId,
      sessionStartedAt: record.sessionStartedAt,
      kind: record.kind as LockActivityKind,
      firstAt: record.firstAt,
      lastAt: record.lastAt,
      count,
    }];
  }).slice(-LOCK_ACTIVITY_LIMIT);
}

export function appendLockActivity(log: LockActivityEntry[], input: LockActivityInput): LockActivityEntry[] {
  const current = normalizeLockActivityLog(log);
  const previous = current.at(-1);
  const occurredAt = validDate(input.occurredAt) ? input.occurredAt : new Date().toISOString();
  const canMerge = previous
    && previous.sessionId === input.sessionId
    && previous.kind === input.kind
    && Math.abs(Date.parse(occurredAt) - Date.parse(previous.lastAt)) <= LOCK_ACTIVITY_MERGE_WINDOW_MS;

  if (canMerge) {
    const count = input.kind === 'context-switch' ? previous.count : Math.min(9_999, previous.count + 1);
    return [...current.slice(0, -1), { ...previous, lastAt: occurredAt, count }];
  }

  return [...current, {
    id: input.id,
    sessionId: input.sessionId,
    sessionStartedAt: input.sessionStartedAt,
    kind: input.kind,
    firstAt: occurredAt,
    lastAt: occurredAt,
    count: 1,
  }].slice(-LOCK_ACTIVITY_LIMIT);
}

export function readLockActivityLog(): LockActivityEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return normalizeLockActivityLog(JSON.parse(raw));
  } catch {
    return [];
  }
}

export function writeLockActivityLog(log: LockActivityEntry[]): void {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeLockActivityLog(log)));
}

export function clearLockActivityLog(): void {
  window.localStorage.removeItem(STORAGE_KEY);
}

export function countLockActivity(entries: LockActivityEntry[]): number {
  return entries.reduce((total, entry) => total + entry.count, 0);
}
