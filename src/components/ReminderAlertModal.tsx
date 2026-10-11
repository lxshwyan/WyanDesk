import { BellRing, Check, Clock3 } from 'lucide-react';
import type { ReminderAlertData, ReminderAlertKind } from '../lib/reminderAlert';
import { ManagedLayer } from './ManagedLayer';

const reminderSymbols: Record<ReminderAlertKind, string> = {
  work: '工',
  water: '水',
  meal: '餐',
  rest: '休',
  custom: '提',
  task: '任',
};

interface ReminderAlertModalProps {
  alert: ReminderAlertData;
  onDismiss: () => void;
  onSnooze: () => void;
}

export function ReminderAlertModal({ alert, onDismiss, onSnooze }: ReminderAlertModalProps) {
  return (
    <ManagedLayer className="modal-layer reminder-alert-layer" onEscape={onDismiss}>
      <div className="reminder-alert-backdrop" aria-hidden="true" />
      <section className="reminder-alert-modal" role="alertdialog" aria-modal="true" aria-labelledby="reminderAlertTitle" aria-describedby="reminderAlertDescription">
        <div className="reminder-alert-visual" aria-hidden="true">
          <i />
          <span><BellRing /></span>
        </div>
        <div className="reminder-alert-copy">
          <span className={`reminder-symbol ${alert.kind}`}>{reminderSymbols[alert.kind]}</span>
          <p>{alert.kind === 'task' ? '任务提醒' : '时间到了'}</p>
          <h2 id="reminderAlertTitle">{alert.title}</h2>
          <div id="reminderAlertDescription"><Clock3 aria-hidden="true" /><span>{alert.context} · {alert.time}</span></div>
        </div>
        <div className="reminder-alert-actions">
          <button type="button" onClick={onSnooze}><Clock3 aria-hidden="true" />5 分钟后提醒</button>
          <button className="primary" type="button" autoFocus onClick={onDismiss}><Check aria-hidden="true" />知道了</button>
        </div>
      </section>
    </ManagedLayer>
  );
}
