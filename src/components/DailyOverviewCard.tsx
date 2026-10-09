import { BellRing, CalendarDays, ListTodo, Star } from 'lucide-react';

interface DailyOverviewCardProps {
  openTaskCount: number;
  todayEventCount: number;
  nextReminderTime: string;
  focusTaskTitle: string;
}

export function DailyOverviewCard({ openTaskCount, todayEventCount, nextReminderTime, focusTaskTitle }: DailyOverviewCardProps) {
  const items = [
    { label: '待办', value: `${openTaskCount} 项`, icon: <ListTodo aria-hidden="true" /> },
    { label: '今日日程', value: `${todayEventCount} 项`, icon: <CalendarDays aria-hidden="true" /> },
    { label: '下次提醒', value: nextReminderTime || '暂无', icon: <BellRing aria-hidden="true" /> },
    { label: '今日重点', value: focusTaskTitle || '未设置', icon: <Star aria-hidden="true" /> },
  ];

  return (
    <section className="glass-panel daily-overview-card">
      <div className="mini-heading"><span><CalendarDays aria-hidden="true" />今日概览</span><small>自动汇总</small></div>
      <div className="daily-overview-grid">
        {items.map((item) => (
          <div className="daily-overview-item" key={item.label} title={item.value}>
            <span>{item.icon}</span>
            <span><small>{item.label}</small><strong>{item.value}</strong></span>
          </div>
        ))}
      </div>
    </section>
  );
}
