import { Check, Eye, LayoutGrid, Plus, Search } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import type { DeskRailWidgetId } from '../types';
import type { WidgetSearchItem } from '../lib/widgetSearch';
import { searchMatches } from '../lib/deskSearch';
import { backgroundImageValue } from '../lib/backgroundImage';
import './widgetGallery.css';

export interface GalleryItem extends WidgetSearchItem { enabled: boolean }
interface Props {
  items: GalleryItem[];
  addLabel: string;
  background: string;
  renderPreview: (id: DeskRailWidgetId) => ReactNode;
  onTry: (id: DeskRailWidgetId) => void;
  onToggle: (id: DeskRailWidgetId, enabled: boolean) => void;
}
export function WidgetGallery({ items, addLabel, background, renderPreview, onTry, onToggle }: Props) {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<DeskRailWidgetId>('notes');
  const filtered = items.filter((item) => searchMatches(query, item.label, item.description, item.keywords));
  const selected = filtered.find((item) => item.id === selectedId) || filtered[0];
  return <div className="widget-gallery">
    <label className="widget-gallery-search"><Search aria-hidden="true" /><input aria-label="查找桌面组件" placeholder="搜索组件，例如：日历、换算" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    <div className="widget-gallery-layout">
      <div className="widget-gallery-list" role="group" aria-label="可预览组件">
        {filtered.map((item) => <button key={item.id} type="button" aria-pressed={selected?.id === item.id} onClick={() => setSelectedId(item.id)}><span>{item.label}</span>{item.enabled && <Check aria-label="已在桌面" />}</button>)}
        {!filtered.length && <p>没有匹配的组件</p>}
      </div>
      {selected && <div className="widget-gallery-detail">
        <div className="widget-gallery-preview" style={{ backgroundImage: background ? backgroundImageValue(background, document.baseURI) : 'var(--desk-startup-background)' }}><div inert aria-hidden="true">{renderPreview(selected.id)}</div></div>
        <div className="widget-gallery-caption"><strong>{selected.label}</strong><span>{selected.description}</span></div>
        <div className="widget-gallery-actions"><button type="button" className="quiet-button" onClick={() => onTry(selected.id)}><Eye />临时使用</button><button type="button" className={selected.enabled ? 'quiet-button' : 'primary-small-button'} onClick={() => onToggle(selected.id, !selected.enabled)}>{selected.enabled ? <LayoutGrid /> : <Plus />}{selected.enabled ? '从桌面隐藏' : addLabel}</button></div>
      </div>}
    </div>
  </div>;
}
