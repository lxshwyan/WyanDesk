import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { clearLockPin, hasLockPin, saveLockPin, validLockPin, verifyLockPin } from './lockPin';

describe('local lock pin', () => {
  const values = new Map<string, string>();

  beforeEach(() => {
    values.clear();
    vi.stubGlobal('window', {
      localStorage: {
        getItem: (key: string) => values.get(key) || null,
        setItem: (key: string, value: string) => values.set(key, value),
        removeItem: (key: string) => values.delete(key),
      },
    });
  });

  afterEach(() => vi.unstubAllGlobals());

  it('accepts only a 4 to 8 digit pin', () => {
    expect(validLockPin('1234')).toBe(true);
    expect(validLockPin('12345678')).toBe(true);
    expect(validLockPin('123')).toBe(false);
    expect(validLockPin('12ab')).toBe(false);
  });

  it('stores a salted digest instead of the plain pin', async () => {
    await saveLockPin('2580');
    const stored = Array.from(values.values())[0];
    expect(stored).not.toContain('2580');
    expect(hasLockPin()).toBe(true);
    await expect(verifyLockPin('2580')).resolves.toBe(true);
    await expect(verifyLockPin('2581')).resolves.toBe(false);
  });

  it('replaces and clears the local credential', async () => {
    await saveLockPin('2580');
    await saveLockPin('8642');
    await expect(verifyLockPin('2580')).resolves.toBe(false);
    await expect(verifyLockPin('8642')).resolves.toBe(true);
    clearLockPin();
    expect(hasLockPin()).toBe(false);
  });
});
