import { describe, expect, it, vi } from 'vitest';
import { createWidgetViewStore } from './WidgetViewState';

describe('widget view state', () => {
  it('shares a draft with a later floating view and retains it after unsubscribe', () => {
    const store = createWidgetViewStore();
    expect(store.read('draft', '')).toBe('');
    store.write('draft', 'same note', '');
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);
    expect(store.read('draft', 'new view default')).toBe('same note');
    store.write('draft', (value: string) => value + ' edited', '');
    expect(listener).toHaveBeenCalledOnce();
    unsubscribe();
    expect(store.read('draft', '')).toBe('same note edited');
  });

  it('keeps fields and widget instances independent, including null and false', () => {
    const first = createWidgetViewStore(), second = createWidgetViewStore();
    first.write<boolean>('running', false, true);
    first.write<number | null>('operand', null, 7);
    expect(first.read('running', true)).toBe(false);
    expect(first.read('operand', 7)).toBeNull();
    expect(second.read('operand', 7)).toBe(7);
  });
});
