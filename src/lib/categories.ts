import type { Shortcut } from '../types';

export function cleanCategoryName(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}

function categoryKey(value: string): string {
  return cleanCategoryName(value).toLocaleLowerCase('zh-CN');
}

export function categoryExists(categories: string[], name: string, except = ''): boolean {
  const key = categoryKey(name);
  const exceptKey = categoryKey(except);
  return categories.some((category) => categoryKey(category) === key && categoryKey(category) !== exceptKey);
}

export function moveCategory(categories: string[], name: string, direction: -1 | 1): string[] {
  const currentIndex = categories.indexOf(name);
  const targetIndex = currentIndex + direction;
  if (currentIndex < 0 || targetIndex < 0 || targetIndex >= categories.length) return categories;
  const next = [...categories];
  [next[currentIndex], next[targetIndex]] = [next[targetIndex], next[currentIndex]];
  return next;
}

export function renameCategory(categories: string[], shortcuts: Shortcut[], name: string, nextName: string) {
  const cleaned = cleanCategoryName(nextName);
  return {
    categories: categories.map((category) => category === name ? cleaned : category),
    shortcuts: shortcuts.map((shortcut) => shortcut.category === name ? { ...shortcut, category: cleaned } : shortcut),
  };
}

export function categoryDeleteTarget(categories: string[], name: string): string {
  const index = categories.indexOf(name);
  if (index < 0 || categories.length < 2) return '';
  return index > 0 ? categories[index - 1] : categories[1];
}

export function deleteCategory(categories: string[], shortcuts: Shortcut[], name: string) {
  const target = categoryDeleteTarget(categories, name);
  if (!target) return { categories, shortcuts, target: '' };
  return {
    categories: categories.filter((category) => category !== name),
    shortcuts: shortcuts.map((shortcut) => shortcut.category === name ? { ...shortcut, category: target } : shortcut),
    target,
  };
}
