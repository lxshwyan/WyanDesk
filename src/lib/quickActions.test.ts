import { describe, expect, it } from 'vitest';
import { DEFAULT_QUICK_ACTION_IDS, normalizeQuickActionIds } from './quickActions';

describe('normalizeQuickActionIds', () => {
  it('uses the useful defaults when saved data has no valid selection', () => {
    expect(normalizeQuickActionIds(undefined)).toEqual(DEFAULT_QUICK_ACTION_IDS);
    expect(normalizeQuickActionIds([])).toEqual(DEFAULT_QUICK_ACTION_IDS);
    expect(normalizeQuickActionIds(['', 1, null])).toEqual(DEFAULT_QUICK_ACTION_IDS);
  });

  it('trims, deduplicates, and limits configured actions to three', () => {
    expect(normalizeQuickActionIds([
      ' open-shortcut-docs ',
      'open-group-work',
      'open-shortcut-docs',
      'new-task',
      'new-event',
    ])).toEqual(['open-shortcut-docs', 'open-group-work', 'new-task']);
  });
});
