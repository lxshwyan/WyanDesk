import { describe, expect, it } from 'vitest';
import { FOCUS_SESSION_KEY, FocusSessionStore, readFocusRecord, type FocusStoreEnvironment } from './focusSessionStore';
const cycle = { enabled: true, breakMinutes: 5 };
function setup() {
  const entries = new Map<string, string>(); let now = 1000; let pending = Promise.resolve();
  const environment: FocusStoreEnvironment = { now: () => now, storage: { getItem: (key) => entries.get(key) ?? null, setItem: (key, value) => { entries.set(key, value); } },
    exclusive: <T>(work: () => T) => { const next = pending.then(work); pending = next.then(() => undefined, () => undefined); return next; } };
  return { entries, environment, setNow: (value: number) => { now = value; }, store: () => new FocusSessionStore(environment, 1, cycle) };
}
describe('same-origin focus continuity', () => {
  it('restores an active deadline on refresh and shares pause/resume across pages', async () => {
    const runtime = setup(); const first = runtime.store();
    await first.dispatch({ type: 'start', now: 0 }, { workspaceId: 'work', taskId: 'task1' });
    runtime.setNow(21000); const reopened = runtime.store();
    expect(reopened.getSnapshot().session.remainingSeconds).toBe(40);
    expect(reopened.getSnapshot().target).toEqual({ workspaceId: 'work', taskId: 'task1' });
    await reopened.dispatch({ type: 'toggle', now: 0 });
    first.synchronize(); expect(first.getSnapshot().session).toMatchObject({ running: false, remainingSeconds: 40 });
    runtime.setNow(86400000); await first.dispatch({ type: 'toggle', now: 0 });
    reopened.synchronize(); expect(reopened.getSnapshot().session.deadline).toBe(86440000);
  });
  it('finishes once under simultaneous page ticks and claims only one notification', async () => {
    const runtime = setup(); const first = runtime.store(); const second = runtime.store();
    await first.dispatch({ type: 'start', now: 0 }); runtime.setNow(61000);
    await Promise.all([first.dispatch({ type: 'tick', now: 0 }), second.dispatch({ type: 'tick', now: 0 }), first.dispatch({ type: 'tick', now: 0 })]);
    expect(readFocusRecord(runtime.entries.get(FOCUS_SESSION_KEY)!, 1, cycle).session).toMatchObject({ phase: 'break', running: false, completedRounds: 1, completionId: 1 });
    const claims = await Promise.all([first.claimCompletion(1), second.claimCompletion(1)]);
    expect(claims.filter(Boolean)).toHaveLength(1);
    expect(await runtime.store().claimCompletion(1)).toBe(false);
  });
  it('counts just one expired focus on reopening days later and waits for rest', async () => {
    const runtime = setup(); await runtime.store().dispatch({ type: 'start', now: 0 });
    runtime.setNow(86400000); const reopened = runtime.store(); await reopened.dispatch({ type: 'tick', now: 0 });
    expect(reopened.getSnapshot().session).toMatchObject({ phase: 'break', running: false, remainingSeconds: 300, completedRounds: 1 });
    runtime.setNow(864000000); await reopened.dispatch({ type: 'tick', now: 0 });
    expect(reopened.getSnapshot().session.completedRounds).toBe(1);
  });
  it('shares live cycle settings without importing another page’s stale desktop preferences', async () => {
    const runtime = setup(); const first = runtime.store(); const second = runtime.store();
    await first.configure({ enabled: true, breakMinutes: 15 }); await second.dispatch({ type: 'start', now: 0 });
    runtime.setNow(61000); await second.dispatch({ type: 'tick', now: 0 });
    expect(second.getSnapshot().session.remainingSeconds).toBe(900);
    await first.configure({ enabled: false, breakMinutes: 15 }); second.synchronize();
    expect(second.getSnapshot()).toMatchObject({ options: { enabled: false, breakMinutes: 15 }, session: { phase: 'focus', running: false, remainingSeconds: 60 } });
  });
  it('continues in memory when persistence or locks are unavailable without duplicate notifications', async () => {
    const runtime = setup(); const storage = { getItem: () => { throw new Error('disabled'); }, setItem: () => { throw new Error('full'); } };
    const first = new FocusSessionStore({ ...runtime.environment, storage }, 1, cycle);
    await first.dispatch({ type: 'start', now: 0 }); runtime.setNow(61000); await first.dispatch({ type: 'tick', now: 0 });
    expect(first.getSnapshot().session.completedRounds).toBe(1); expect(await first.claimCompletion(1)).toBe(false);
    const fallback = new FocusSessionStore({ ...runtime.environment, exclusive: async () => { throw new Error('lock denied'); } }, 1, cycle);
    await fallback.dispatch({ type: 'start', now: 0 }); expect(fallback.getSnapshot().session.running).toBe(true);
  });
  it('rejects corrupt persisted deadlines and resets when the session key is removed', async () => {
    const runtime = setup(); const first = runtime.store(); await first.dispatch({ type: 'start', now: 0 });
    const saved = JSON.parse(runtime.entries.get(FOCUS_SESSION_KEY)!); saved.session.deadline = 'tomorrow';
    expect(readFocusRecord(JSON.stringify(saved), 25, cycle).session).toMatchObject({ running: false, remainingSeconds: 1500 });
    runtime.entries.clear(); first.synchronize(true); expect(first.getSnapshot().session).toMatchObject({ running: false, completedRounds: 0 });
    expect(readFocusRecord('{broken', 25, cycle).session.durationMinutes).toBe(25);
  });
});
