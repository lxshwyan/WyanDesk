import { Inbox, Plus, X } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import type { DeskInboxItem, DeskWorkspace } from '../types';
import { ManagedLayer } from './ManagedLayer';
import { searchMatches } from '../lib/deskSearch';
import { InboxReadingItem, type UpdateReadingItem } from './InboxReadingItem';

interface InboxModalProps {
  items: DeskInboxItem[];
  workspaces: DeskWorkspace[];
  activeWorkspaceId: string;
  initialKind?: DeskInboxItem['kind'];
  initialItemId?: string;
  saveLabel?: string;
  onUpdate: UpdateReadingItem;
  onAdd: (kind: DeskInboxItem['kind'], content: string) => boolean;
  onClose: () => void;
  onDelete: (item: DeskInboxItem) => void;
  onOrganize: (item: DeskInboxItem, workspaceId: string, category: string) => void;
}

export function InboxModal({ items, workspaces, activeWorkspaceId, initialKind = 'note', initialItemId, saveLabel = '自动保存在当前桌面数据中', onUpdate, onAdd, onClose, onDelete, onOrganize }: InboxModalProps) {
  const [kind, setKind] = useState<DeskInboxItem['kind']>(initialKind);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>(initialItemId ? 'all' : initialKind === 'link' ? 'unread' : 'all');
  const [query, setQuery] = useState('');
  const [content, setContent] = useState('');
  const [workspaceId, setWorkspaceId] = useState(activeWorkspaceId);
  const workspace = useMemo(() => workspaces.find((item) => item.id === workspaceId) || workspaces[0], [workspaceId, workspaces]);
  const [category, setCategory] = useState(workspace.categories[0] || '常用');
  const unread = items.filter((item) => item.kind === 'link' && !item.readAt).length;
  const visible = items.filter((item) => (filter === 'all' || (item.kind === 'link' && (filter === 'read' ? Boolean(item.readAt) : !item.readAt))) && searchMatches(query, item.content, item.url, item.excerpt, item.note));
  useEffect(() => {
    if (!initialItemId) return;
    const frame = window.requestAnimationFrame(() => { const row = document.getElementById(`inbox-${initialItemId}`); row?.scrollIntoView({ block: 'nearest' }); row?.focus(); });
    return () => window.cancelAnimationFrame(frame);
  }, [initialItemId]);

  function switchWorkspace(value: string) {
    const next = workspaces.find((item) => item.id === value) || workspaces[0];
    setWorkspaceId(next.id);
    setCategory(next.categories[0] || '常用');
  }

  function add(event: FormEvent) {
    event.preventDefault();
    if (onAdd(kind, content)) { setContent(''); setQuery(''); setFilter('all'); }
  }

  return (
    <ManagedLayer className="modal-layer" onEscape={onClose}>
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭收集箱" />
      <section className="shortcut-modal inbox-modal" role="dialog" aria-modal="true" aria-labelledby="inboxTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Inbox /></span><div><h2 id="inboxTitle">收集与稍后阅读</h2><p>先保存资料和想法，需要时再整理</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <form className="inbox-capture" onSubmit={add}>
          <select value={kind} onChange={(event) => setKind(event.target.value as DeskInboxItem['kind'])} aria-label="收集类型"><option value="note">想法</option><option value="task">任务</option><option value="link">网址</option></select>
          <input autoFocus={!initialItemId} maxLength={500} aria-label="收集内容" value={content} onChange={(event) => setContent(event.target.value)} placeholder={kind === 'link' ? '粘贴网址，加入稍后阅读' : kind === 'task' ? '记录一个任务' : '记下一个想法'} />
          <button className="primary-button" type="submit" aria-label="加入收集箱"><Plus /></button>
        </form>
        <div className="reading-toolbar"><div role="group" aria-label="收集筛选">{([['all', '全部'], ['unread', `未读 ${unread}`], ['read', '已读']] as const).map(([value, label]) => <button key={value} type="button" aria-pressed={filter === value} onClick={() => setFilter(value)}>{label}</button>)}</div><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="筛选标题、摘录与备注" aria-label="筛选收集内容" /></div>
        <div className="inbox-destination">
          <span>移入目标</span>
          <select value={workspaceId} onChange={(event) => switchWorkspace(event.target.value)} aria-label="目标桌面">{workspaces.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>
          <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="网址目标分类">{workspace.categories.map((item) => <option key={item} value={item}>{item}</option>)}</select>
        </div>
        <div className="inbox-list reading-list">
          {visible.map((item) => <InboxReadingItem key={item.id} item={item} onUpdate={onUpdate} onDelete={() => onDelete(item)} onOrganize={() => onOrganize(item, workspaceId, category)} />)}
          {!visible.length && <div className="manager-empty"><strong>{query ? '没有匹配内容' : filter === 'read' ? '还没有已读资料' : filter === 'unread' ? '未读资料已处理完' : '还没有收集内容'}</strong><p>{query ? '试试更短的关键词，或切换筛选' : '粘贴网址开始；插件还可右键保存网页和选中的文字'}</p></div>}
        </div>
        <p className="reading-save-status" role="status">{saveLabel} · 移入分类时会保留摘录与备注到便签</p>
      </section>
    </ManagedLayer>
  );
}
