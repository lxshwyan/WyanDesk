import { useMemo, useState, type CSSProperties, type FormEvent } from 'react';
import { Check, FolderOpen, Pencil, Play, Plus, Search, Trash2, X } from 'lucide-react';
import type { Shortcut, ShortcutGroup } from '../types';

interface ShortcutGroupManagerProps {
  groups: ShortcutGroup[];
  shortcuts: Shortcut[];
  onClose: () => void;
  onDelete: (group: ShortcutGroup) => void;
  onOpen: (group: ShortcutGroup) => void;
  onSave: (draft: { id: string; title: string; shortcutIds: string[] }) => boolean;
}

export function ShortcutGroupManager({ groups, shortcuts, onClose, onDelete, onOpen, onSave }: ShortcutGroupManagerProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const visibleShortcuts = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('zh-CN');
    return shortcuts.filter((shortcut) => !normalized || `${shortcut.title} ${shortcut.category} ${shortcut.description || ''}`.toLocaleLowerCase('zh-CN').includes(normalized));
  }, [query, shortcuts]);

  function startCreate() {
    setEditingId('');
    setTitle('');
    setSelectedIds([]);
    setQuery('');
  }

  function startEdit(group: ShortcutGroup) {
    setEditingId(group.id);
    setTitle(group.title);
    setSelectedIds(group.shortcutIds.filter((id) => shortcuts.some((shortcut) => shortcut.id === id)));
    setQuery('');
  }

  function toggleShortcut(id: string) {
    setSelectedIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function submit(event: FormEvent) {
    event.preventDefault();
    if (onSave({ id: editingId || '', title, shortcutIds: selectedIds })) setEditingId(null);
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭网站组合" />
      <section className="shortcut-manager-modal group-manager-modal" role="dialog" aria-modal="true" aria-labelledby="groupManagerTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><FolderOpen /></span><div><h2 id="groupManagerTitle">网站组合</h2><p>一次打开一组常用网站</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        {editingId === null ? (
          <>
            <button className="manager-add-button" type="button" onClick={startCreate}><Plus />新建组合</button>
            <div className="shortcut-group-list">
              {groups.map((group) => {
                const count = group.shortcutIds.filter((id) => shortcuts.some((shortcut) => shortcut.id === id)).length;
                return (
                  <div className="shortcut-group-row" key={group.id}>
                    <span className="shortcut-group-icon"><FolderOpen /></span>
                    <span className="shortcut-group-copy"><strong>{group.title}</strong><small>{count ? `${count} 个网站` : '需要重新选择网站'}</small></span>
                    <span className="shortcut-group-actions">
                      <button type="button" onClick={() => onOpen(group)} disabled={!count} aria-label={`打开${group.title}`} title="打开组合"><Play /></button>
                      <button type="button" onClick={() => startEdit(group)} aria-label={`编辑${group.title}`} title="编辑组合"><Pencil /></button>
                      <button className="danger" type="button" onClick={() => onDelete(group)} aria-label={`删除${group.title}`} title="删除组合"><Trash2 /></button>
                    </span>
                  </div>
                );
              })}
              {!groups.length && <div className="manager-empty">还没有网站组合</div>}
            </div>
          </>
        ) : (
          <form onSubmit={submit}>
            <div className="form-grid">
              <label><span>组合名称</span><input autoFocus maxLength={30} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：开始上班" required /></label>
            </div>
            <div className="group-picker-heading"><strong>选择网站</strong><span>已选 {selectedIds.length} 个</span></div>
            <label className="group-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网站或分类" aria-label="搜索网站" /></label>
            <div className="group-site-picker">
              {visibleShortcuts.map((shortcut) => {
                const selected = selectedIds.includes(shortcut.id);
                return (
                  <label className={selected ? 'selected' : ''} key={shortcut.id}>
                    <input type="checkbox" checked={selected} onChange={() => toggleShortcut(shortcut.id)} />
                    <span className="group-site-icon" style={{ '--shortcut-color': shortcut.accent } as CSSProperties}>{shortcut.icon}</span>
                    <span><strong>{shortcut.title}</strong><small>{shortcut.category}</small></span>
                    {selected && <Check />}
                  </label>
                );
              })}
              {!visibleShortcuts.length && <div className="manager-empty">没有匹配的网站</div>}
            </div>
            <div className="modal-actions"><button className="quiet-button" type="button" onClick={() => setEditingId(null)}>返回</button><button className="primary-button" type="submit"><Check />保存组合</button></div>
          </form>
        )}
      </section>
    </div>
  );
}
