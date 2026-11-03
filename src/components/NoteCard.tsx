import { Copy, StickyNote, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function NoteCard({ title, content, onRename, onChange, onCopy, onRemove }: { title: string; content: string; onRename: (title: string) => void; onChange: (content: string) => void; onCopy: () => void; onRemove?: () => void }) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(title);
  function finish() { if (draft.trim()) onRename(draft); setRenaming(false); }
  return <section className="glass-panel note-card">
    <div className="mini-heading">
      <span><StickyNote aria-hidden="true" />{renaming ? <input className="note-title-input" aria-label="便签名称" autoFocus maxLength={24} value={draft} onChange={(event) => setDraft(event.target.value)} onBlur={finish} onKeyDown={(event) => { if (event.key === 'Enter') finish(); if (event.key === 'Escape') { event.stopPropagation(); setDraft(title); setRenaming(false); } }} /> : <button type="button" className="note-title-button" title="点击修改便签名称" onClick={() => { setDraft(title); setRenaming(true); }}>{title}</button>}</span>
      <button type="button" className="note-copy" onClick={onCopy} aria-label={`复制${title}为独立便签`} title="复制便签"><Copy aria-hidden="true" /></button>
      {onRemove && <button type="button" className="note-remove" onClick={onRemove} aria-label={`删除${title}`} title="删除便签"><Trash2 aria-hidden="true" /></button>}
    </div>
    <textarea value={content} onChange={(event) => onChange(event.target.value)} placeholder="临时记下一个想法…" aria-label={title} />
  </section>;
}
