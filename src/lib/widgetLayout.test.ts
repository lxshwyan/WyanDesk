import { describe, expect, it } from 'vitest';
import { createDefaultWorkspaceLayout, moveRailWidget, nextWidgetWidth, normalizeWorkspaceLayout, railWidgetOrderForDisplay, shortcutItemLimit, swapRailWidgets, updateWidgetSize } from './widgetLayout';

describe('workspace widget layout', () => {
  it('creates isolated default widget sizes', () => {
    const first = createDefaultWorkspaceLayout();
    const second = createDefaultWorkspaceLayout();
    first.widgets.tasks.height = 'tall';
    first.widgetOrder.reverse();
    expect(second.widgets.tasks.height).toBe('standard');
    expect(second.widgetOrder).toEqual(['quickActions', 'dailyOverview', 'notes', 'weather', 'countdown', 'clipboard', 'schedule', 'tasks', 'reminders', 'focus', 'calendar', 'calculator', 'worldClock']);
    expect(second.widgets.notes).toEqual({ width: 'wide', height: 'standard' });
  });

  it('normalizes invalid saved values without dropping valid sizes', () => {
    const layout = normalizeWorkspaceLayout({
      railWidth: 'widgets',
      widgets: {
        tasks: { width: 'wide', height: 'tall' },
        notes: { width: 'huge', height: 'tiny' },
        weather: { width: 'medium', height: 'compact' },
      },
      widgetOrder: ['tasks', 'tasks', 'unknown', 'quickActions'],
    });
    expect(layout.railWidth).toBe('widgets');
    expect(layout.widgets.tasks).toEqual({ width: 'wide', height: 'tall' });
    expect(layout.widgets.notes).toEqual({ width: 'standard', height: 'standard' });
    expect(layout.widgets.weather).toEqual({ width: 'medium', height: 'compact' });
    expect(layout.widgetOrder).toEqual(['tasks', 'quickActions', 'dailyOverview', 'notes', 'weather', 'countdown', 'clipboard', 'schedule', 'reminders', 'focus', 'calendar', 'calculator', 'worldClock']);
  });

  it('normalizes older layouts to one three-row work widget', () => {
    const layout = normalizeWorkspaceLayout({
      widgets: {
        schedule: { width: 'standard', height: 'tall' },
        tasks: { width: 'standard', height: 'tall' },
      },
      widgetOrder: ['tasks', 'schedule'],
    });

    expect(layout.widgets.tasks.height).toBe('tall');
    expect(layout.widgets.schedule.height).toBe('standard');
  });

  it('preserves an existing complete custom order', () => {
    const customOrder = ['notes', 'tasks', 'reminders', 'focus', 'schedule', 'quickActions', 'calculator', 'calendar', 'worldClock', 'dailyOverview', 'weather', 'clipboard', 'countdown'] as const;
    const layout = normalizeWorkspaceLayout({ widgetOrder: customOrder });
    expect(layout.widgetOrder).toEqual(customOrder);
  });

  it('updates one widget without mutating the source layout', () => {
    const source = createDefaultWorkspaceLayout();
    const next = updateWidgetSize(source, 'schedule', { width: 'wide' });
    expect(source.widgets.schedule.width).toBe('standard');
    expect(next.widgets.schedule.width).toBe('wide');
  });

  it('offers two distinct width choices while accepting legacy full-row values', () => {
    expect(nextWidgetWidth('standard')).toBe('wide');
    expect(nextWidgetWidth('wide')).toBe('standard');
    expect(nextWidgetWidth('medium')).toBe('standard');
  });

  it('keeps one three-row widget and promotes it to the first slot in its original lane', () => {
    const source = createDefaultWorkspaceLayout();
    const scheduleTall = updateWidgetSize(source, 'schedule', { height: 'tall' });
    const tasksTall = updateWidgetSize(scheduleTall, 'tasks', { height: 'tall' });

    expect(tasksTall.widgets.schedule.height).toBe('standard');
    expect(tasksTall.widgets.tasks.height).toBe('tall');
    expect(tasksTall.widgetOrder).toEqual(source.widgetOrder);
    expect(railWidgetOrderForDisplay(tasksTall).slice(0, 4)).toEqual(['quickActions', 'tasks', 'notes', 'dailyOverview']);

    const leftTall = updateWidgetSize(tasksTall, 'countdown', { height: 'tall' });
    expect(railWidgetOrderForDisplay(leftTall).slice(0, 4)).toEqual(['countdown', 'dailyOverview', 'quickActions', 'weather']);
  });

  it('uses only visible widgets when assigning left and right display lanes', () => {
    const source = createDefaultWorkspaceLayout();
    const visible = ['quickActions', 'schedule', 'tasks', 'reminders', 'focus', 'calendar'] as const;
    const filteredLeftTall = updateWidgetSize(source, 'tasks', { height: 'tall' });

    expect(railWidgetOrderForDisplay(filteredLeftTall, [...visible])).toEqual(['tasks', 'schedule', 'quickActions', 'reminders', 'focus', 'calendar']);
    expect(railWidgetOrderForDisplay(source, [...visible])).toEqual(visible);
  });

  it('moves a rail widget without mutating the source order', () => {
    const source = createDefaultWorkspaceLayout();
    const next = moveRailWidget(source, 'focus', -1);
    expect(source.widgetOrder).toEqual(['quickActions', 'dailyOverview', 'notes', 'weather', 'countdown', 'clipboard', 'schedule', 'tasks', 'reminders', 'focus', 'calendar', 'calculator', 'worldClock']);
    expect(next.widgetOrder).toEqual(['quickActions', 'dailyOverview', 'notes', 'weather', 'countdown', 'clipboard', 'schedule', 'tasks', 'focus', 'reminders', 'calendar', 'calculator', 'worldClock']);
    expect(moveRailWidget(next, 'quickActions', -1)).toBe(next);
  });

  it('swaps two rail widgets without mutating the source order', () => {
    const source = createDefaultWorkspaceLayout();
    const next = swapRailWidgets(source, 'quickActions', 'tasks');
    expect(source.widgetOrder[0]).toBe('quickActions');
    expect(next.widgetOrder[0]).toBe('tasks');
    expect(next.widgetOrder[7]).toBe('quickActions');
    expect(swapRailWidgets(next, 'tasks', 'tasks')).toBe(next);
  });

  it('uses widget height as a useful first-screen shortcut limit', () => {
    expect(shortcutItemLimit('compact', false)).toBe(6);
    expect(shortcutItemLimit('standard', false)).toBe(9);
    expect(shortcutItemLimit('tall', false)).toBe(15);
    expect(shortcutItemLimit('standard', true)).toBe(12);
    expect(shortcutItemLimit('tall', true, true)).toBe(4);
  });
});
