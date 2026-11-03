import { describe, expect, it } from 'vitest';
import { normalizeWallpaperPreferences, selectedWallpaper, desktopBackground } from './wallpapers';
import { createDefaultState } from '../data/defaults';
import { migrateDeskState, parseDeskBackup, serializeDeskBackup } from './storage';

describe('curated local wallpapers', () => {
  it('does not replace an existing desktop or accept unknown sources', () => {
    expect(desktopBackground({ customBackground: '' }, new Date())).toBe('');
    expect(normalizeWallpaperPreferences({ selectedId: 'https://evil.test/a.jpg', favoriteIds: ['alpine-lake', 'bad', 'alpine-lake'], daily: 'true' })).toEqual({ selectedId: '', favoriteIds: ['alpine-lake'], daily: false });
    expect(desktopBackground({ customBackground: 'data:image/png;base64,user', wallpaper: { selectedId: 'alpine-lake', daily: true, favoriteIds: [] } }, new Date())).toBe('data:image/png;base64,user');
  });
  it('rotates only once each local date and honors favorites in stable catalog order', () => {
    const value = { daily: true, favoriteIds: ['coastal-clouds', 'alpine-lake'], selectedId: '' };
    const first = selectedWallpaper(value, new Date(2026, 10, 2, 0, 1))!;
    expect(selectedWallpaper(value, new Date(2026, 10, 2, 23, 59))?.id).toBe(first.id);
    expect(selectedWallpaper(value, new Date(2026, 10, 3))?.id).not.toBe(first.id);
    expect(['coastal-clouds', 'alpine-lake']).toContain(first.id);
  });
  it('round-trips the new settings through v9 backup and preserves converter visibility', () => {
    const state = createDefaultState();
    state.preferences.wallpaper = { selectedId: 'alpine-lake', daily: true, favoriteIds: ['dune-sunset'] };
    state.preferences.focusCycleEnabled = true; state.preferences.focusBreakMinutes = 10; state.preferences.showConverter = true;
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored.preferences).toMatchObject(state.preferences);
    expect(restored.workspaces[0].layout.widgetOrder).toContain('converter');
    expect(migrateDeskState({ version: 9, preferences: { focusBreakMinutes: 999, focusCycleEnabled: 'yes', showConverter: 'yes' } }).preferences).toMatchObject({ focusBreakMinutes: 5, focusCycleEnabled: false, showConverter: false });
  });
});
