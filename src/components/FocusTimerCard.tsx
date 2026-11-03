import { useWidgetViewState } from './WidgetViewState';
import { Pause, Play, RotateCcw, TimerReset, X } from 'lucide-react';
import type { FocusPhase } from '../lib/focusSession';
import './focusCycle.css';
import { type FormEvent } from 'react';
import { MAX_FOCUS_MINUTES, MIN_FOCUS_MINUTES, parseFocusMinutes } from '../lib/focusTimer';

interface FocusTimerCardProps {
  taskTitle?: string;
  durationMinutes: number;
  remainingSeconds: number;
  running: boolean;
  phase: FocusPhase;
  completedRounds: number;
  cycleEnabled: boolean;
  breakMinutes: number;
  onCycleChange: (enabled: boolean, breakMinutes: number) => void;
  onPreset: (minutes: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

export function FocusTimerCard({ taskTitle, durationMinutes, remainingSeconds, running, phase, completedRounds, cycleEnabled, breakMinutes, onCycleChange, onPreset, onToggle, onReset }: FocusTimerCardProps) {
  const [customOpen, setCustomOpen] = useWidgetViewState('customOpen', false);
  const [customDraft, setCustomDraft] = useWidgetViewState('customDraft', '');
  const totalSeconds = (phase === 'break' ? breakMinutes : durationMinutes) * 60;
  const progress = Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds));
  const customMinutes = parseFocusMinutes(customDraft);
  const presetMinutes = [5, 15, 25, 45, 60];
  const customActive = !presetMinutes.includes(durationMinutes);

  function openCustom() {
    setCustomDraft(String(customActive ? durationMinutes : 30));
    setCustomOpen(true);
  }

  function applyCustom(event: FormEvent) {
    event.preventDefault();
    if (!customMinutes) return;
    onPreset(customMinutes);
    setCustomOpen(false);
  }

  return (
    <section className={`glass-panel focus-card${phase === 'break' ? ' is-break' : ''}`}>
      <div className="mini-heading"><span><TimerReset aria-hidden="true" /><strong className="focus-widget-label">专注计时</strong>{taskTitle && <small className="focus-task-name" title={taskTitle} aria-label={`当前任务：${taskTitle}`}>{taskTitle}</small>}</span><small>{phase === 'break' ? running ? '休息中' : '待休息' : running ? '专注中' : `${durationMinutes} 分钟`}</small></div>
      <div className="focus-body">
        <div className="focus-ring">
          <svg className="focus-dial" viewBox="0 0 72 72" aria-hidden="true" focusable="false">
            <circle className="focus-dial-track" cx="36" cy="36" r="32" />
            <circle className="focus-dial-progress" cx="36" cy="36" r="32" pathLength="100" strokeDasharray="100" strokeDashoffset={(1 - progress) * 100} />
          </svg>
          <time>{formatDuration(remainingSeconds)}</time>
        </div>
        <div className="focus-controls">
          <div className="focus-presets" aria-label="专注时长">
            {customOpen ? (
              <form className="focus-custom-form" onSubmit={applyCustom}>
                <label><input autoFocus type="number" min={MIN_FOCUS_MINUTES} max={MAX_FOCUS_MINUTES} inputMode="numeric" value={customDraft} onChange={(event) => setCustomDraft(event.target.value.replace(/\D/g, '').slice(0, 3))} aria-label="自定义专注分钟" /><span>分</span></label>
                <button className="focus-custom-apply" type="submit" disabled={!customMinutes}>应用</button>
                <button className="focus-custom-close" type="button" onClick={() => setCustomOpen(false)} aria-label="取消自定义"><X /></button>
              </form>
            ) : (
              <>
                {presetMinutes.map((minutes) => <button key={minutes} className={durationMinutes === minutes ? 'active' : ''} type="button" aria-label={`${minutes} 分钟`} aria-pressed={durationMinutes === minutes} onClick={() => onPreset(minutes)}>{minutes}</button>)}
                <button className={customActive ? 'active' : ''} type="button" onClick={openCustom} aria-label={customActive ? `自定义时长，当前 ${durationMinutes} 分钟` : '自定义专注时长'}>{customActive ? `${durationMinutes} 分` : '自定义'}</button>
              </>
            )}
          </div>
          <div className="focus-buttons">
            <button className="focus-primary" type="button" onClick={onToggle}>{running ? <Pause /> : <Play />}{running ? '暂停' : phase === 'break' ? '开始休息' : cycleEnabled && completedRounds ? '下一轮' : '开始'}</button>
            <button type="button" onClick={onReset} aria-label="重置计时"><RotateCcw /></button>
          </div>
        </div>
      </div>
      <div className="focus-cycle-controls">
        <label title="专注结束后，点击开始休息，按所选时长倒计时"><input type="checkbox" checked={cycleEnabled} onChange={(event) => onCycleChange(event.target.checked, breakMinutes)} />结束后休息</label>
        {cycleEnabled ? <select aria-label="休息时长" value={breakMinutes} onChange={(event) => onCycleChange(true, Number(event.target.value))}>{[5, 10, 15].map((minutes) => <option key={minutes} value={minutes}>{minutes} 分钟</option>)}{![5, 10, 15].includes(breakMinutes) && <option value={breakMinutes}>{breakMinutes} 分钟</option>}</select> : null}
        {completedRounds > 0 && <span aria-label={`已完成 ${completedRounds} 轮专注`}>{completedRounds} 轮</span>}
      </div>
    </section>
  );
}
