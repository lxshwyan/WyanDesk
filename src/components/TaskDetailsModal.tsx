import { useEffect, useState, type FormEvent } from 'react';
import { Check, Circle, Save, Star, Trash2, X } from 'lucide-react';
import type { DeskTask } from '../types';

interface TaskDetailsModalProps {
  task: DeskTask;
  focused: boolean;
  onClose: () => void;
  onDelete: () => void;
  onSave: (value: Pick<DeskTask, 'text' | 'dueDate' | 'reminderTime' | 'recurrence'>) => boolean;
  onToggleDone: () => void;
  onToggleFocus: () => void;
}

export function TaskDetailsModal({ task, focused, onClose, onDelete, onSave, onToggleDone, onToggleFocus }: TaskDetailsModalProps) {
  const [draft, setDraft] = useState(task.text);
  const [dueDate, setDueDate] = useState(task.dueDate || '');
  const [reminderTime, setReminderTime] = useState(task.reminderTime || '');
  const [recurrence, setRecurrence] = useState<NonNullable<DeskTask['recurrence']>>(task.recurrence || 'none');

  useEffect(() => {
    setDraft(task.text);
    setDueDate(task.dueDate || '');
    setReminderTime(task.reminderTime || '');
    setRecurrence(task.recurrence || 'none');
  }, [task.dueDate, task.id, task.recurrence, task.reminderTime, task.text]);

  function submit(event: FormEvent) {
    event.preventDefault();
    if (onSave({ text: draft, dueDate: dueDate || undefined, reminderTime: dueDate && reminderTime ? reminderTime : undefined, recurrence })) onClose();
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭任务详情" />
      <form className="shortcut-modal task-detail-modal" onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="taskDetailTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Check /></span><div><h2 id="taskDetailTitle">任务详情</h2><p>完整内容与今日重点</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <div className="form-grid">
          <label><span>任务内容</span><textarea autoFocus maxLength={500} value={draft} onChange={(event) => setDraft(event.target.value)} /></label>
          <div className="task-schedule-fields">
            <label><span>日期（可选）</span><input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></label>
            <label><span>提醒时间</span><input type="time" value={reminderTime} disabled={!dueDate} onChange={(event) => setReminderTime(event.target.value)} /></label>
            <label><span>重复</span><select value={recurrence} onChange={(event) => setRecurrence(event.target.value as NonNullable<DeskTask['recurrence']>)}><option value="none">不重复</option><option value="daily">每天</option><option value="weekly">每周</option></select></label>
          </div>
        </div>

        <div className="task-detail-controls" aria-label="任务状态">
          <button className={task.done ? 'active done' : ''} type="button" onClick={onToggleDone}>
            {task.done ? <Check /> : <Circle />}<span>{task.done ? '已完成' : '待完成'}</span>
          </button>
          <button className={focused ? 'active focused' : ''} type="button" onClick={onToggleFocus} disabled={task.done} title={task.done ? '完成的任务不能设为今日重点' : ''}>
            <Star fill={focused ? 'currentColor' : 'none'} /><span>{focused ? '今日重点' : '设为重点'}</span>
          </button>
        </div>

        <div className="modal-actions task-detail-actions">
          <button className="quiet-button danger-button" type="button" onClick={onDelete}><Trash2 />删除</button>
          <span />
          <button className="quiet-button" type="button" onClick={onClose}>取消</button>
          <button className="primary-button" type="submit"><Save />保存</button>
        </div>
      </form>
    </div>
  );
}
