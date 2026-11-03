import { useState, type CSSProperties, type FormEvent } from 'react';
import { ArrowDown, ArrowLeft, ArrowUp, Check, Copy, FolderPlus, Grid3X3, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import type { FavoriteGroup, FavoriteLink, Shortcut } from '../types';
import { favoriteURL, MAX_FAVORITE_GROUPS, moveFavoriteItem, putFavoriteLink } from '../lib/favorites';
import { ManagedLayer } from './ManagedLayer';
import { WebsiteIcon } from './WebsiteIcon';
import { ShortcutFields } from './ShortcutFields';
import './favorites.css';

interface Props {
  groups: FavoriteGroup[];
  shortcuts: Shortcut[];
  initialMode?: 'list' | 'add' | 'copy';
  initialGroupId?: string;
  copyShortcut?: Shortcut;
  onChange: (groups: FavoriteGroup[]) => void;
  onClose: () => void;
}

type Mode = 'list' | 'link' | 'copy' | 'group';
const emptyDraft = { id: '', title: '', url: '', icon: '', iconStyle: 'auto' as const, accent: '#3478f6' };
const newId = () => `favorite-${crypto.randomUUID()}`;
const host = (url: string) => { try { return new URL(url).host; } catch { return url; } };

export function FavoriteManager({ groups, shortcuts, initialMode = 'list', initialGroupId, copyShortcut, onChange, onClose }: Props) {
  const [selectedId, setSelectedId] = useState(initialGroupId || groups[0]?.id || '');
  const [mode, setMode] = useState<Mode>(!groups.length ? 'group' : initialMode === 'add' ? 'link' : initialMode === 'copy' ? 'copy' : 'list');
  const [draft, setDraft] = useState<FavoriteLink>(emptyDraft);
  const [groupDraft, setGroupDraft] = useState({ id: '', title: '' });
  const [groupReturnMode, setGroupReturnMode] = useState<Mode>(copyShortcut ? 'copy' : initialMode === 'add' ? 'link' : 'list');
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const group = groups.find((item) => item.id === selectedId) || groups[0];
  const groupIndex = group ? groups.findIndex((item) => item.id === group.id) : -1;
  const copyCandidates = copyShortcut ? [copyShortcut] : shortcuts.filter((item) => `${item.title} ${item.category} ${item.url}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));

  function changeMode(next: Mode) { setMode(next); setError(''); setStatus(''); }
  function editLink(link?: FavoriteLink) { setDraft(link ? { ...link } : { ...emptyDraft }); changeMode('link'); }
  function editGroup(existing?: FavoriteGroup) { setGroupReturnMode('list'); setGroupDraft(existing ? { id: existing.id, title: existing.title } : { id: '', title: '' }); changeMode('group'); }
  function submitGroup(event: FormEvent) {
    event.preventDefault();
    const title = groupDraft.title.trim();
    if (!title) return setError('请填写分组名称');
    if (groups.some((item) => item.id !== groupDraft.id && item.title.localeCompare(title, 'zh-CN', { sensitivity: 'base' }) === 0)) return setError('已有同名分组，请换一个名称');
    if (!groupDraft.id && groups.length >= MAX_FAVORITE_GROUPS) return setError(`最多创建 ${MAX_FAVORITE_GROUPS} 个分组`);
    const id = groupDraft.id || newId();
    onChange(groupDraft.id ? groups.map((item) => item.id === id ? { ...item, title } : item) : [...groups, { id, title, links: [] }]);
    setSelectedId(id);
    changeMode(groupReturnMode);
    setStatus('分组已保存');
  }
  function submitLink(event: FormEvent) {
    event.preventDefault();
    try {
      onChange(putFavoriteLink(groups, group?.id || '', { ...draft, id: draft.id || newId() }));
      changeMode('list'); setStatus(draft.id ? '网站已更新' : '网站已添加');
    } catch (reason) { setError(reason instanceof Error ? reason.message : '保存失败，请重试'); }
  }
  function copyLink(shortcut: Shortcut) {
    try {
      onChange(putFavoriteLink(groups, group?.id || '', { ...shortcut, id: newId() }));
      setError(''); setStatus(`已复制“${shortcut.title}”，快捷网站中仍保留`);
    } catch (reason) { setError(reason instanceof Error ? reason.message : '复制失败，请重试'); }
  }
  function removeGroup() {
    if (!group || !window.confirm(`删除“${group.title}”分组和其中 ${group.links.length} 个常用入口？快捷网站不受影响。`)) return;
    onChange(groups.filter((item) => item.id !== group.id));
    setSelectedId(groups.find((item) => item.id !== group.id)?.id || '');
    changeMode('list'); setStatus('分组已删除');
  }
  function groupSelect() {
    return <label className="favorite-destination"><span>目标分组</span><select value={group?.id || ''} onChange={(event) => { setSelectedId(event.target.value); setError(''); setStatus(''); }}>{groups.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>;
  }

  return <ManagedLayer className="modal-layer" onEscape={onClose}>
    <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭常用分组" />
    <section className="shortcut-manager-modal favorite-manager" role="dialog" aria-modal="true" aria-labelledby="favoriteManagerTitle">
      <div className="modal-heading"><div><span className="modal-icon"><Grid3X3 /></span><h2 id="favoriteManagerTitle">常用分组</h2></div><button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button></div>
      {error && <p className="favorite-error" role="alert">{error}</p>}
      {status && <p className="favorite-status" role="status">{status}</p>}
      <div className="favorite-manager-body">
      {mode === 'list' ? <>
        <div className="favorite-group-tabs" aria-label="选择常用分组">
          {groups.map((item) => <button type="button" key={item.id} aria-pressed={group?.id === item.id} onClick={() => { setSelectedId(item.id); setStatus(''); }}><span>{item.title}</span><small>{item.links.length}</small></button>)}
          <button type="button" className="favorite-new-group" onClick={() => editGroup()} disabled={groups.length >= MAX_FAVORITE_GROUPS}><FolderPlus />新建分组</button>
        </div>
        {group ? <>
          <div className="favorite-group-tools"><strong>{group.title}</strong><span>
            <button className="icon-button" type="button" onClick={() => onChange(moveFavoriteItem(groups, group.id, -1))} disabled={groupIndex === 0} aria-label="前移分组" title="前移分组"><ArrowUp /></button>
            <button className="icon-button" type="button" onClick={() => onChange(moveFavoriteItem(groups, group.id, 1))} disabled={groupIndex === groups.length - 1} aria-label="后移分组" title="后移分组"><ArrowDown /></button>
            <button className="icon-button" type="button" onClick={() => editGroup(group)} aria-label="重命名分组" title="重命名分组"><Pencil /></button>
            <button className="icon-button danger" type="button" onClick={removeGroup} aria-label="删除分组" title="删除分组"><Trash2 /></button>
          </span></div>
          <div className="favorite-add-tools"><button className="quiet-button" type="button" onClick={() => editLink()}><Plus />添加网站</button><button className="quiet-button" type="button" onClick={() => { setQuery(''); changeMode('copy'); }}><Copy />从快捷网站复制</button></div>
          <div className="favorite-link-list" role="list" aria-label={`${group.title}的网站`}>
            {group.links.map((link, index) => <div className="favorite-link-row" role="listitem" key={link.id}>
              <span className="shortcut-manager-icon" style={{ '--shortcut-color': link.accent } as CSSProperties}><WebsiteIcon shortcut={link} /></span>
              <span className="favorite-link-copy"><strong>{link.title}</strong><small>{host(link.url)}</small></span>
              <span className="favorite-link-actions">
                <button type="button" onClick={() => onChange(groups.map((item) => item.id === group.id ? { ...item, links: moveFavoriteItem(item.links, link.id, -1) } : item))} disabled={index === 0} aria-label={`上移${link.title}`} title="上移"><ArrowUp /></button>
                <button type="button" onClick={() => onChange(groups.map((item) => item.id === group.id ? { ...item, links: moveFavoriteItem(item.links, link.id, 1) } : item))} disabled={index === group.links.length - 1} aria-label={`下移${link.title}`} title="下移"><ArrowDown /></button>
                <button type="button" onClick={() => editLink(link)} aria-label={`编辑${link.title}`} title="编辑"><Pencil /></button>
                <button className="danger" type="button" onClick={() => { onChange(groups.map((item) => item.id === group.id ? { ...item, links: item.links.filter((old) => old.id !== link.id) } : item)); setStatus(`已移除“${link.title}”`); }} aria-label={`移除${link.title}`} title="移除"><Trash2 /></button>
              </span>
            </div>)}
            {!group.links.length && <p className="favorite-empty">添加网站，或从快捷网站复制到这里。</p>}
          </div>
        </> : <p className="favorite-empty">新建一个分组，放常用的网站。</p>}
      </> : <>
        <button className="quiet-button favorite-back" type="button" onClick={() => changeMode('list')}><ArrowLeft />返回分组</button>
        {mode === 'group' ? <form className="form-grid" onSubmit={submitGroup}>
          <label><span>{groupDraft.id ? '重命名分组' : '新建分组'}</span><input autoFocus maxLength={20} value={groupDraft.title} onChange={(event) => setGroupDraft({ ...groupDraft, title: event.target.value })} placeholder="例如：工作、学习" required /></label>
          <div className="modal-actions"><button className="primary-button" type="submit"><Check />保存分组</button></div>
        </form> : mode === 'link' ? <form className="form-grid" onSubmit={submitLink}>
          {!draft.id && groupSelect()}
          <ShortcutFields value={draft} editing={Boolean(draft.id)} onChange={setDraft} titleMaxLength={40} />
          <div className="modal-actions"><button className="primary-button" type="submit"><Check />{draft.id ? '保存修改' : '添加网站'}</button></div>
        </form> : <div className="favorite-copy-picker">
          {groupSelect()}
          <p className="favorite-copy-note">复制后，快捷网站中仍然保留。</p>
          {!copyShortcut && <label className="group-search"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索网站、分类或网址" aria-label="搜索快捷网站" /></label>}
          <div className="favorite-link-list">
            {copyCandidates.map((shortcut) => {
              let exists = false;
              try { const url = favoriteURL(shortcut.url); exists = Boolean(group?.links.some((link) => favoriteURL(link.url) === url)); } catch { /* Show a useful error on copy. */ }
              return <div className="favorite-link-row" key={shortcut.id}><span className="shortcut-manager-icon" style={{ '--shortcut-color': shortcut.accent } as CSSProperties}><WebsiteIcon shortcut={shortcut} /></span><span className="favorite-link-copy"><strong>{shortcut.title}</strong><small>{shortcut.category}</small></span><button className="quiet-button favorite-copy-button" type="button" disabled={exists || !group} onClick={() => copyLink(shortcut)} aria-label={exists ? `${shortcut.title}已在分组` : `复制${shortcut.title}到分组`}>{exists ? <Check /> : <Copy />}{exists ? '已添加' : '复制'}</button></div>;
            })}
            {!copyCandidates.length && <p className="favorite-empty">{query ? '没有匹配的网站' : '当前桌面还没有快捷网站'}</p>}
          </div>
        </div>}
      </>}
      </div>
      <div className="modal-actions"><button className="quiet-button" type="button" onClick={onClose}>完成</button></div>
    </section>
  </ManagedLayer>;
}
