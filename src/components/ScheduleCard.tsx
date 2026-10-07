import { CalendarDays, Plus, Trash2 } from 'lucide-react';
import type { DeskEvent } from '../types';

interface ScheduleCardProps {
  events: DeskEvent[];
  todayKey: string;
  onAdd: () => void;
  onRemove: (id: string) => void;
  limit?: number;
}

function eventDateLabel(date: string, todayKey: string) {
  if (date === todayKey) return '今天';
  const dateValue = new Date(`${date}T00:00:00`);
  const todayValue = new Date(`${todayKey}T00:00:00`);
  const diff = Math.round((dateValue.getTime() - todayValue.getTime()) / 86_400_000);
  if (diff === 1) return '明天';
  return `${dateValue.getMonth() + 1}/${dateValue.getDate()}`;
}

export function ScheduleCard({ events, todayKey, onAdd, onRemove, limit = 3 }: ScheduleCardProps) {
  return (
    <section className="glass-panel schedule-card">
      <div className="mini-heading"><span><CalendarDays aria-hidden="true" />今日日程</span><button type="button" onClick={onAdd}><Plus />添加</button></div>
      <div className="schedule-list">
        {events.slice(0, limit).map((event) => (
          <div className="schedule-row" key={event.id}>
            <time><strong>{eventDateLabel(event.date, todayKey)}</strong><small>{event.time}</small></time>
            <span>{event.title}</span>
            <button type="button" onClick={() => onRemove(event.id)} aria-label={`删除日程 ${event.title}`}><Trash2 /></button>
          </div>
        ))}
        {!events.length && <div className="rail-empty">还没有近期日程</div>}
      </div>
    </section>
  );
}
