import type { ShortcutGroup } from '../types';

export interface ShortcutGroupMembershipResult {
  groups: ShortcutGroup[];
  included: boolean;
}

export function toggleShortcutGroupMembership(
  groups: ShortcutGroup[],
  groupId: string,
  shortcutId: string,
): ShortcutGroupMembershipResult | null {
  const target = groups.find((group) => group.id === groupId);
  if (!target) return null;

  const included = !target.shortcutIds.includes(shortcutId);
  return {
    included,
    groups: groups.map((group) => group.id !== groupId
      ? group
      : {
          ...group,
          shortcutIds: included
            ? [...group.shortcutIds, shortcutId]
            : group.shortcutIds.filter((id) => id !== shortcutId),
        }),
  };
}
