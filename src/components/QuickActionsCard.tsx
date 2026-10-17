import { Command, Settings2, Zap } from 'lucide-react';
import type { DeskCommand } from './CommandPalette';

interface QuickActionsCardProps {
  actions: DeskCommand[];
  onOpenAll: () => void;
  onManage: () => void;
}

export function QuickActionsCard({ actions, onOpenAll, onManage }: QuickActionsCardProps) {
  return (
    <section className="glass-panel quick-actions-card">
      <div className="mini-heading"><span><Zap aria-hidden="true" />快捷操作</span><button type="button" onClick={onManage}><Settings2 aria-hidden="true" />设置</button></div>
      <div className="quick-actions-grid">
        {actions.map((action) => (
          <button key={action.id} type="button" onClick={action.run} title={action.description}>
            <span>{action.icon}</span><small>{action.label}</small>
          </button>
        ))}
        <button className="quick-action-more" type="button" onClick={onOpenAll} title="打开全部操作和快捷命令">
          <span><Command aria-hidden="true" /></span><small>更多</small>
        </button>
      </div>
    </section>
  );
}
