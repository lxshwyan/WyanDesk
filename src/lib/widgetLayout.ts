import type { DeskRailWidgetId, DeskRailWidth, DeskWidgetHeight, DeskWidgetId, DeskWidgetSize, DeskWidgetWidth, DeskWorkspaceLayout } from '../types';

export const deskWidgetIds: DeskWidgetId[] = ['shortcuts', 'quickActions', 'schedule', 'focus', 'reminders', 'tasks', 'notes', 'calendar', 'calculator', 'worldClock', 'dailyOverview', 'weather', 'clipboard', 'countdown'];
export const deskRailWidgetIds: DeskRailWidgetId[] = ['quickActions', 'dailyOverview', 'notes', 'weather', 'countdown', 'clipboard', 'schedule', 'tasks', 'reminders', 'focus', 'calendar', 'calculator', 'worldClock'];

export function createDefaultWorkspaceLayout(): DeskWorkspaceLayout {
  const widgets = Object.fromEntries(deskWidgetIds.map((id) => [id, { width: 'standard', height: 'standard' }])) as Record<DeskWidgetId, DeskWidgetSize>;
  widgets.notes = { width: 'wide', height: 'standard' };
  return {
    railWidth: 'balanced',
    widgets,
    widgetOrder: [...deskRailWidgetIds],
  };
}

export function normalizeWorkspaceLayout(value: unknown): DeskWorkspaceLayout {
  const defaults = createDefaultWorkspaceLayout();
  if (!value || typeof value !== 'object') return defaults;
  const record = value as { railWidth?: unknown; widgets?: unknown; widgetOrder?: unknown };
  const railWidth: DeskRailWidth = record.railWidth === 'sites' || record.railWidth === 'widgets' ? record.railWidth : 'balanced';
  const savedWidgets = record.widgets && typeof record.widgets === 'object' ? record.widgets as Record<string, unknown> : {};
  const widgets = { ...defaults.widgets };
  for (const id of deskWidgetIds) {
    const item = savedWidgets[id];
    if (!item || typeof item !== 'object') continue;
    const saved = item as { width?: unknown; height?: unknown };
    const width: DeskWidgetWidth = saved.width === 'medium' || saved.width === 'wide' ? saved.width : 'standard';
    const height: DeskWidgetHeight = saved.height === 'compact' || saved.height === 'tall' ? saved.height : 'standard';
    widgets[id] = { width, height };
  }
  const savedOrder = Array.isArray(record.widgetOrder) ? record.widgetOrder : [];
  const widgetOrder = savedOrder.filter((id): id is DeskRailWidgetId => (
    typeof id === 'string' && deskRailWidgetIds.includes(id as DeskRailWidgetId)
  ));
  const uniqueOrder = [...new Set(widgetOrder)];
  for (const id of deskRailWidgetIds) {
    if (!uniqueOrder.includes(id)) uniqueOrder.push(id);
  }
  let foundTallWidget = false;
  for (const id of uniqueOrder) {
    if (widgets[id].height !== 'tall') continue;
    if (!foundTallWidget) foundTallWidget = true;
    else widgets[id] = { ...widgets[id], height: 'standard' };
  }
  return { railWidth, widgets, widgetOrder: uniqueOrder };
}

export function updateWidgetSize(layout: DeskWorkspaceLayout, id: DeskWidgetId, next: Partial<DeskWidgetSize>): DeskWorkspaceLayout {
  const widgets = { ...layout.widgets };
  if (id !== 'shortcuts' && next.height === 'tall') {
    for (const railWidgetId of deskRailWidgetIds) {
      if (railWidgetId !== id && widgets[railWidgetId].height === 'tall') {
        widgets[railWidgetId] = { ...widgets[railWidgetId], height: 'standard' };
      }
    }
  }
  return {
    ...layout,
    widgets: {
      ...widgets,
      [id]: { ...widgets[id], ...next },
    },
  };
}

export function nextWidgetWidth(width: DeskWidgetWidth): DeskWidgetWidth {
  return width === 'standard' ? 'wide' : 'standard';
}

export function railWidgetOrderForDisplay(layout: DeskWorkspaceLayout, visibleWidgetIds: DeskRailWidgetId[] = layout.widgetOrder): DeskRailWidgetId[] {
  const visibleIds = new Set(visibleWidgetIds);
  const visibleOrder = layout.widgetOrder.filter((id) => visibleIds.has(id));
  const tallIndex = visibleOrder.findIndex((id) => layout.widgets[id].height === 'tall');
  if (tallIndex < 0) return visibleOrder;

  const tallWidgetId = visibleOrder[tallIndex];
  const tallLaneIndex = tallIndex % 2;
  const laneOrder = visibleOrder.filter((_, index) => index % 2 === tallLaneIndex);
  const promotedLaneOrder = [tallWidgetId, ...laneOrder.filter((id) => id !== tallWidgetId)];
  let laneCursor = 0;
  return visibleOrder.map((id, index) => (
    index % 2 === tallLaneIndex ? promotedLaneOrder[laneCursor++] : id
  ));
}

export function moveRailWidget(layout: DeskWorkspaceLayout, id: DeskRailWidgetId, direction: -1 | 1): DeskWorkspaceLayout {
  const index = layout.widgetOrder.indexOf(id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= layout.widgetOrder.length) return layout;
  const widgetOrder = [...layout.widgetOrder];
  [widgetOrder[index], widgetOrder[target]] = [widgetOrder[target], widgetOrder[index]];
  return { ...layout, widgetOrder };
}

export function swapRailWidgets(layout: DeskWorkspaceLayout, sourceId: DeskRailWidgetId, targetId: DeskRailWidgetId): DeskWorkspaceLayout {
  const sourceIndex = layout.widgetOrder.indexOf(sourceId);
  const targetIndex = layout.widgetOrder.indexOf(targetId);
  if (sourceIndex < 0 || targetIndex < 0 || sourceIndex === targetIndex) return layout;
  const widgetOrder = [...layout.widgetOrder];
  [widgetOrder[sourceIndex], widgetOrder[targetIndex]] = [widgetOrder[targetIndex], widgetOrder[sourceIndex]];
  return { ...layout, widgetOrder };
}

export function shortcutItemLimit(height: DeskWidgetHeight, compactCards: boolean, mobile = false): number {
  if (mobile) return 4;
  const limits = compactCards
    ? { compact: 8, standard: 12, tall: 20 }
    : { compact: 6, standard: 9, tall: 15 };
  return limits[height];
}
