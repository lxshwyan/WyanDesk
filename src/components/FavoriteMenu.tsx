import { Pencil, Plus } from 'lucide-react';
import type { CSSProperties } from 'react';
import type { FavoriteGroup } from '../types';
import { WebsiteIcon } from './WebsiteIcon';

export function FavoriteMenu({ groups, selectedId, onSelect, onManage, onAdd }: { groups: FavoriteGroup[]; selectedId: string; onSelect: (id: string) => void; onManage: () => void; onAdd: () => void }) {
  const group = groups.find((item) => item.id === selectedId) || groups[0];
  return <>
    <div className="popover-heading favorite-heading"><strong>常用分组</strong><button className="quiet-button" type="button" onClick={onManage}><Pencil aria-hidden="true" />编辑</button></div>
    {group && <section className="favorite-menu-group" aria-label={group.title}>
      {groups.length > 1 ? <select className="favorite-menu-select" aria-label="选择常用分组" value={group.id} onChange={(event) => onSelect(event.target.value)}>{groups.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select> : <h3>{group.title}</h3>}
      <div className="switcher-grid">
        {group.links.map((link) => <a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" title={`${link.title}（新标签页）`}>
          <span style={{ '--shortcut-color': link.accent } as CSSProperties}><WebsiteIcon shortcut={link} /></span>
          <small>{link.title}</small>
        </a>)}
      </div>
      {!group.links.length && <p className="favorite-empty">还没有网站</p>}
    </section>}
    {!groups.length && <p className="favorite-empty">添加一个分组，放常用的网站。</p>}
    <button className="workspace-manage-link" type="button" onClick={onAdd}><Plus aria-hidden="true" />添加网站</button>
  </>;
}
