export type FocusPhase = 'focus' | 'break';
export interface FocusSession {
  phase: FocusPhase;
  durationMinutes: number;
  remainingSeconds: number;
  running: boolean;
  deadline: number | null;
  completedRounds: number;
  completionId: number;
  message: string;
}
export interface FocusCycleOptions { enabled: boolean; breakMinutes: number }
export type FocusAction = { type: 'tick' | 'toggle' | 'start'; now: number } | { type: 'preset'; minutes: number } | { type: 'reset' };
export function createFocusSession(minutes: number): FocusSession {
  return { phase: 'focus', durationMinutes: minutes, remainingSeconds: minutes * 60, running: false, deadline: null, completedRounds: 0, completionId: 0, message: '' };
}
export function focusPhaseSeconds(state: FocusSession, options: FocusCycleOptions): number {
  return (state.phase === 'break' ? options.breakMinutes : state.durationMinutes) * 60;
}
export function advanceFocusSession(state: FocusSession, action: FocusAction, options: FocusCycleOptions): FocusSession {
  if (action.type === 'preset') return { ...createFocusSession(action.minutes), completionId: state.completionId };
  if (action.type === 'reset') return { ...state, remainingSeconds: focusPhaseSeconds(state, options), running: false, deadline: null, message: '' };
  if (action.type === 'start') return { ...state, phase: 'focus', remainingSeconds: state.phase === 'focus' && state.remainingSeconds > 0 ? state.remainingSeconds : state.durationMinutes * 60, running: true, deadline: action.now + (state.phase === 'focus' && state.remainingSeconds > 0 ? state.remainingSeconds : state.durationMinutes * 60) * 1000, message: '' };
  const remaining = state.running && state.deadline !== null ? Math.max(0, Math.ceil((state.deadline - action.now) / 1000)) : state.remainingSeconds;
  if (state.running && remaining === 0) {
    const finishedFocus = state.phase === 'focus';
    const phase: FocusPhase = options.enabled && finishedFocus ? 'break' : 'focus';
    return { ...state, phase, running: false, deadline: null,
      remainingSeconds: options.enabled || !finishedFocus ? (phase === 'break' ? options.breakMinutes : state.durationMinutes) * 60 : 0,
      completedRounds: state.completedRounds + Number(finishedFocus), completionId: state.completionId + 1,
      message: finishedFocus ? options.enabled ? '本轮专注完成，开始休息吧' : '本轮专注完成，起来活动一下吧' : '休息结束，准备好再开始下一轮' };
  }
  if (action.type === 'tick') return remaining === state.remainingSeconds ? state : { ...state, remainingSeconds: remaining };
  return state.running ? { ...state, remainingSeconds: remaining, running: false, deadline: null }
    : { ...state, remainingSeconds: remaining || focusPhaseSeconds(state, options), running: true, deadline: action.now + (remaining || focusPhaseSeconds(state, options)) * 1000, message: '' };
}
