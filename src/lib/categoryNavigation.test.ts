import { describe, expect, it } from 'vitest';
import { MAX_VISIBLE_SHORTCUT_CATEGORIES, visibleShortcutCategoryCount } from './categoryNavigation';

const measure = (overrides: Partial<Parameters<typeof visibleShortcutCategoryCount>[0]> = {}) => visibleShortcutCategoryCount({
  categoryWidths: [54, 72, 46, 54, 54, 54, 54, 54, 54, 54],
  totalCategoryCount: 10,
  availableWidth: 680,
  moreWidth: 66,
  categoryGap: 4,
  overflowGap: 6,
  ...overrides,
});

describe('shortcut category navigation', () => {
  it('shows every category when ten or fewer fit', () => {
    expect(measure()).toBe(10);
  });

  it('caps visible desktop categories at ten and reserves the trailing more control', () => {
    expect(measure({ totalCategoryCount: 12, availableWidth: 760 })).toBe(MAX_VISIBLE_SHORTCUT_CATEGORIES);
  });

  it('moves categories into more when the available width becomes narrow', () => {
    expect(measure({ availableWidth: 270 })).toBe(3);
  });

  it('can fall back to only the more control on extremely narrow widths', () => {
    expect(measure({ availableWidth: 70 })).toBe(0);
  });
});
