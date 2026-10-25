import type { DeskState } from '../types';

export function searchMatches(query: string, ...parts: Array<string | undefined>): boolean {
  const text = parts.filter(Boolean).join(' ').normalize('NFKC').toLocaleLowerCase('zh-CN');
  return query.normalize('NFKC').trim().toLocaleLowerCase('zh-CN').split(/\s+/).filter(Boolean).every((term) => text.includes(term));
}

export interface DeskSearchItem {
  id: string;
  kind: 'task' | 'note' | 'inbox';
  workspaceId?: string;
  label: string;
  description: string;
  keywords: string;
}

export function deskSearchItems(state: DeskState): DeskSearchItem[] {
  return [
    ...state.workspaces.flatMap((workspace) => [
      ...workspace.tasks.map((task) => ({ id: task.id, kind: 'task' as const, workspaceId: workspace.id, label: task.text, description: `${workspace.name} · ${task.done ? '已完成任务' : '待办任务'}${task.dueDate ? ` · ${task.dueDate}` : ''}`, keywords: `${workspace.name} ${task.text} ${task.dueDate || ''}` })),
      ...(workspace.note.trim() ? [{ id: `note-${workspace.id}`, kind: 'note' as const, workspaceId: workspace.id, label: `${workspace.name} · 工作便签`, description: workspace.note.replace(/\s+/g, ' ').slice(0, 100), keywords: `${workspace.name} ${workspace.note}` }] : []),
    ]),
    ...state.inbox.map((item) => ({ id: item.id, kind: 'inbox' as const, label: item.content, description: `${item.kind === 'link' ? item.readAt ? '已读资料' : '稍后阅读' : '收集箱'}${item.url ? ` · ${item.url}` : ''}`, keywords: [item.content, item.url, item.excerpt, item.note].filter(Boolean).join(' ') })),
  ];
}

/** Interleave result kinds so a long command list cannot hide actual saved content. */
export function interleaveSearchResults<T>(groups: T[][], limit = 14): T[] {
  const result: T[] = [];
  for (let index = 0; groups.some((group) => index < group.length) && result.length < limit; index++) {
    for (const group of groups) if (index < group.length && result.length < limit) result.push(group[index]);
  }
  return result;
}
