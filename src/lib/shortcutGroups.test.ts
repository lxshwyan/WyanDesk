import { describe, expect, it } from 'vitest';
import { toggleShortcutGroupMembership } from './shortcutGroups';

describe('toggleShortcutGroupMembership', () => {
  it('adds a shortcut once and preserves the other groups', () => {
    const result = toggleShortcutGroupMembership([
      { id: 'work', title: '工作', shortcutIds: ['docs'] },
      { id: 'study', title: '学习', shortcutIds: [] },
    ], 'work', 'mail');

    expect(result).toEqual({
      included: true,
      groups: [
        { id: 'work', title: '工作', shortcutIds: ['docs', 'mail'] },
        { id: 'study', title: '学习', shortcutIds: [] },
      ],
    });
  });

  it('removes an existing shortcut from only the selected group', () => {
    const result = toggleShortcutGroupMembership([
      { id: 'work', title: '工作', shortcutIds: ['docs', 'mail'] },
      { id: 'study', title: '学习', shortcutIds: ['mail'] },
    ], 'work', 'mail');

    expect(result).toEqual({
      included: false,
      groups: [
        { id: 'work', title: '工作', shortcutIds: ['docs'] },
        { id: 'study', title: '学习', shortcutIds: ['mail'] },
      ],
    });
  });

  it('does not mutate data when the group no longer exists', () => {
    expect(toggleShortcutGroupMembership([], 'missing', 'mail')).toBeNull();
  });
});
