import { useEffect, useState, type FormEvent } from 'react';
import { Check, ChevronDown, ChevronUp, FolderPlus, Pencil, Trash2, X } from 'lucide-react';
import { ManagedLayer } from './ManagedLayer';

interface CategoryManagerProps {
  categories: string[];
  counts: Record<string, number>;
  onAdd: (name: string) => boolean;
  onClose: () => void;
  onDelete: (name: string) => void;
  onMove: (name: string, direction: -1 | 1) => void;
  onRename: (name: string, nextName: string) => boolean;
}

export function CategoryManager({ categories, counts, onAdd, onClose, onDelete, onMove, onRename }: CategoryManagerProps) {
  const [draft, setDraft] = useState('');
  const [editing, setEditing] = useState('');
  const [renameDraft, setRenameDraft] = useState('');
  const [deleting, setDeleting] = useState('');

  useEffect(() => {
    if (editing && !categories.includes(editing)) {
      setEditing('');
      setRenameDraft('');
    }
    if (deleting && !categories.includes(deleting)) setDeleting('');
  }, [categories, deleting, editing]);

  function addCategory(event: FormEvent) {
    event.preventDefault();
    if (onAdd(draft)) setDraft('');
  }

  function startRename(category: string) {
    setEditing(category);
    setRenameDraft(category);
  }

  function finishRename(event: FormEvent) {
    event.preventDefault();
    if (onRename(editing, renameDraft)) {
      setEditing('');
      setRenameDraft('');
    }
  }

  function cancelRename() {
    setEditing('');
    setRenameDraft('');
  }

  return (
    <ManagedLayer className="modal-layer" onEscape={onClose}>
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭分类管理" />
      <section className="category-modal" role="dialog" aria-modal="true" aria-labelledby="categoryManagerTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><FolderPlus /></span><div><h2 id="categoryManagerTitle">分类管理</h2><p>调整快捷网站的分组与顺序</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <form className="category-create" onSubmit={addCategory}>
          <input value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={16} placeholder="新分类名称" aria-label="新分类名称" />
          <button className="primary-button" type="submit"><FolderPlus />新增分类</button>
        </form>

        <div className="category-list" role="list" aria-label="已有分类">
          {categories.map((category, index) => (
            <div className={`category-row${deleting === category ? ' confirming-delete' : ''}`} key={category} role="listitem">
              {editing === category ? (
                <form className="category-rename" onSubmit={finishRename}>
                  <input autoFocus value={renameDraft} onChange={(event) => setRenameDraft(event.target.value)} maxLength={16} aria-label={`修改${category}分类名称`} />
                  <button type="submit" aria-label="保存分类名称"><Check /></button>
                  <button type="button" onClick={cancelRename} aria-label="取消修改"><X /></button>
                </form>
              ) : (
                <div className="category-copy"><strong>{category}</strong><small>{counts[category] || 0} 个网站</small></div>
              )}
              {editing !== category && deleting !== category && (
                <div className="category-actions">
                  <button type="button" onClick={() => onMove(category, -1)} disabled={index === 0} aria-label={`上移${category}`}><ChevronUp /></button>
                  <button type="button" onClick={() => onMove(category, 1)} disabled={index === categories.length - 1} aria-label={`下移${category}`}><ChevronDown /></button>
                  <button type="button" onClick={() => startRename(category)} aria-label={`重命名${category}`}><Pencil /></button>
                  <button className="danger" type="button" onClick={() => setDeleting(category)} disabled={categories.length === 1} aria-label={`删除${category}`}><Trash2 /></button>
                </div>
              )}
              {deleting === category && (
                <div className="category-delete-confirm" role="alert">
                  <p>{counts[category] ? `将同时删除其中 ${counts[category]} 个网站，且不会迁移到其他分类。` : '这个分类中没有网站，可以安全删除。'}</p>
                  <div>
                    <button className="quiet-button" type="button" onClick={() => setDeleting('')}>取消</button>
                    <button className="destructive-button" type="button" onClick={() => { onDelete(category); setDeleting(''); }}><Trash2 />{counts[category] ? '删除分类和网站' : '删除分类'}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        <p className="category-hint">删除分类会同时删除其中的网站，操作前会明确显示数量并再次确认。</p>
      </section>
    </ManagedLayer>
  );
}
