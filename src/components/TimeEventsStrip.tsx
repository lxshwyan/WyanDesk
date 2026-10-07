import { CalendarClock, Plus } from 'lucide-react';
import { describeTimeEvent } from '../lib/timeEvents';
import type { DeskTimeEvent } from '../types';

interface TimeEventsStripProps {
  events: DeskTimeEvent[];
  now: Date;
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export function TimeEventsStrip({ events, now, onAdd, onEdit }: TimeEventsStripProps) {
  return (
    <section className="time-events-strip glass-panel" aria-labelledby="timeEventsTitle">
      <div className="time-events-heading">
        <span><CalendarClock aria-hidden="true" /><strong id="timeEventsTitle">时间事件</strong><small>{events.length} 个</small></span>
        <button type="button" onClick={onAdd}><Plus aria-hidden="true" />添加</button>
      </div>
      <div className="time-events-list">
        {events.map((event) => {
          const display = describeTimeEvent(event, now);
          return (
            <button key={event.id} className={`time-event-card tone-${display.tone}`} type="button" onClick={() => onEdit(event.id)} aria-label={`编辑时间事件：${event.title}，${display.eyebrow}${display.value}`}>
              <span className="time-event-copy"><strong title={event.title}>{event.title}</strong><small>{display.eyebrow}</small></span>
              <b>{display.value}</b>
              <span className="time-event-date">{display.caption}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
