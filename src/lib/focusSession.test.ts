import { describe, expect, it } from 'vitest';
import { advanceFocusSession as advance, createFocusSession } from './focusSession';
const cycle = { enabled: true, breakMinutes: 5 };
describe('focus and rest sessions', () => {
  it('counts elapsed wall time after background throttling instead of ticks', () => {
    let state = advance(createFocusSession(25), { type: 'toggle', now: 1000 }, cycle);
    state = advance(state, { type: 'tick', now: 121000 }, cycle);
    expect(state.remainingSeconds).toBe(1380);
  });
  it('keeps pause time out of the deadline', () => {
    let state = advance(createFocusSession(25), { type: 'toggle', now: 0 }, cycle);
    state = advance(state, { type: 'toggle', now: 60000 }, cycle);
    expect(state.remainingSeconds).toBe(1440);
    state = advance(state, { type: 'toggle', now: 3600000 }, cycle);
    expect(advance(state, { type: 'tick', now: 3660000 }, cycle).remainingSeconds).toBe(1380);
  });
  it('offers rest and the next focus round without counting unattended rounds', () => {
    let state = advance(createFocusSession(1), { type: 'toggle', now: 0 }, cycle);
    state = advance(state, { type: 'tick', now: 86400000 }, cycle);
    expect(state).toMatchObject({ phase: 'break', remainingSeconds: 300, running: false, completedRounds: 1, completionId: 1 });
    expect(advance(state, { type: 'tick', now: 99900000 }, cycle)).toBe(state);
    state = advance(state, { type: 'toggle', now: 99900000 }, cycle);
    state = advance(state, { type: 'tick', now: 100200000 }, cycle);
    expect(state).toMatchObject({ phase: 'focus', remainingSeconds: 60, running: false, completedRounds: 1, completionId: 2 });
  });
  it('preserves the original one-shot behavior when cycle is disabled', () => {
    const options = { ...cycle, enabled: false };
    const state = advance(advance(createFocusSession(1), { type: 'start', now: 0 }, options), { type: 'tick', now: 60000 }, options);
    expect(state).toMatchObject({ phase: 'focus', remainingSeconds: 0, running: false, completedRounds: 1 });
    expect(advance(state, { type: 'toggle', now: 61000 }, options).deadline).toBe(121000);
  });
  it('reset keeps the current phase, preset starts a fresh focus sequence', () => {
    const rest = advance(advance(createFocusSession(1), { type: 'start', now: 0 }, cycle), { type: 'tick', now: 60000 }, cycle);
    expect(advance(rest, { type: 'reset' }, cycle)).toMatchObject({ phase: 'break', remainingSeconds: 300 });
    expect(advance(rest, { type: 'preset', minutes: 45 }, cycle)).toMatchObject({ phase: 'focus', remainingSeconds: 2700, completedRounds: 0 });
  });
});
