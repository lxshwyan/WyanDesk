import type { DeskInboxItem, DeskWorkspace, Shortcut } from '../types';

export function readingURL(value: unknown): string | undefined {
  if (typeof value !== 'string' || value.length > 4096) return;
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return;
    return url.href;
  } catch { return; }
}

export function normalizeInboxItems(value: unknown): DeskInboxItem[] {
  if (!Array.isArray(value)) return [];
  const seen = new Set<string>();
  return value.flatMap((entry) => {
    if (!entry || typeof entry !== 'object') return [];
    const item = entry as Partial<DeskInboxItem>;
    if (typeof item.id !== 'string' || !item.id || seen.has(item.id)) return [];
    if (!['link', 'task', 'note'].includes(item.kind || '') || typeof item.content !== 'string' || !item.content.trim()) return [];
    seen.add(item.id);
    return [{
      id: item.id,
      kind: item.kind!,
      content: item.content.trim().slice(0, 500),
      url: readingURL(item.url),
      createdAt: typeof item.createdAt === 'string' && Number.isFinite(Date.parse(item.createdAt)) ? item.createdAt : new Date().toISOString(),
      ...(typeof item.readAt === 'string' && Number.isFinite(Date.parse(item.readAt)) ? { readAt: item.readAt } : {}),
      ...(typeof item.excerpt === 'string' && item.excerpt.trim() ? { excerpt: item.excerpt.trim().slice(0, 2000) } : {}),
      ...(typeof item.note === 'string' && item.note.trim() ? { note: item.note.trim().slice(0, 1000) } : {}),
    }];
  });
}

export function readingItemText(item: DeskInboxItem): string {
  return [...new Set([item.content, item.excerpt, item.note, item.url].filter(Boolean))].join('\n\n');
}

export function organizeReadingItem(workspace: DeskWorkspace, item: DeskInboxItem, category: string, newId: string): DeskWorkspace {
  const text = readingItemText(item);
  if (item.kind === 'task') return { ...workspace, tasks: [{ id: newId, text, done: false, createdAt: new Date().toISOString() }, ...workspace.tasks] };
  if (item.kind === 'note') return { ...workspace, note: [workspace.note.trim(), text].filter(Boolean).join('\n\n') };
  const url = readingURL(item.url);
  if (!url) return workspace;
  const note = item.excerpt || item.note ? [workspace.note.trim(), text].filter(Boolean).join('\n\n') : workspace.note;
  if (workspace.shortcuts.some((shortcut) => readingURL(shortcut.url) === url)) return { ...workspace, note };
  const title = item.content === item.url ? new URL(url).hostname.replace(/^www\./, '') : item.content;
  const shortcut: Shortcut = { id: newId, title: title.slice(0, 50), url, category, icon: title.slice(0, 2), accent: '#3478f6', description: '来自稍后阅读' };
  return { ...workspace, note, categories: workspace.categories.includes(category) ? workspace.categories : [...workspace.categories, category], shortcuts: [...workspace.shortcuts, shortcut] };
}
