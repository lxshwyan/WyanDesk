export const DEFAULT_FOCUS_MINUTES = 25;
export const MIN_FOCUS_MINUTES = 1;
export const MAX_FOCUS_MINUTES = 240;

export function normalizeFocusMinutes(value: unknown, fallback = DEFAULT_FOCUS_MINUTES): number {
  if (typeof value !== 'number' || !Number.isInteger(value)) return fallback;
  if (value < MIN_FOCUS_MINUTES || value > MAX_FOCUS_MINUTES) return fallback;
  return value;
}

export function parseFocusMinutes(value: string): number | null {
  const trimmed = value.trim();
  if (!/^\d+$/.test(trimmed)) return null;
  const minutes = Number(trimmed);
  return normalizeFocusMinutes(minutes, 0) || null;
}
