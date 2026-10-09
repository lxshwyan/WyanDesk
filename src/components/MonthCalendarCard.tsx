import { CalendarRange, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';
import type { DeskEvent, DeskTask } from '../types';

interface MonthCalendarCardProps {
  now: Date;
  events: DeskEvent[];
  tasks: DeskTask[];
}

export function monthCalendarCells(year: number, month: number): Array<number | null> {
  const mondayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: 42 }, (_, index) => {
    const day = index - mondayOffset + 1;
    return day > 0 && day <= days ? day : null;
  });
}

function dateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function MonthCalendarCard({ now, events, tasks }: MonthCalendarCardProps) {
  const [view, setView] = useState(() => ({ year: now.getFullYear(), month: now.getMonth() }));
  const cells = monthCalendarCells(view.year, view.month);
  const eventDates = new Set(events.map((event) => event.date));
  const taskDates = new Set(tasks.filter((task) => !task.done && task.dueDate).map((task) => task.dueDate!));

  function changeMonth(direction: -1 | 1) {
    setView((current) => {
      const date = new Date(current.year, current.month + direction, 1);
      return { year: date.getFullYear(), month: date.getMonth() };
    });
  }

  return (
    <section className="glass-panel month-calendar-card">
      <div className="mini-heading calendar-heading">
        <span><CalendarRange aria-hidden="true" />月历</span>
        <div className="calendar-navigation" aria-label="切换月份">
          <button type="button" onClick={() => changeMonth(-1)} aria-label="上个月"><ChevronLeft /></button>
          <strong>{view.year}年{view.month + 1}月</strong>
          <button type="button" onClick={() => changeMonth(1)} aria-label="下个月"><ChevronRight /></button>
        </div>
      </div>
      <div className="calendar-weekdays" aria-hidden="true">{['一', '二', '三', '四', '五', '六', '日'].map((day) => <span key={day}>{day}</span>)}</div>
      <div className="month-calendar-grid" role="grid" aria-label={`${view.year}年${view.month + 1}月`}>
        {cells.map((day, index) => {
          if (!day) return <span className="calendar-day empty" key={`empty-${index}`} aria-hidden="true" />;
          const key = dateKey(view.year, view.month, day);
          const hasEvent = eventDates.has(key);
          const hasTask = taskDates.has(key);
          const isToday = view.year === now.getFullYear() && view.month === now.getMonth() && day === now.getDate();
          const detail = [hasEvent ? '有日程' : '', hasTask ? '有任务' : ''].filter(Boolean).join('、');
          return <span className={`calendar-day${isToday ? ' today' : ''}${hasEvent || hasTask ? ' has-items' : ''}`} key={key} role="gridcell" aria-label={`${key}${detail ? `，${detail}` : ''}`} title={detail}>{day}</span>;
        })}
      </div>
    </section>
  );
}
