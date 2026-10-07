import { ArrowDown, ArrowUp, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Shortcut } from '../types';

interface ShortcutManagerProps {
  category: string;
  shortcuts: Shortcut[];
  onAdd: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (shortcut: Shortcut) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

function shortcutHost(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

export function ShortcutManager({ category, shortcuts, onAdd, onClose, onDelete, onEdit, onMove }: ShortcutManagerProps) {
  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭网站管理" />
      <section className="shortcut-manager-modal" role="dialog" aria-modal="true" aria-labelledby="shortcutManagerTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Pencil /></span><div><h2 id="shortcutManagerTitle">管理“{category}”</h2><p>修改、调整顺序或移动网站</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <button className="manager-add-button" type="button" onClick={onAdd}><Plus />添加网站</button>

        <div className="shortcut-manager-list" role="list" aria-label={`${category}分类的网站`}>
          {shortcuts.map((shortcut, index) => (
            <div className="shortcut-manager-row" key={shortcut.id} role="listitem">
              <span className="shortcut-manager-icon" style={{ '--shortcut-color': shortcut.accent } as React.CSSProperties}>{shortcut.icon}</span>
              <span className="shortcut-manager-copy"><strong>{shortcut.title}</strong><small>{shortcutHost(shortcut.url)}</small></span>
              <span className="shortcut-manager-actions">
                <button type="button" onClick={() => onMove(shortcut.id, -1)} disabled={index === 0} aria-label={`上移${shortcut.title}`}><ArrowUp /></button>
                <button type="button" onClick={() => onMove(shortcut.id, 1)} disabled={index === shortcuts.length - 1} aria-label={`下移${shortcut.title}`}><ArrowDown /></button>
                <button type="button" onClick={() => onEdit(shortcut)} aria-label={`编辑${shortcut.title}`}><Pencil /></button>
                <button className="danger" type="button" onClick={() => onDelete(shortcut.id)} aria-label={`删除${shortcut.title}`}><Trash2 /></button>
              </span>
            </div>
          ))}
          {!shortcuts.length && <div className="manager-empty">这个分类还没有网站</div>}
        </div>
        <p className="category-hint">编辑网站时可以同时更换分类，排序只影响当前分类。</p>
      </section>
    </div>
  );
}
