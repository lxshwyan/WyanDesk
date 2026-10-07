import { describe, expect, it } from 'vitest';
import { DEFAULT_FOCUS_MINUTES, normalizeFocusMinutes, parseFocusMinutes } from './focusTimer';

describe('focus timer minutes', () => {
  it('accepts whole-minute values from 1 through 240', () => {
    expect(parseFocusMinutes('1')).toBe(1);
    expect(parseFocusMinutes(' 45 ')).toBe(45);
    expect(parseFocusMinutes('240')).toBe(240);
  });

  it('rejects empty, fractional and out-of-range values', () => {
    expect(parseFocusMinutes('')).toBeNull();
    expect(parseFocusMinutes('1.5')).toBeNull();
    expect(parseFocusMinutes('0')).toBeNull();
    expect(parseFocusMinutes('241')).toBeNull();
  });

  it('normalizes unsafe saved values to the default', () => {
    expect(normalizeFocusMinutes(50)).toBe(50);
    expect(normalizeFocusMinutes('50')).toBe(DEFAULT_FOCUS_MINUTES);
    expect(normalizeFocusMinutes(Number.NaN)).toBe(DEFAULT_FOCUS_MINUTES);
    expect(normalizeFocusMinutes(999)).toBe(DEFAULT_FOCUS_MINUTES);
  });
});
