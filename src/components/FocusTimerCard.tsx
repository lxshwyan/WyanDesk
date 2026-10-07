import { Pause, Play, RotateCcw, TimerReset, X } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { MAX_FOCUS_MINUTES, MIN_FOCUS_MINUTES, parseFocusMinutes } from '../lib/focusTimer';

interface FocusTimerCardProps {
  durationMinutes: number;
  remainingSeconds: number;
  running: boolean;
  onPreset: (minutes: number) => void;
  onToggle: () => void;
  onReset: () => void;
}

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = (seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

export function FocusTimerCard({ durationMinutes, remainingSeconds, running, onPreset, onToggle, onReset }: FocusTimerCardProps) {
  const [customOpen, setCustomOpen] = useState(false);
  const [customDraft, setCustomDraft] = useState('');
  const totalSeconds = durationMinutes * 60;
  const progress = Math.max(0, Math.min(1, 1 - remainingSeconds / totalSeconds));
  const customMinutes = parseFocusMinutes(customDraft);
  const customActive = durationMinutes !== 25 && durationMinutes !== 50;

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
    <section className="glass-panel focus-card">
      <div className="mini-heading"><span><TimerReset aria-hidden="true" />专注计时</span><small>{running ? '专注中' : `${durationMinutes} 分钟`}</small></div>
      <div className="focus-body">
        <div className="focus-ring" style={{ '--focus-progress': `${progress * 360}deg` } as React.CSSProperties}>
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
                {[25, 50].map((minutes) => <button key={minutes} className={durationMinutes === minutes ? 'active' : ''} type="button" onClick={() => onPreset(minutes)}>{minutes} 分</button>)}
                <button className={customActive ? 'active' : ''} type="button" onClick={openCustom} aria-label={customActive ? `自定义时长，当前 ${durationMinutes} 分钟` : '自定义专注时长'}>{customActive ? `${durationMinutes} 分` : '自定义'}</button>
              </>
            )}
          </div>
          <div className="focus-buttons">
            <button className="focus-primary" type="button" onClick={onToggle}>{running ? <Pause /> : <Play />}{running ? '暂停' : '开始'}</button>
            <button type="button" onClick={onReset} aria-label="重置计时"><RotateCcw /></button>
          </div>
        </div>
      </div>
    </section>
  );
}
