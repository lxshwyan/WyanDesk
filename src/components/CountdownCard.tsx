import { CalendarClock, Plus } from 'lucide-react';
import { countdownEventsForDisplay, describeTimeEvent } from '../lib/timeEvents';
import type { DeskTimeEvent } from '../types';

interface CountdownCardProps {
  events: DeskTimeEvent[];
  now: Date;
  limit: number;
  onAdd: () => void;
  onEdit: (id: string) => void;
}

export function CountdownCard({ events, now, limit, onAdd, onEdit }: CountdownCardProps) {
  const countdowns = countdownEventsForDisplay(events, now);
  return (
    <section className="glass-panel countdown-card">
      <div className="mini-heading">
        <span><CalendarClock aria-hidden="true" />倒数日</span>
        <button type="button" onClick={onAdd}><Plus aria-hidden="true" />添加</button>
      </div>
      <div className="countdown-list">
        {countdowns.slice(0, limit).map((event) => {
          const display = describeTimeEvent(event, now);
          return (
            <button className={`countdown-row tone-${display.tone}`} key={event.id} type="button" onClick={() => onEdit(event.id)} aria-label={`编辑倒数日：${event.title}，${display.eyebrow}${display.value}`}>
              <span><strong>{event.title}</strong><small>{display.caption}</small></span>
              <b>{display.value}</b>
            </button>
          );
        })}
        {!countdowns.length && <button className="countdown-empty" type="button" onClick={onAdd}><CalendarClock aria-hidden="true" /><span><strong>还没有倒数日</strong><small>添加项目上线、活动或纪念日</small></span></button>}
      </div>
      {countdowns.length > limit && <button className="widget-text-action" type="button" onClick={() => onEdit(countdowns[limit].id)}>还有 {countdowns.length - limit} 个目标</button>}
    </section>
  );
}
