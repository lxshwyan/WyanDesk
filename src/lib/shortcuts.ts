import type { Shortcut } from '../types';
import { normalizeURL } from './storage';

export function shortcutURLExists(shortcuts: Shortcut[], value: string, exceptId = ''): boolean {
  let normalized = '';
  try {
    normalized = normalizeURL(value);
  } catch {
    return false;
  }
  return shortcuts.some((shortcut) => {
    if (shortcut.id === exceptId) return false;
    try {
      return normalizeURL(shortcut.url) === normalized;
    } catch {
      return false;
    }
  });
}

export function moveShortcutInCategory(shortcuts: Shortcut[], id: string, direction: -1 | 1): Shortcut[] {
  const currentIndex = shortcuts.findIndex((shortcut) => shortcut.id === id);
  if (currentIndex < 0) return shortcuts;
  const category = shortcuts[currentIndex].category;
  const categoryIndices = shortcuts
    .map((shortcut, index) => shortcut.category === category ? index : -1)
    .filter((index) => index >= 0);
  const position = categoryIndices.indexOf(currentIndex);
  const targetIndex = categoryIndices[position + direction];
  if (targetIndex === undefined) return shortcuts;
  const next = [...shortcuts];
  [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
  return next;
}

export function moveShortcutToCategory(shortcuts: Shortcut[], id: string, category: string): Shortcut[] {
  const target = category.trim();
  if (!target) return shortcuts;
  const shortcut = shortcuts.find((item) => item.id === id);
  if (!shortcut || shortcut.category === target) return shortcuts;
  return shortcuts.map((item) => item.id === id ? { ...item, category: target } : item);
}

export function directURLFromInput(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return '';
  const looksLikeURL = /^https?:\/\//i.test(trimmed)
    || /^(?:[a-z\d](?:[a-z\d-]*[a-z\d])?\.)+[a-z]{2,}(?::\d+)?(?:[/?#].*)?$/i.test(trimmed);
  if (!looksLikeURL) return '';
  try {
    return normalizeURL(trimmed);
  } catch {
    return '';
  }
}
