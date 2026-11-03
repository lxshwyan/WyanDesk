import { describe, expect, it } from 'vitest';
import { createDefaultState, createBalancedState } from '../data/defaults';
import { applyAppearanceSelection, captureAppearance, normalizeWallpaperView, selectAppearancePreset } from './appearance';

describe('appearance preview and application', () => {
  it('projects each full preset without changing saved content or other desktops', () => {
    const state = createBalancedState(); const original = structuredClone(state);
    for (const id of ['daily', 'study', 'clear'] as const) {
      const next = applyAppearanceSelection(state, selectAppearancePreset(state, id));
      expect(state).toEqual(original); expect(next.workspaces.slice(1)).toEqual(state.workspaces.slice(1));
      for (const key of ['shortcuts', 'tasks', 'events', 'note', 'noteCards', 'name', 'id'] as const) expect(next.workspaces[0][key]).toEqual(state.workspaces[0][key]);
      expect(next.favoriteGroups).toEqual(state.favoriteGroups); expect(next.preferences.focusDurationMinutes).toBe(state.preferences.focusDurationMinutes);
    }
  });
  it('restores display choices while keeping edits made after application', () => {
    const original = createDefaultState(); const before = captureAppearance(original);
    const next = applyAppearanceSelection(original, selectAppearancePreset(original, 'study'));
    next.workspaces[0].note = '应用之后新增的便签';
    const restored = applyAppearanceSelection(next, before);
    expect(captureAppearance(restored)).toEqual(before); expect(restored.workspaces[0].note).toBe('应用之后新增的便签');
  });
  it('keeps saved block images in the clear preset and does not reset widget sizes', () => {
    const state = createDefaultState(); state.workspaces[0].layout.widgets.notes = { width: 'wide', height: 'tall', background: { color: '#123456' } };
    const next = applyAppearanceSelection(state, selectAppearancePreset(state, 'clear'));
    expect(next.workspaces[0].layout.widgets.notes).toEqual(state.workspaces[0].layout.widgets.notes);
    expect(next.preferences.transparentAppearance).toBe(true);
  });
  it('restores the underlying icon layout when the original appearance was minimal', () => {
    const state = createDefaultState(); state.preferences.minimalMode = true;
    const before = captureAppearance(state); const styled = applyAppearanceSelection(state, selectAppearancePreset(state, 'study'));
    const restored = applyAppearanceSelection(styled, before);
    expect(restored.preferences.minimalMode).toBe(true); expect(restored.workspaces[0].shortcutStyle).toBe('icons');
  });
  it('bounds image position and strength and rejects malformed saved values', () => {
    expect(normalizeWallpaperView({ x: -50, y: 300, strength: 300, tone: 'dark' })).toEqual({ x: 0, y: 100, strength: 30, tone: 'dark' });
    expect(normalizeWallpaperView({ x: '50', y: Infinity, tone: 'invalid' })).toEqual({ x: 50, y: 50, strength: 10, tone: 'light' });
  });
});
