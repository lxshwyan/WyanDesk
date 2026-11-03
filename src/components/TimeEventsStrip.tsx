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
    <section className="time-events-ribbon" aria-label="时间事件">
        {events.map((event) => {
          const display = describeTimeEvent(event, now);
          return (
            <button key={event.id} className="time-event-pill" type="button" onClick={() => onEdit(event.id)} aria-label={`编辑时间事件：${event.title}，${display.eyebrow}${display.value}`} title={display.caption}>
              <CalendarClock aria-hidden="true" /><strong>{event.title}</strong><span>{display.eyebrow}{display.value}</span>
            </button>
          );
        })}
      <button className="time-event-add" type="button" onClick={onAdd} aria-label="添加时间事件"><Plus aria-hidden="true" /></button>
    </section>
  );
}
