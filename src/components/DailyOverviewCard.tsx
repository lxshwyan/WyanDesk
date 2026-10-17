import { BellRing, CalendarDays, Check, ListTodo, Plus, Star } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import type { DeskEvent, DeskReminder, DeskTask } from '../types';

interface DailyOverviewCardProps {
  tasks: DeskTask[];
  openTaskCount: number;
  focusTaskId: string;
  todayKey: string;
  nextEvent?: DeskEvent;
  nextReminder?: Pick<DeskReminder, 'title' | 'time'>;
  onAddTask: (value: string) => boolean;
  onAddEvent: () => void;
  onOpenTask: (id: string) => void;
  onToggleTask: (id: string) => void;
}

function taskDateLabel(task: DeskTask, todayKey: string): string {
  if (!task.dueDate) return '';
  const date = task.dueDate === todayKey ? '今天' : task.dueDate.slice(5);
  return task.reminderTime ? `${date} ${task.reminderTime}` : date;
}

export function DailyOverviewCard({ tasks, openTaskCount, focusTaskId, todayKey, nextEvent, nextReminder, onAddTask, onAddEvent, onOpenTask, onToggleTask }: DailyOverviewCardProps) {
  const [draft, setDraft] = useState('');
  const visibleTasks = tasks.filter((task) => !task.done).slice(0, 3);

  function addTask(event: FormEvent) {
    event.preventDefault();
    if (onAddTask(draft)) setDraft('');
  }

  return (
    <section className="glass-panel daily-overview-card">
      <div className="mini-heading">
        <span><ListTodo aria-hidden="true" />今天</span>
        <small>{openTaskCount ? `${openTaskCount} 项待办` : '暂无待办'}</small>
      </div>

      <div className="today-task-list">
        {visibleTasks.map((task) => {
          const dateLabel = taskDateLabel(task, todayKey);
          return (
            <div className={`today-task-row${focusTaskId === task.id ? ' focused' : ''}`} key={task.id}>
              <button className="today-task-check" type="button" onClick={() => onToggleTask(task.id)} aria-label={`完成任务：${task.text}`}><Check aria-hidden="true" /></button>
              <button className="today-task-copy" type="button" onClick={() => onOpenTask(task.id)} title={task.text}>
                <span>{task.text}</span>
                {dateLabel && <small className={task.dueDate && task.dueDate < todayKey ? 'overdue' : ''}>{dateLabel}</small>}
              </button>
              {focusTaskId === task.id && <span className="today-focus-mark" title="今日重点"><Star fill="currentColor" aria-hidden="true" /></span>}
            </div>
          );
        })}
        {!visibleTasks.length && <div className="today-task-empty"><Check aria-hidden="true" /><span><strong>今天很清爽</strong><small>记下下一件要完成的事</small></span></div>}
      </div>

      <form className="today-quick-add" onSubmit={addTask}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="添加今日任务" aria-label="添加今日任务" />
        <button type="submit" aria-label="添加任务"><Plus aria-hidden="true" /></button>
      </form>

      <div className="today-context-grid">
        <button type="button" onClick={onAddEvent} title={nextEvent ? `${nextEvent.title} ${nextEvent.date} ${nextEvent.time}` : '添加日程'}>
          <span><CalendarDays aria-hidden="true" /></span>
          <span><small>{nextEvent ? '下一日程' : '日程'}</small><strong>{nextEvent ? `${nextEvent.title} · ${nextEvent.time}` : '添加日程'}</strong></span>
        </button>
        <div title={nextReminder ? `${nextReminder.title} ${nextReminder.time}` : '暂无提醒'}>
          <span><BellRing aria-hidden="true" /></span>
          <span><small>下一提醒</small><strong>{nextReminder ? `${nextReminder.title} · ${nextReminder.time}` : '暂无提醒'}</strong></span>
        </div>
      </div>
    </section>
  );
}
