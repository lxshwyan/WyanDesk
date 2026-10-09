import { useState, type FormEvent } from 'react';
import { ListTodo, Plus, X } from 'lucide-react';
import type { DeskTask } from '../types';

type TaskDraft = Pick<DeskTask, 'text' | 'dueDate' | 'reminderTime' | 'recurrence'>;

interface TaskCreateModalProps {
  todayKey: string;
  onClose: () => void;
  onSave: (value: TaskDraft) => boolean;
}

export function TaskCreateModal({ todayKey, onClose, onSave }: TaskCreateModalProps) {
  const [text, setText] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');
  const [recurrence, setRecurrence] = useState<NonNullable<DeskTask['recurrence']>>('none');

  function submit(event: FormEvent) {
    event.preventDefault();
    if (onSave({
      text,
      dueDate: dueDate || undefined,
      reminderTime: dueDate && reminderTime ? reminderTime : undefined,
      recurrence: dueDate ? recurrence : 'none',
    })) onClose();
  }

  function updateDueDate(value: string) {
    setDueDate(value);
    if (!value) {
      setReminderTime('');
      setRecurrence('none');
    }
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭新任务" />
      <form className="shortcut-modal task-create-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="taskCreateTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><ListTodo /></span><div><h2 id="taskCreateTitle">新建任务</h2><p>记录待办，也可设置日期与提醒</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <div className="form-grid">
          <label><span>任务内容</span><textarea autoFocus maxLength={500} value={text} onChange={(event) => setText(event.target.value)} placeholder="例如：整理本周项目进度" required /></label>
          <div className="task-schedule-fields">
            <label><span>日期（可选）</span><input type="date" min={todayKey} value={dueDate} onChange={(event) => updateDueDate(event.target.value)} /></label>
            <label><span>提醒时间</span><input type="time" value={reminderTime} disabled={!dueDate} onChange={(event) => setReminderTime(event.target.value)} /></label>
            <label><span>重复</span><select value={recurrence} disabled={!dueDate} onChange={(event) => setRecurrence(event.target.value as NonNullable<DeskTask['recurrence']>)}><option value="none">不重复</option><option value="daily">每天</option><option value="weekly">每周</option></select></label>
          </div>
        </div>

        <div className="modal-actions"><button className="quiet-button" type="button" onClick={onClose}>取消</button><button className="primary-button" type="submit"><Plus />添加任务</button></div>
      </form>
    </div>
  );
}
