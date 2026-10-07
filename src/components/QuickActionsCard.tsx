import { Zap } from 'lucide-react';
import type { DeskCommand } from './CommandPalette';

interface QuickActionsCardProps {
  actions: DeskCommand[];
  onOpenAll: () => void;
  limit?: number;
}

export function QuickActionsCard({ actions, onOpenAll, limit = 6 }: QuickActionsCardProps) {
  return (
    <section className="glass-panel quick-actions-card">
      <div className="mini-heading"><span><Zap aria-hidden="true" />快捷操作</span><button type="button" onClick={onOpenAll}>全部</button></div>
      <div className="quick-actions-grid">
        {actions.slice(0, limit).map((action) => (
          <button key={action.id} type="button" onClick={action.run} title={action.description}>
            <span>{action.icon}</span><small>{action.label}</small>
          </button>
        ))}
      </div>
    </section>
  );
}
