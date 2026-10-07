import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { appendLockActivity, LOCK_ACTIVITY_LIMIT, normalizeLockActivityLog, readLockActivityLog, writeLockActivityLog } from './lockActivity';

function input(index: number, kind: 'pointer' | 'keyboard' = 'pointer') {
  return {
    id: `entry-${index}`,
    sessionId: 'session-1',
    sessionStartedAt: '2026-10-07T08:00:00.000Z',
    kind,
    occurredAt: new Date(Date.parse('2026-10-07T08:00:00.000Z') + index * 1_000).toISOString(),
  } as const;
}

describe('lock activity log', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) ?? null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('merges repeated activity of the same kind in a short window', () => {
    const first = appendLockActivity([], input(0));
    const second = appendLockActivity(first, input(1));
    expect(second).toHaveLength(1);
    expect(second[0].count).toBe(2);
    expect(second[0].lastAt).toBe(input(1).occurredAt);
  });

  it('keeps different activity kinds as separate entries', () => {
    const first = appendLockActivity([], input(0));
    const second = appendLockActivity(first, input(1, 'keyboard'));
    expect(second.map((entry) => entry.kind)).toEqual(['pointer', 'keyboard']);
  });

  it('deduplicates blur and hidden signals for the same context switch', () => {
    const first = appendLockActivity([], { ...input(0), kind: 'context-switch' });
    const second = appendLockActivity(first, { ...input(1), kind: 'context-switch' });
    expect(second).toHaveLength(1);
    expect(second[0].count).toBe(1);
  });

  it('limits retained entries and removes malformed saved values', () => {
    let log = [] as ReturnType<typeof normalizeLockActivityLog>;
    for (let index = 0; index < LOCK_ACTIVITY_LIMIT + 5; index += 1) {
      log = appendLockActivity(log, { ...input(index * 3), sessionId: `session-${index}` });
    }
    expect(log).toHaveLength(LOCK_ACTIVITY_LIMIT);
    expect(normalizeLockActivityLog([{}, log[0]])).toEqual([log[0]]);
  });

  it('round-trips the local-only storage payload', () => {
    const log = appendLockActivity([], input(0));
    writeLockActivityLog(log);
    expect(readLockActivityLog()).toEqual(log);
  });

  it('fails closed when local storage cannot be read', () => {
    vi.stubGlobal('window', {
      localStorage: {
        getItem: () => { throw new Error('blocked'); },
      },
    });
    expect(readLockActivityLog()).toEqual([]);
  });
});
