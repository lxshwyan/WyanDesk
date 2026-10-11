import { describe, expect, it } from 'vitest';
import { shouldShowInPageReminder } from './reminderAlert';

describe('shouldShowInPageReminder', () => {
  it('uses the center alert only for a visible unlocked desktop', () => {
    expect(shouldShowInPageReminder('visible', false)).toBe(true);
    expect(shouldShowInPageReminder('hidden', false)).toBe(false);
    expect(shouldShowInPageReminder('visible', true)).toBe(false);
  });
});
