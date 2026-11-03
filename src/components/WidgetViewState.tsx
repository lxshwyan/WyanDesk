import { createContext, useCallback, useContext, useState, useSyncExternalStore, type ReactNode, type SetStateAction } from 'react';

// A widget's compact and floating views share transient drafts and controls.
// The store lives only for this mounted widget; it adds no persistence or API.
export function createWidgetViewStore() {
  const values = new Map<string, unknown>();
  const listeners = new Set<() => void>();
  return {
    read<T,>(key: string, initial: T): T {
      if (!values.has(key)) values.set(key, initial);
      return values.get(key) as T;
    },
    write<T,>(key: string, update: SetStateAction<T>, initial: T) {
      const current = values.has(key) ? values.get(key) as T : initial;
      const next = typeof update === 'function' ? (update as (value: T) => T)(current) : update;
      if (Object.is(current, next)) return;
      values.set(key, next);
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
  };
}

const WidgetViewContext = createContext<ReturnType<typeof createWidgetViewStore> | null>(null);
export const WidgetPreviewContext = createContext(false);

export function WidgetViewProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createWidgetViewStore);
  return <WidgetViewContext value={store}>{children}</WidgetViewContext>;
}

export function useWidgetViewState<T>(key: string, initial: T | (() => T)): [T, (update: SetStateAction<T>) => void] {
  const shared = useContext(WidgetViewContext);
  const [fallback] = useState(createWidgetViewStore);
  const [initialValue] = useState(initial);
  const store = shared || fallback;
  const snapshot = useCallback(() => store.read(key, initialValue), [store, key, initialValue]);
  const value = useSyncExternalStore(store.subscribe, snapshot, snapshot);
  const setValue = useCallback((update: SetStateAction<T>) => store.write(key, update, initialValue), [store, key, initialValue]);
  return [value, setValue];
}
