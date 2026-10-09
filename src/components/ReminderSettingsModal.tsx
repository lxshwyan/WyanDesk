import { useState, type FormEvent } from 'react';
import { Bell, BellRing, Check, Plus, Trash2, X } from 'lucide-react';
import type { DeskReminder } from '../types';

const reminderIcons: Record<DeskReminder['kind'], string> = {
  work: '工',
  water: '水',
  meal: '餐',
  rest: '休',
  custom: '提',
};

interface ReminderSettingsModalProps {
  reminders: DeskReminder[];
  systemNotifications: boolean;
  onAdd: (draft: Pick<DeskReminder, 'title' | 'time' | 'kind'>) => boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEnableNotifications: () => void;
  onDisableNotifications: () => void;
  onUpdate: (id: string, next: Partial<DeskReminder>) => void;
}

export function ReminderSettingsModal({ reminders, systemNotifications, onAdd, onClose, onDelete, onEnableNotifications, onDisableNotifications, onUpdate }: ReminderSettingsModalProps) {
  const [creating, setCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [time, setTime] = useState('09:00');
  const [kind, setKind] = useState<DeskReminder['kind']>('custom');

  function resetCreator() {
    setCreating(false);
    setTitle('');
    setTime('09:00');
    setKind('custom');
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (onAdd({ title, time, kind })) resetCreator();
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭提醒设置" />
      <section className="shortcut-modal reminder-settings-modal" role="dialog" aria-modal="true" aria-labelledby="reminderSettingsTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><BellRing /></span><div><h2 id="reminderSettingsTitle">提醒设置</h2><p>上班、喝水、用餐和下班时间</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <div className="reminder-create">
          {!creating ? (
            <button className="reminder-create-trigger" type="button" onClick={() => setCreating(true)} disabled={reminders.length >= 20}><Plus />{reminders.length >= 20 ? '已达 20 条上限' : '新增提醒'}</button>
          ) : (
            <form className="reminder-create-form" onSubmit={submit}>
              <label className="reminder-create-title"><span>提醒名称</span><input autoFocus maxLength={30} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：吃药、站会或提交日报" required /></label>
              <label><span>时间</span><input type="time" value={time} onChange={(event) => setTime(event.target.value)} required /></label>
              <label><span>类型</span><select value={kind} onChange={(event) => setKind(event.target.value as DeskReminder['kind'])}><option value="custom">其他</option><option value="work">工作</option><option value="water">喝水</option><option value="meal">用餐</option><option value="rest">休息</option></select></label>
              <div className="reminder-create-actions"><button type="button" onClick={resetCreator}>取消</button><button className="primary" type="submit"><Plus />添加</button></div>
            </form>
          )}
        </div>

        <div className="reminder-settings reminder-dialog-list">
          {reminders.map((reminder) => (
            <div className="reminder-setting-row" key={reminder.id}>
              <button className={`mini-switch${reminder.enabled ? ' active' : ''}`} type="button" role="switch" aria-checked={reminder.enabled} onClick={() => onUpdate(reminder.id, { enabled: !reminder.enabled })} aria-label={`${reminder.enabled ? '关闭' : '开启'}${reminder.title}`}><i /></button>
              <span className={`reminder-symbol ${reminder.kind}`}>{reminderIcons[reminder.kind]}</span>
              <strong>{reminder.title}</strong>
              <input type="time" value={reminder.time} onChange={(event) => onUpdate(reminder.id, { time: event.target.value })} aria-label={`${reminder.title}时间`} />
              <button className="reminder-delete-button" type="button" onClick={() => onDelete(reminder.id)} aria-label={`删除${reminder.title}`} title="删除提醒"><Trash2 /></button>
            </div>
          ))}
        </div>

        {systemNotifications ? (
          <button className="notification-button active" type="button" onClick={onDisableNotifications}><BellRing />系统通知已开启</button>
        ) : (
          <button className="notification-button" type="button" onClick={onEnableNotifications}><Bell />开启系统通知</button>
        )}
        <p className="settings-hint reminder-dialog-hint">页面打开时才会检查提醒；允许系统通知后，切换到其他标签页也能看到。</p>
        <div className="modal-actions"><button className="primary-button" type="button" onClick={onClose}><Check />完成</button></div>
      </section>
    </div>
  );
}
