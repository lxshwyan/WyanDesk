import { useState } from 'react';
import { Check, Plus, Search, X } from 'lucide-react';
import { defaultShortcuts } from '../data/defaults';
import type { Shortcut } from '../types';
import { shortcutURLExists } from '../lib/shortcuts';
import { ManagedLayer } from './ManagedLayer';
import { WebsiteIcon } from './WebsiteIcon';

interface Props {
  categories: string[];
  initialCategory: string;
  shortcuts: Shortcut[];
  onAdd: (shortcut: Shortcut, category: string) => void;
  onCustom: () => void;
  onClose: () => void;
}

export function WebsiteCatalog({ categories, initialCategory, shortcuts, onAdd, onCustom, onClose }: Props) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('');
  const [destination, setDestination] = useState(initialCategory);
  const normalized = query.trim().toLocaleLowerCase('zh-CN');
  const visible = defaultShortcuts.filter((site) => (!filter || site.category === filter)
    && (!normalized || `${site.title} ${site.url} ${site.category} ${site.description || ''}`.toLocaleLowerCase('zh-CN').includes(normalized)));
  return (
    <ManagedLayer className="modal-layer" onEscape={onClose}>
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭网站目录" />
      <section className="shortcut-manager-modal website-catalog" role="dialog" aria-modal="true" aria-labelledby="websiteCatalogTitle">
        <div className="modal-heading"><h2 id="websiteCatalogTitle">添加网站</h2><button className="icon-button" type="button" onClick={onClose} aria-label="关闭网站目录"><X /></button></div>
        <div className="catalog-toolbar">
          <label className="group-search"><Search aria-hidden="true" /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索名称或网址" aria-label="搜索常用网站" /></label>
          <label className="catalog-destination"><span>添加到</span><select value={destination} onChange={(event) => setDestination(event.target.value)} aria-label="网站添加到哪个分类">{categories.map((category) => <option key={category} value={category}>{category}</option>)}</select></label>
        </div>
        <div className="catalog-filters" role="group" aria-label="筛选网站目录">{['', ...new Set(defaultShortcuts.map((site) => site.category))].map((category) => <button key={category} type="button" aria-pressed={filter === category} onClick={() => setFilter(category)}>{category || '全部'}</button>)}</div>
        <div className="catalog-list" aria-label="常用网站目录">
          {visible.map((site) => {
            const added = shortcutURLExists(shortcuts, site.url);
            return <div className="catalog-row" key={site.id}>
              <span className="catalog-logo" style={{ color: site.accent }}><WebsiteIcon shortcut={site} /></span>
              <span className="catalog-copy"><strong>{site.title}</strong><small>{site.description}</small></span>
              <button className="quiet-button" type="button" disabled={added} aria-label={added ? `${site.title}已添加` : `添加${site.title}`} onClick={() => onAdd(site, destination)}>{added ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}{added ? '已添加' : '添加'}</button>
            </div>;
          })}
          {!visible.length && <p className="manager-empty">没有匹配的网站</p>}
        </div>
        <div className="catalog-footer"><span role="status">{visible.length} 个网站</span><button className="primary-button" type="button" onClick={onCustom}><Plus aria-hidden="true" />输入网址添加</button></div>
      </section>
    </ManagedLayer>
  );
}
