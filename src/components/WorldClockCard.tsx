import { Clock3 } from 'lucide-react';
import { worldClockOptions, worldClockSnapshot } from '../lib/worldClock';

interface WorldClockCardProps {
  now: Date;
  selectedZoneIds: string[];
  limit: number;
  onConfigure: () => void;
}

export function WorldClockCard({ now, selectedZoneIds, limit, onConfigure }: WorldClockCardProps) {
  const clocks = selectedZoneIds
    .map((id) => worldClockOptions.find((option) => option.id === id))
    .filter((option): option is NonNullable<typeof option> => Boolean(option))
    .slice(0, limit);

  return (
    <section className="glass-panel world-clock-card">
      <div className="mini-heading">
        <span><Clock3 aria-hidden="true" />世界时钟</span>
        <button type="button" onClick={onConfigure}>设置</button>
      </div>
      <div className="world-clock-list">
        {clocks.map((option) => {
          const snapshot = worldClockSnapshot(now, option.id);
          return (
            <div className="world-clock-row" key={option.id}>
              <span className="world-clock-city"><strong>{option.city}</strong><small>{option.region}</small></span>
              <span className="world-clock-date"><small>{snapshot.date}</small><em>{snapshot.dayRelation}</em></span>
              <time dateTime={snapshot.time}>{snapshot.time}</time>
            </div>
          );
        })}
      </div>
    </section>
  );
}
