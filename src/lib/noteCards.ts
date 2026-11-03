import type { DeskNoteCard, DeskWorkspace, DeskWidgetId } from '../types';

export function normalizeNoteCards(value: unknown): DeskNoteCard[] {
  const seen = new Set<string>();
  return (Array.isArray(value) ? value : []).flatMap((item) => {
    if (!item || typeof item !== 'object' || typeof item.id !== 'string' || !/^note:[\w-]{1,100}$/.test(item.id) || seen.has(item.id) || seen.size >= 11) return [];
    seen.add(item.id);
    return [{ id: item.id as DeskNoteCard['id'], title: typeof item.title === 'string' && item.title.trim() ? item.title.trim().slice(0, 24) : '便签', content: typeof item.content === 'string' ? item.content.slice(0, 100000) : '', ...(item.hidden === true ? { hidden: true } : {}) }];
  });
}

export function updateNoteCard(workspace: DeskWorkspace, id: DeskWidgetId, patch: Partial<Pick<DeskNoteCard, 'title' | 'content' | 'hidden'>>): DeskWorkspace {
  const title = patch.title?.trim().slice(0, 24);
  if (id === 'notes') return { ...workspace, ...(title ? { noteTitle: title } : {}), ...(patch.content !== undefined ? { note: patch.content } : {}) };
  return { ...workspace, noteCards: workspace.noteCards?.map((note) => note.id === id ? { ...note, ...patch, title: title || note.title } : note) };
}

export function copyNoteCard(workspace: DeskWorkspace, sourceId: DeskWidgetId, id: DeskNoteCard['id']): DeskWorkspace {
  if ((workspace.noteCards?.length || 0) >= 11 || workspace.noteCards?.some((note) => note.id === id)) return workspace;
  const source = workspace.noteCards?.find((note) => note.id === sourceId);
  if (sourceId !== 'notes' && !source) return workspace;
  const note: DeskNoteCard = { id, title: `${source?.title || workspace.noteTitle || '工作便签'}副本`.slice(0, 24), content: source?.content ?? workspace.note };
  const widgetOrder = [...workspace.layout.widgetOrder];
  widgetOrder.splice(widgetOrder.indexOf(sourceId as Exclude<DeskWidgetId, 'shortcuts'>) + 1, 0, id);
  return { ...workspace, noteCards: [...(workspace.noteCards || []), note], layout: { ...workspace.layout, widgetOrder, widgets: { ...workspace.layout.widgets, [id]: { ...workspace.layout.widgets[sourceId], width: 'standard' } } } };
}

export function removeNoteCard(workspace: DeskWorkspace, id: DeskNoteCard['id']): DeskWorkspace {
  const widgets = { ...workspace.layout.widgets };
  delete widgets[id];
  return { ...workspace, noteCards: workspace.noteCards?.filter((note) => note.id !== id), layout: { ...workspace.layout, widgets, widgetOrder: workspace.layout.widgetOrder.filter((item) => item !== id) } };
}
