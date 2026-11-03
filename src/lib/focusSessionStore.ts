import { advanceFocusSession, createFocusSession, type FocusAction, type FocusCycleOptions, type FocusSession } from './focusSession';
import { normalizeFocusMinutes } from './focusTimer';

export const FOCUS_SESSION_KEY = 'wyandesk.focus-session.v1';
export const FOCUS_SESSION_LOCK = 'wyandesk-focus-session';
export interface FocusTarget { workspaceId: string; taskId: string }
export interface FocusRecord {
  version: 1;
  revision: number;
  session: FocusSession;
  options: FocusCycleOptions;
  target?: FocusTarget;
  claimedCompletionId: number;
}
export interface FocusStoreEnvironment {
  storage?: Pick<Storage, 'getItem' | 'setItem'>;
  now: () => number;
  exclusive?: <T>(work: () => T) => Promise<T>;
}
const integer = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number => typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= max;
export function readFocusRecord(raw: string | null, minutes: number, options: FocusCycleOptions): FocusRecord {
  const empty: FocusRecord = { version: 1, revision: 0, session: createFocusSession(minutes), options, claimedCompletionId: 0 };
  try {
    const data = JSON.parse(raw || 'null') as FocusRecord | null;
    const state = data?.session;
    if (!data || data.version !== 1 || !state || !integer(data.revision) || !integer(data.claimedCompletionId)
      || !integer(state.completionId) || data.claimedCompletionId > state.completionId || !integer(state.completedRounds)
      || !['focus', 'break'].includes(state.phase) || !normalizeFocusMinutes(state.durationMinutes, 0)
      || typeof data.options?.enabled !== 'boolean' || !normalizeFocusMinutes(data.options.breakMinutes, 0)
      || typeof state.running !== 'boolean' || !integer(state.remainingSeconds, (state.phase === 'break' ? data.options.breakMinutes : state.durationMinutes) * 60)
      || (state.running && (!integer(state.deadline) || !state.deadline)) || (!state.running && state.deadline !== null)) return empty;
    const target = data.target && typeof data.target.workspaceId === 'string' && data.target.workspaceId.length <= 128 && typeof data.target.taskId === 'string' && data.target.taskId.length <= 128
      ? { workspaceId: data.target.workspaceId, taskId: data.target.taskId } : undefined;
    return { version: 1, revision: data.revision, claimedCompletionId: data.claimedCompletionId, options: { enabled: data.options.enabled, breakMinutes: data.options.breakMinutes }, target,
      session: { phase: state.phase, durationMinutes: state.durationMinutes, remainingSeconds: state.remainingSeconds, running: state.running, deadline: state.running ? state.deadline : null, completedRounds: state.completedRounds, completionId: state.completionId, message: typeof state.message === 'string' ? state.message.slice(0, 100) : '' } };
  } catch { return empty; }
}

/** Same-origin session, separate from the desktop backup/cloud document. */
export class FocusSessionStore {
  private record: FocusRecord;
  private listeners = new Set<() => void>();
  private queue: Promise<unknown> = Promise.resolve();
  private storageAvailable = true;
  private initialMinutes: number;
  constructor(private environment: FocusStoreEnvironment, minutes: number, options: FocusCycleOptions) {
    this.initialMinutes = normalizeFocusMinutes(minutes);
    this.storageAvailable = Boolean(environment.storage);
    this.record = this.read(options);
    this.project();
  }
  getSnapshot = () => this.record;
  subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener); }; };
  private read(options = this.record.options) {
    let raw: string | null = null;
    try { raw = this.environment.storage?.getItem(FOCUS_SESSION_KEY) ?? null; }
    catch { this.storageAvailable = false; }
    if (!this.storageAvailable && this.record) return this.record;
    return raw ? readFocusRecord(raw, this.initialMinutes, options) : this.record || readFocusRecord(null, this.initialMinutes, options);
  }
  private emit() { this.listeners.forEach((listener) => listener()); }
  private project() {
    const state = this.record.session;
    if (state.running && state.deadline !== null) this.record = { ...this.record, session: { ...state, remainingSeconds: Math.max(0, Math.ceil((state.deadline - this.environment.now()) / 1000)) } };
  }
  private save(record: FocusRecord) {
    this.record = { ...record, revision: record.revision + 1 };
    try { this.environment.storage?.setItem(FOCUS_SESSION_KEY, JSON.stringify(this.record)); }
    catch { this.storageAvailable = false; }
  }
  private run<T>(work: () => T): Promise<T> {
    const next = this.queue.then(async () => {
      if (!this.environment.exclusive) return work();
      let entered = false;
      try { return await this.environment.exclusive(() => { entered = true; return work(); }); }
      catch (error) { if (entered) throw error; this.environment.exclusive = undefined; return work(); }
    });
    this.queue = next.catch(() => undefined);
    return next;
  }
  synchronize = (removed = false) => {
    this.record = removed ? readFocusRecord(null, this.initialMinutes, this.record.options) : this.read();
    this.project(); this.emit();
  };
  dispatch = (action: FocusAction, target?: FocusTarget) => this.run(() => {
    const previous = this.read();
    const session = advanceFocusSession(previous.session, action.type === 'tick' || action.type === 'toggle' || action.type === 'start' ? { ...action, now: this.environment.now() } : action, previous.options);
    const next = { ...previous, session, target: action.type === 'preset' ? undefined : target && session.phase === 'focus' && session.running && !previous.session.running && (!previous.target || previous.session.remainingSeconds === previous.session.durationMinutes * 60) ? target : previous.target };
    if (action.type !== 'tick' || session.completionId !== previous.session.completionId) this.save(next);
    else this.record = next;
    this.emit();
  });
  configure = (options: FocusCycleOptions) => this.run(() => {
    const previous = this.read();
    const next = { enabled: options.enabled, breakMinutes: normalizeFocusMinutes(options.breakMinutes, 5) };
    this.save({ ...previous, options: next, session: previous.session.phase === 'break'
      ? { ...previous.session, phase: next.enabled ? 'break' : 'focus', remainingSeconds: (next.enabled ? next.breakMinutes : previous.session.durationMinutes) * 60, running: false, deadline: null }
      : previous.session });
    this.project(); this.emit();
  });
  claimCompletion = (completionId: number) => this.run(() => {
    // Without origin-wide locks, keep the visible completion state but suppress a potentially duplicated notification.
    if (!this.environment.exclusive || !this.storageAvailable) return false;
    const current = this.read();
    if (!completionId || completionId !== current.session.completionId || completionId <= current.claimedCompletionId) return false;
    this.save({ ...current, claimedCompletionId: completionId });
    this.project(); this.emit();
    return this.storageAvailable;
  });
}
