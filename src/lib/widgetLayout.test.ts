import { describe, expect, it } from 'vitest';
import { createDefaultWorkspaceLayout, normalizeWorkspaceLayout, shortcutItemLimit, updateWidgetSize } from './widgetLayout';

describe('workspace widget layout', () => {
  it('creates isolated default widget sizes', () => {
    const first = createDefaultWorkspaceLayout();
    const second = createDefaultWorkspaceLayout();
    first.widgets.tasks.height = 'tall';
    expect(second.widgets.tasks.height).toBe('standard');
  });

  it('normalizes invalid saved values without dropping valid sizes', () => {
    const layout = normalizeWorkspaceLayout({
      railWidth: 'widgets',
      widgets: {
        tasks: { width: 'wide', height: 'tall' },
        notes: { width: 'huge', height: 'tiny' },
      },
    });
    expect(layout.railWidth).toBe('widgets');
    expect(layout.widgets.tasks).toEqual({ width: 'wide', height: 'tall' });
    expect(layout.widgets.notes).toEqual({ width: 'standard', height: 'standard' });
  });

  it('updates one widget without mutating the source layout', () => {
    const source = createDefaultWorkspaceLayout();
    const next = updateWidgetSize(source, 'schedule', { width: 'wide' });
    expect(source.widgets.schedule.width).toBe('standard');
    expect(next.widgets.schedule.width).toBe('wide');
  });

  it('uses widget height as a useful first-screen shortcut limit', () => {
    expect(shortcutItemLimit('compact', false)).toBe(6);
    expect(shortcutItemLimit('standard', false)).toBe(9);
    expect(shortcutItemLimit('tall', false)).toBe(15);
    expect(shortcutItemLimit('standard', true)).toBe(12);
  });
});
