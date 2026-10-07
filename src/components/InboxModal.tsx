import { ArrowRight, Inbox, Link2, ListTodo, Plus, StickyNote, Trash2, X } from 'lucide-react';
import { useMemo, useState, type FormEvent } from 'react';
import type { DeskInboxItem, DeskWorkspace } from '../types';

interface InboxModalProps {
  items: DeskInboxItem[];
  workspaces: DeskWorkspace[];
  activeWorkspaceId: string;
  onAdd: (kind: DeskInboxItem['kind'], content: string) => boolean;
  onClose: () => void;
  onDelete: (item: DeskInboxItem) => void;
  onOrganize: (item: DeskInboxItem, workspaceId: string, category: string) => void;
}

const kindMeta = {
  link: { label: '网址', icon: <Link2 /> },
  task: { label: '任务', icon: <ListTodo /> },
  note: { label: '想法', icon: <StickyNote /> },
};

export function InboxModal({ items, workspaces, activeWorkspaceId, onAdd, onClose, onDelete, onOrganize }: InboxModalProps) {
  const [kind, setKind] = useState<DeskInboxItem['kind']>('note');
  const [content, setContent] = useState('');
  const [workspaceId, setWorkspaceId] = useState(activeWorkspaceId);
  const workspace = useMemo(() => workspaces.find((item) => item.id === workspaceId) || workspaces[0], [workspaceId, workspaces]);
  const [category, setCategory] = useState(workspace.categories[0] || '常用');

  function switchWorkspace(value: string) {
    const next = workspaces.find((item) => item.id === value) || workspaces[0];
    setWorkspaceId(next.id);
    setCategory(next.categories[0] || '常用');
  }

  function add(event: FormEvent) {
    event.preventDefault();
    if (onAdd(kind, content)) setContent('');
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭收集箱" />
      <section className="shortcut-modal inbox-modal" role="dialog" aria-modal="true" aria-labelledby="inboxTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Inbox /></span><div><h2 id="inboxTitle">轻量收集箱</h2><p>先记下来，再整理到任意桌面</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <form className="inbox-capture" onSubmit={add}>
          <select value={kind} onChange={(event) => setKind(event.target.value as DeskInboxItem['kind'])} aria-label="收集类型"><option value="note">想法</option><option value="task">任务</option><option value="link">网址</option></select>
          <input autoFocus value={content} onChange={(event) => setContent(event.target.value)} placeholder={kind === 'link' ? '粘贴网址' : kind === 'task' ? '记录一个任务' : '记下一个想法'} />
          <button className="primary-button" type="submit" aria-label="加入收集箱"><Plus /></button>
        </form>
        <div className="inbox-destination">
          <span>{kind === 'link' ? '整理到分类' : '整理到桌面'}</span>
          <select value={workspaceId} onChange={(event) => switchWorkspace(event.target.value)} aria-label="目标桌面">{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          {kind === 'link' && <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="网址目标分类">{workspace.categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>}
        </div>
        <div className="inbox-list">
          {items.map((item) => (
            <div key={item.id}>
              <span className={`inbox-kind ${item.kind}`}>{kindMeta[item.kind].icon}</span>
              <span className="inbox-copy"><strong>{item.content}</strong><small>{kindMeta[item.kind].label} · {new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</small></span>
              <span className="inbox-actions"><button type="button" onClick={() => onOrganize(item, workspaceId, category)} title="整理"><ArrowRight /></button><button className="danger" type="button" onClick={() => onDelete(item)} title="删除"><Trash2 /></button></span>
            </div>
          ))}
          {!items.length && <div className="manager-empty">收集箱是空的</div>}
        </div>
      </section>
    </div>
  );
}
