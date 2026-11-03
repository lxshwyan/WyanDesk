import { useCallback, useEffect, useState } from 'react';
import type { FocusAction, FocusCycleOptions } from './focusSession';
import { FOCUS_SESSION_KEY, FOCUS_SESSION_LOCK, FocusSessionStore, type FocusTarget } from './focusSessionStore';

export function useFocusSession(minutes: number, enabled: boolean, breakMinutes: number) {
  const [store] = useState(() => {
    let storage: Storage | undefined;
    try { storage = window.localStorage; } catch { /* The timer remains useful in memory. */ }
    return new FocusSessionStore({ storage, now: Date.now,
      exclusive: navigator.locks ? (work) => navigator.locks.request(FOCUS_SESSION_LOCK, work) : undefined,
    }, minutes, { enabled, breakMinutes });
  });
  const [record, setRecord] = useState(store.getSnapshot);
  useEffect(() => {
    const update = () => setRecord(store.getSnapshot());
    const unsubscribe = store.subscribe(update);
    const tick = () => { if (store.getSnapshot().session.running) void store.dispatch({ type: 'tick', now: Date.now() }); };
    const storage = (event: StorageEvent) => { if (event.key === FOCUS_SESSION_KEY || event.key === null) { store.synchronize(event.newValue === null); tick(); } };
    tick();
    const timer = window.setInterval(tick, 1000);
    window.addEventListener('storage', storage);
    window.addEventListener('pageshow', tick);
    document.addEventListener('visibilitychange', tick);
    return () => { unsubscribe(); window.clearInterval(timer); window.removeEventListener('storage', storage); window.removeEventListener('pageshow', tick); document.removeEventListener('visibilitychange', tick); };
  }, [store]);
  const act = useCallback((action: FocusAction, target?: FocusTarget) => { void store.dispatch(action, target); }, [store]);
  const configure = useCallback((options: FocusCycleOptions) => { void store.configure(options); }, [store]);
  return { session: record.session, options: record.options, target: record.target, act, configure, claimCompletion: store.claimCompletion };
}
