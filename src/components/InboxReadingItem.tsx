import { useState } from 'react';
import { ArrowRight, Check, ExternalLink, Link2, ListTodo, Pencil, StickyNote, Trash2 } from 'lucide-react';
import type { DeskInboxItem } from '../types';
import { readingURL } from '../lib/readingList';

export type UpdateReadingItem = (id: string, patch: Pick<DeskInboxItem, 'note' | 'readAt'>) => void;

export function InboxReadingItem({ item, onDelete, onUpdate, onOrganize }: { item: DeskInboxItem; onDelete: () => void; onUpdate: UpdateReadingItem; onOrganize: () => void }) {
  const [editing, setEditing] = useState(false);
  const [note, setNote] = useState(item.note || '');
  const url = readingURL(item.url);
  const labels = { link: '阅读资料', task: '任务', note: '想法' };
  const icons = { link: <Link2 />, task: <ListTodo />, note: <StickyNote /> };
  return <article className={`reading-item${item.readAt ? ' is-read' : ''}`} id={`inbox-${item.id}`} tabIndex={-1}>
    <div className="reading-item-heading">
      <span className={`inbox-kind ${item.kind}`} aria-hidden="true">{icons[item.kind]}</span>
      <div className="inbox-copy"><strong>{item.content}</strong><small>{item.readAt ? '已读 · ' : ''}{labels[item.kind]} · {new Date(item.createdAt).toLocaleDateString('zh-CN')}</small></div>
      <button className="icon-button" type="button" onClick={onDelete} aria-label={`删除收集：${item.content}`}><Trash2 /></button>
    </div>
    {item.excerpt && <blockquote className="reading-excerpt">{item.excerpt}</blockquote>}
    {url && <a className="reading-source" href={url} target="_blank" rel="noopener noreferrer"><ExternalLink aria-hidden="true" /><span>{url}</span></a>}
    {item.note && !editing && <p className="reading-note">{item.note}</p>}
    {editing && <form className="reading-note-editor" onSubmit={(event) => { event.preventDefault(); onUpdate(item.id, { note: note.trim().slice(0, 1000), readAt: item.readAt }); setEditing(false); }}>
      <label><span>我的备注</span><textarea autoFocus maxLength={1000} value={note} onChange={(event) => setNote(event.target.value)} aria-label={`备注：${item.content}`} placeholder="为什么保存，之后打算做什么…" /></label>
      <div><button className="quiet-button" type="button" onClick={() => setEditing(false)}>取消</button><button className="primary-button" type="submit">保存备注</button></div>
    </form>}
    <div className="reading-item-actions">
      {item.kind === 'link' && <button className="quiet-button" type="button" onClick={() => onUpdate(item.id, { note: item.note, readAt: item.readAt ? undefined : new Date().toISOString() })}><Check aria-hidden="true" />{item.readAt ? '标为未读' : '标为已读'}</button>}
      <button className="quiet-button" type="button" onClick={() => { setNote(item.note || ''); setEditing((value) => !value); }}><Pencil aria-hidden="true" />备注</button>
      <button className="quiet-button" type="button" onClick={onOrganize}><ArrowRight aria-hidden="true" />{item.kind === 'link' ? '移入网站分类' : item.kind === 'task' ? '移入任务' : '移入便签'}</button>
    </div>
  </article>;
}
