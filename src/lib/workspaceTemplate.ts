import type { DeskWorkspace, Shortcut, ShortcutGroup } from '../types';
import { normalizeURL } from './storage';
import { createDefaultWorkspaceLayout } from './widgetLayout';

interface WorkspaceTemplate {
  product: 'WyanDeskTemplate';
  version: 1;
  exportedAt: string;
  workspace: Pick<DeskWorkspace, 'name' | 'categories' | 'shortcuts' | 'shortcutGroups'>;
}

export function serializeWorkspaceTemplate(workspace: DeskWorkspace, exportedAt = new Date()): string {
  const value: WorkspaceTemplate = {
    product: 'WyanDeskTemplate',
    version: 1,
    exportedAt: exportedAt.toISOString(),
    workspace: {
      name: workspace.name,
      categories: workspace.categories,
      shortcuts: workspace.shortcuts,
      shortcutGroups: workspace.shortcutGroups,
    },
  };
  return JSON.stringify(value, null, 2);
}

export function parseWorkspaceTemplate(value: string, id: string): DeskWorkspace {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    throw new Error('模板文件不是有效的 JSON');
  }
  if (!parsed || typeof parsed !== 'object') throw new Error('模板内容无效');
  const record = parsed as Partial<WorkspaceTemplate>;
  if (record.product !== 'WyanDeskTemplate' || record.version !== 1 || !record.workspace || typeof record.workspace !== 'object') throw new Error('不是可识别的 WyanDesk 模板');
  const source = record.workspace as Partial<WorkspaceTemplate['workspace']>;
  const categories = Array.isArray(source.categories) ? source.categories.filter((item): item is string => typeof item === 'string' && Boolean(item.trim())).map((item) => item.trim().slice(0, 16)) : [];
  const shortcuts: Shortcut[] = Array.isArray(source.shortcuts) ? source.shortcuts.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const shortcut = item as Partial<Shortcut>;
    if (typeof shortcut.id !== 'string' || typeof shortcut.title !== 'string' || typeof shortcut.url !== 'string') return [];
    try {
      return [{ id: shortcut.id, title: shortcut.title.trim().slice(0, 50), url: normalizeURL(shortcut.url), category: typeof shortcut.category === 'string' && shortcut.category.trim() ? shortcut.category.trim().slice(0, 16) : '常用', icon: typeof shortcut.icon === 'string' ? shortcut.icon.slice(0, 2) : 'W', accent: typeof shortcut.accent === 'string' ? shortcut.accent : '#3478f6', description: typeof shortcut.description === 'string' ? shortcut.description.slice(0, 80) : undefined }];
    } catch {
      return [];
    }
  }) : [];
  const shortcutIds = new Set(shortcuts.map((item) => item.id));
  const shortcutGroups: ShortcutGroup[] = Array.isArray(source.shortcutGroups) ? source.shortcutGroups.flatMap((item) => {
    if (!item || typeof item !== 'object') return [];
    const group = item as Partial<ShortcutGroup>;
    if (typeof group.id !== 'string' || typeof group.title !== 'string' || !Array.isArray(group.shortcutIds)) return [];
    return [{ id: group.id, title: group.title.trim().slice(0, 30), shortcutIds: group.shortcutIds.filter((shortcutId) => shortcutIds.has(shortcutId)) }];
  }) : [];
  for (const shortcut of shortcuts) if (!categories.includes(shortcut.category)) categories.push(shortcut.category);
  return {
    id,
    name: `${typeof source.name === 'string' && source.name.trim() ? source.name.trim().slice(0, 9) : '导入'}模板`,
    categories: categories.length ? [...new Set(categories)] : ['常用'],
    shortcuts,
    shortcutGroups,
    tasks: [],
    focusTaskId: '',
    note: '',
    events: [],
    recentShortcutIds: [],
    layout: createDefaultWorkspaceLayout(),
  };
}
