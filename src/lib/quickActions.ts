export const DEFAULT_QUICK_ACTION_IDS = ['new-task', 'new-event', 'start-focus'] as const;
export const MAX_QUICK_ACTIONS = 3;

export function normalizeQuickActionIds(value: unknown): string[] {
  if (!Array.isArray(value)) return [...DEFAULT_QUICK_ACTION_IDS];
  const ids = value
    .filter((item): item is string => typeof item === 'string')
    .map((item) => item.trim())
    .filter(Boolean);
  const unique = [...new Set(ids)].slice(0, MAX_QUICK_ACTIONS);
  return unique.length ? unique : [...DEFAULT_QUICK_ACTION_IDS];
}
