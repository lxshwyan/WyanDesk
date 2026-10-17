import { useMemo, useState } from 'react';
import { Check, FolderOpen, Search, Settings2, X } from 'lucide-react';
import type { DeskCommand } from './CommandPalette';
import { ManagedLayer } from './ManagedLayer';
import { MAX_QUICK_ACTIONS } from '../lib/quickActions';

interface QuickActionsManagerProps {
  actions: DeskCommand[];
  selectedIds: string[];
  onClose: () => void;
  onManageGroups: () => void;
  onSave: (ids: string[]) => void;
}

function actionKind(id: string): string {
  if (id.startsWith('open-shortcut-')) return '快捷网站';
  if (id.startsWith('open-group-')) return '网站组合';
  return '桌面功能';
}

export function QuickActionsManager({ actions, selectedIds, onClose, onManageGroups, onSave }: QuickActionsManagerProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(() => selectedIds.filter((id) => actions.some((action) => action.id === id)).slice(0, MAX_QUICK_ACTIONS));
  const visibleActions = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    return actions.filter((action) => !normalized || `${action.label} ${action.description} ${action.keywords} ${actionKind(action.id)}`.toLocaleLowerCase('zh-CN').includes(normalized));
  }, [actions, query]);

  function toggle(id: string) {
    setSelected((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= MAX_QUICK_ACTIONS) return current;
      return [...current, id];
    });
  }

  return (
    <ManagedLayer className="modal-layer" onEscape={onClose}>
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭快捷操作设置" />
      <section className="shortcut-manager-modal quick-actions-manager-modal" role="dialog" aria-modal="true" aria-labelledby="quickActionsManagerTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Settings2 /></span><div><h2 id="quickActionsManagerTitle">设置快捷操作</h2><p>固定 3 个最常用的功能、网站或网站组合</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <div className="quick-actions-selection-summary"><strong>已选 {selected.length} / {MAX_QUICK_ACTIONS}</strong><span>快捷网站先在桌面“快捷网站”中添加</span></div>
        <label className="group-search"><Search aria-hidden="true" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索功能、网站或组合" aria-label="搜索可固定的快捷操作" /></label>
        <div className="quick-action-picker">
          {visibleActions.map((action) => {
            const checked = selected.includes(action.id);
            const disabled = !checked && selected.length >= MAX_QUICK_ACTIONS;
            return (
              <label className={checked ? 'selected' : ''} key={action.id} aria-disabled={disabled}>
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => toggle(action.id)} />
                <span className="quick-action-picker-icon">{action.icon}</span>
                <span><strong>{action.label}</strong><small>{actionKind(action.id)} · {action.description}</small></span>
                {checked && <Check aria-hidden="true" />}
              </label>
            );
          })}
          {!visibleActions.length && <div className="manager-empty">没有匹配的入口</div>}
        </div>
        <button className="quick-actions-group-link" type="button" onClick={onManageGroups}><FolderOpen aria-hidden="true" /><span><strong>管理网站组合</strong><small>创建后可固定到快捷操作，点击组合名称会直接打开其中网站</small></span></button>
        <div className="modal-actions"><button className="quiet-button" type="button" onClick={onClose}>取消</button><button className="primary-button" type="button" disabled={!selected.length} onClick={() => onSave(selected)}><Check />保存设置</button></div>
      </section>
    </ManagedLayer>
  );
}
