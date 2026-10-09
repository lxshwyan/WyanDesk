import { describe, expect, it } from 'vitest';
import { createDefaultWorkspaceLayout, moveRailWidget, normalizeWorkspaceLayout, shortcutItemLimit, swapRailWidgets, updateWidgetSize } from './widgetLayout';

describe('workspace widget layout', () => {
  it('creates isolated default widget sizes', () => {
    const first = createDefaultWorkspaceLayout();
    const second = createDefaultWorkspaceLayout();
    first.widgets.tasks.height = 'tall';
    first.widgetOrder.reverse();
    expect(second.widgets.tasks.height).toBe('standard');
    expect(second.widgetOrder).toEqual(['quickActions', 'schedule', 'tasks', 'reminders', 'focus', 'notes', 'calendar', 'calculator', 'worldClock', 'dailyOverview']);
  });

  it('normalizes invalid saved values without dropping valid sizes', () => {
    const layout = normalizeWorkspaceLayout({
      railWidth: 'widgets',
      widgets: {
        tasks: { width: 'wide', height: 'tall' },
        notes: { width: 'huge', height: 'tiny' },
      },
      widgetOrder: ['tasks', 'tasks', 'unknown', 'quickActions'],
    });
    expect(layout.railWidth).toBe('widgets');
    expect(layout.widgets.tasks).toEqual({ width: 'wide', height: 'tall' });
    expect(layout.widgets.notes).toEqual({ width: 'standard', height: 'standard' });
    expect(layout.widgetOrder).toEqual(['tasks', 'quickActions', 'schedule', 'reminders', 'focus', 'notes', 'calendar', 'calculator', 'worldClock', 'dailyOverview']);
  });

  it('preserves an existing complete custom order', () => {
    const customOrder = ['notes', 'tasks', 'reminders', 'focus', 'schedule', 'quickActions', 'calculator', 'calendar', 'worldClock', 'dailyOverview'] as const;
    const layout = normalizeWorkspaceLayout({ widgetOrder: customOrder });
    expect(layout.widgetOrder).toEqual(customOrder);
  });

  it('updates one widget without mutating the source layout', () => {
    const source = createDefaultWorkspaceLayout();
    const next = updateWidgetSize(source, 'schedule', { width: 'wide' });
    expect(source.widgets.schedule.width).toBe('standard');
    expect(next.widgets.schedule.width).toBe('wide');
  });

  it('moves a rail widget without mutating the source order', () => {
    const source = createDefaultWorkspaceLayout();
    const next = moveRailWidget(source, 'focus', -1);
    expect(source.widgetOrder).toEqual(['quickActions', 'schedule', 'tasks', 'reminders', 'focus', 'notes', 'calendar', 'calculator', 'worldClock', 'dailyOverview']);
    expect(next.widgetOrder).toEqual(['quickActions', 'schedule', 'tasks', 'focus', 'reminders', 'notes', 'calendar', 'calculator', 'worldClock', 'dailyOverview']);
    expect(moveRailWidget(next, 'quickActions', -1)).toBe(next);
  });

  it('swaps two rail widgets without mutating the source order', () => {
    const source = createDefaultWorkspaceLayout();
    const next = swapRailWidgets(source, 'quickActions', 'tasks');
    expect(source.widgetOrder[0]).toBe('quickActions');
    expect(next.widgetOrder[0]).toBe('tasks');
    expect(next.widgetOrder[2]).toBe('quickActions');
    expect(swapRailWidgets(next, 'tasks', 'tasks')).toBe(next);
  });

  it('uses widget height as a useful first-screen shortcut limit', () => {
    expect(shortcutItemLimit('compact', false)).toBe(6);
    expect(shortcutItemLimit('standard', false)).toBe(9);
    expect(shortcutItemLimit('tall', false)).toBe(15);
    expect(shortcutItemLimit('standard', true)).toBe(12);
  });
});
