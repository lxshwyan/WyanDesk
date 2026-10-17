import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MINUTE_MS, SECOND_MS, millisecondsUntilNextBoundary, startAlignedClock } from './alignedClock';

describe('aligned clock', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-15T04:34:45.250Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('aligns updates to the next boundary instead of drifting from mount time', () => {
    expect(millisecondsUntilNextBoundary(Date.now(), MINUTE_MS)).toBe(14_750);
    expect(millisecondsUntilNextBoundary(Date.now(), SECOND_MS)).toBe(750);
  });

  it('keeps exactly one pending timer across a simulated ten-hour desktop session', () => {
    const onTick = vi.fn();
    const stop = startAlignedClock(MINUTE_MS, onTick);

    expect(vi.getTimerCount()).toBe(1);
    vi.advanceTimersByTime(10 * 60 * MINUTE_MS);

    expect(onTick).toHaveBeenCalledTimes(600);
    expect(vi.getTimerCount()).toBe(1);

    stop();
    expect(vi.getTimerCount()).toBe(0);
  });

  it('keeps the lock-screen second clock bounded during ten simulated hours', () => {
    const onTick = vi.fn();
    const stop = startAlignedClock(SECOND_MS, onTick);

    vi.advanceTimersByTime(10 * 60 * MINUTE_MS);

    expect(onTick).toHaveBeenCalledTimes(36_000);
    expect(vi.getTimerCount()).toBe(1);

    stop();
    expect(vi.getTimerCount()).toBe(0);
  });
});
