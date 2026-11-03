import { describe, expect, it } from 'vitest';
import { createBalancedState } from '../data/defaults';
import { currentDesktopMode, withDesktopMode } from './desktopMode';

describe('display modes preserve user work', () => {
  it('opens the icon desktop directly and returns from minimal mode with the same sites', () => {
    const state = createBalancedState();
    const icons = withDesktopMode(state, 'icons');
    expect(currentDesktopMode(icons)).toBe('icons');
    expect(icons.workspaces[0].viewMode).toBe('work');
    expect(icons.workspaces[0].shortcutStyle).toBe('icons');
    expect(icons.workspaces[0].shortcuts).toBe(state.workspaces[0].shortcuts);
    expect(icons.workspaces[0].tasks).toBe(state.workspaces[0].tasks);
    const minimal = withDesktopMode(icons, 'minimal');
    expect(currentDesktopMode({ ...minimal, preferences: { ...minimal.preferences, minimalMode: false } })).toBe('icons');
    expect(currentDesktopMode(withDesktopMode(icons, 'work'))).toBe('work');
  });
  it('recognises an older icon candidate and leaves component visibility untouched', () => {
    const state = createBalancedState();
    state.workspaces[0].viewMode = 'navigation';
    state.workspaces[0].shortcutStyle = 'icons';
    state.preferences.showNotes = true;
    state.preferences.showCalendar = false;
    expect(currentDesktopMode(state)).toBe('icons');
    for (const mode of ['icons', 'work', 'navigation', 'minimal'] as const) {
      const next = withDesktopMode(state, mode);
      expect(next.preferences.showNotes).toBe(true);
      expect(next.preferences.showCalendar).toBe(false);
      expect(next.workspaces[0].layout).toBe(state.workspaces[0].layout);
    }
  });
  it('changes only the active view and keeps every content reference', () => {
    const state = createBalancedState();
    state.workspaces[0].note = '不能丢失的便签';
    const next = withDesktopMode(state, 'navigation');
    expect(currentDesktopMode(next)).toBe('navigation');
    expect(next.workspaces[0].note).toBe('不能丢失的便签');
    for (const field of ['shortcuts', 'tasks', 'events', 'layout', 'shortcutGroups'] as const) expect(next.workspaces[0][field]).toBe(state.workspaces[0][field]);
    expect(next.favoriteGroups).toBe(state.favoriteGroups);
    expect(next.workspaces[1]).toBe(state.workspaces[1]);
    expect(next.version).toBe(9);
  });
  it('restores the previous view after minimal mode without resetting layouts', () => {
    const navigation = withDesktopMode(createBalancedState(), 'navigation');
    const minimal = withDesktopMode(navigation, 'minimal');
    expect(currentDesktopMode(minimal)).toBe('minimal');
    expect(minimal.workspaces).toBe(navigation.workspaces);
    expect(currentDesktopMode({ ...minimal, preferences: { ...minimal.preferences, minimalMode: false } })).toBe('navigation');
    expect(currentDesktopMode(withDesktopMode(minimal, 'work'))).toBe('work');
  });
});
