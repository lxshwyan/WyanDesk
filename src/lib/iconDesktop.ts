import type { DeskWorkspace, Shortcut } from '../types';

/** Move an existing site, preserving identity, metadata and all other content. */
export function placeDesktopShortcut(workspace: DeskWorkspace, id: string, category: string, beforeId?: string): DeskWorkspace {
  if (!workspace.categories.includes(category) || id === beforeId) return workspace;
  const site = workspace.shortcuts.find((item) => item.id === id);
  const before = beforeId ? workspace.shortcuts.find((item) => item.id === beforeId) : undefined;
  if (!site || (beforeId && (!before || before.category !== category))) return workspace;
  const shortcuts = workspace.shortcuts.filter((item) => item.id !== id);
  const targetIndex = before ? shortcuts.findIndex((item) => item.id === before.id) : -1;
  const next: Shortcut = site.category === category ? site : { ...site, category };
  shortcuts.splice(targetIndex < 0 ? shortcuts.length : targetIndex, 0, next);
  return { ...workspace, shortcuts };
}

export function placeDesktopCategory(workspace: DeskWorkspace, category: string, before: string): DeskWorkspace {
  if (category === before || !workspace.categories.includes(category) || !workspace.categories.includes(before)) return workspace;
  const categories = workspace.categories.filter((item) => item !== category);
  categories.splice(categories.indexOf(before), 0, category);
  return { ...workspace, categories };
}
