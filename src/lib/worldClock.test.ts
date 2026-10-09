import { describe, expect, it } from 'vitest';
import { defaultWorldClockZones, normalizeWorldClockZones, worldClockSnapshot } from './worldClock';

describe('world clock', () => {
  it('formats time in a selected IANA time zone', () => {
    const now = new Date('2026-10-09T12:05:00.000Z');
    expect(worldClockSnapshot(now, 'Asia/Shanghai').time).toBe('20:05');
    expect(worldClockSnapshot(now, 'America/New_York').time).toBe('08:05');
  });

  it('describes dates relative to the local browser day', () => {
    const now = new Date(2026, 9, 9, 23, 30);
    const snapshot = worldClockSnapshot(now, 'Pacific/Auckland');
    expect(['今天', '明天']).toContain(snapshot.dayRelation);
    expect(snapshot.date).toMatch(/\d+月\d+日/);
  });

  it('keeps valid unique zones and repairs invalid selections', () => {
    expect(normalizeWorldClockZones(['Asia/Tokyo', 'Asia/Tokyo', 'invalid'])).toEqual(['Asia/Tokyo']);
    expect(normalizeWorldClockZones([])).toEqual(defaultWorldClockZones);
    expect(normalizeWorldClockZones('Asia/Tokyo')).toEqual(defaultWorldClockZones);
  });
});
