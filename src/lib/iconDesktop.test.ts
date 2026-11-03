import { describe, expect, it } from 'vitest';
import { createDefaultState } from '../data/defaults';
import { placeDesktopCategory, placeDesktopShortcut } from './iconDesktop';
import { migrateDeskState, parseDeskBackup, serializeDeskBackup } from './storage';
import { withDesktopMode } from './desktopMode';

function fixture() {
  const workspace = createDefaultState().workspaces[0];
  workspace.categories = ['工作', '生活', '空组'];
  workspace.shortcuts = [
    { id: 'a', title: '工作甲', url: 'https://a.example', icon: '甲', accent: '#2468d8', category: '工作' },
    { id: 'b', title: '生活乙', url: 'https://b.example', icon: '乙', accent: '#2468d8', category: '生活' },
    { id: 'c', title: '工作丙', url: 'https://c.example', icon: '丙', accent: '#2468d8', category: '工作' },
  ];
  return workspace;
}

describe('icon desktop preserves saved work', () => {
  it('moves between groups before an explicit site without duplicating IDs or changing metadata', () => {
    const original = fixture();
    const next = placeDesktopShortcut(original, 'a', '生活', 'b');
    expect(next.shortcuts.map((site) => site.id)).toEqual(['a', 'b', 'c']);
    expect(next.shortcuts[0]).toEqual({ ...original.shortcuts[0], category: '生活' });
    expect(original.shortcuts[0].category).toBe('工作');
    expect(next.shortcuts[1]).toBe(original.shortcuts[1]);
    expect(next.tasks).toBe(original.tasks);
    expect(next.layout).toBe(original.layout);
  });
  it('reorders a site in its existing group and can move it into an empty group', () => {
    const original = fixture();
    const reordered = placeDesktopShortcut(original, 'c', '工作', 'a');
    expect(reordered.shortcuts.filter((site) => site.category === '工作').map((site) => site.id)).toEqual(['c', 'a']);
    expect(placeDesktopShortcut(reordered, 'a', '空组').shortcuts.find((site) => site.id === 'a')?.category).toBe('空组');
  });
  it('ignores stale IDs, removed targets and mismatched drop destinations', () => {
    const original = fixture();
    for (const [id, category, before] of [['missing', '工作', undefined], ['a', '已删除', undefined], ['a', '生活', 'c'], ['a', '工作', 'missing'], ['a', '工作', 'a']] as const) {
      expect(placeDesktopShortcut(original, id, category, before)).toBe(original);
    }
  });
  it('reorders categories without changing websites or any saved content', () => {
    const original = fixture();
    const next = placeDesktopCategory(original, '空组', '工作');
    expect(next.categories).toEqual(['空组', '工作', '生活']);
    expect(next.shortcuts).toBe(original.shortcuts);
    expect(next.tasks).toBe(original.tasks);
    expect(placeDesktopCategory(original, 'missing', '工作')).toBe(original);
  });
  it('keeps icon style, empty categories and content through JSON backup and display modes', () => {
    const state = createDefaultState();
    state.workspaces[0] = { ...fixture(), shortcutStyle: 'icons', note: '保留的便签' };
    const restored = parseDeskBackup(serializeDeskBackup(state));
    expect(restored.workspaces[0].shortcutStyle).toBe('icons');
    expect(restored.workspaces[0].categories).toEqual(['工作', '生活', '空组']);
    for (const mode of ['navigation', 'minimal', 'work'] as const) {
      const next = withDesktopMode(restored, mode);
      expect(next.workspaces[0].shortcutStyle).toBe(mode === 'minimal' ? 'icons' : 'cards');
      expect(next.workspaces[0].note).toBe('保留的便签');
      expect(next.workspaces[0].shortcuts).toEqual(state.workspaces[0].shortcuts);
    }
  });
  it('defaults existing or invalid style values to cards without resetting any sites', () => {
    const state = createDefaultState();
    const original = fixture();
    delete original.shortcutStyle;
    state.workspaces[0] = original;
    const restored = migrateDeskState(state);
    expect(restored.workspaces[0].shortcutStyle).toBe('cards');
    expect(restored.workspaces[0].shortcuts).toEqual(original.shortcuts);
    expect(migrateDeskState({ ...state, workspaces: [{ ...original, shortcutStyle: 'unknown' }] }).workspaces[0].shortcutStyle).toBe('cards');
  });
});
