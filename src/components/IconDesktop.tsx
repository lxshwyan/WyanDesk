import { useEffect, useRef, useState, type CSSProperties, type MouseEvent, type PointerEvent } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, ChevronUp, Palette, Plus } from 'lucide-react';
import type { DeskWorkspace, Shortcut } from '../types';
import { blockBackgroundStyle } from '../lib/blockBackground';
import { WebsiteIcon } from './WebsiteIcon';
import './iconDesktop.css';

type Position = { x: number; y: number };
interface IconDesktopProps {
  workspace: DeskWorkspace;
  showAllGroups: boolean;
  onBackground: (category: string) => void;
  onOpen: (site: Shortcut) => void;
  onPlaceSite: (id: string, category: string, beforeId?: string) => void;
  onPlaceCategory: (category: string, before: string) => void;
  onMoveSite: (id: string, direction: -1 | 1) => void;
  onMoveCategory: (category: string, direction: -1 | 1) => void;
  onContextMenu: (site: Shortcut, position: Position) => void;
  onCategoryContextMenu: (category: string, position: Position) => void;
  onAdd: (category: string) => void;
}
interface Drag { kind: 'site' | 'category'; id: string; x: number; y: number; left: number; top: number; width: number; moved: boolean; ready: boolean; element: HTMLElement; pointerId: number; }
export function IconDesktop({ workspace, showAllGroups, onBackground, onOpen, onPlaceSite, onPlaceCategory, onMoveSite, onMoveCategory, onContextMenu, onCategoryContextMenu, onAdd }: IconDesktopProps) {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const [status, setStatus] = useState('');
  const [dropTarget, setDropTarget] = useState('');
  const [preview, setPreview] = useState<Drag | null>(null);
  const dragging = useRef<Drag | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ghost = useRef<HTMLDivElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const suppressClickUntil = useRef(0);
  const groups = showAllGroups ? workspace.categories : workspace.categories.slice(0, 4);
  useEffect(() => {
    const element = surface.current;
    const guard = (event: TouchEvent) => { if (dragging.current?.ready) event.preventDefault(); };
    element?.addEventListener('touchmove', guard, { passive: false });
    return () => { element?.removeEventListener('touchmove', guard); clearTimeout(holdTimer.current); };
  }, []);
  function finishDrag() {
    clearTimeout(holdTimer.current);
    const source = dragging.current;
    if (source?.element.hasPointerCapture(source.pointerId)) source.element.releasePointerCapture(source.pointerId);
    dragging.current = null; setPreview(null); setDropTarget('');
  }
  function beginDrag(event: PointerEvent<HTMLElement>, kind: Drag['kind'], id: string) {
    if (event.button !== 0) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const source: Drag = { kind, id, x: event.clientX, y: event.clientY, left: rect.left, top: rect.top, width: rect.width, moved: false, ready: event.pointerType === 'mouse', element: event.currentTarget, pointerId: event.pointerId };
    dragging.current = source;
    if (source.ready) { event.currentTarget.setPointerCapture(event.pointerId); }
    else holdTimer.current = setTimeout(() => { if (dragging.current === source) { source.ready = true; source.element.setPointerCapture(source.pointerId); source.moved = true; setPreview({ ...source }); } }, 350);
  }
  function targetAt(x: number, y: number) {
    const element = document.elementFromPoint(x, y);
    return { category: element?.closest<HTMLElement>('[data-desktop-category]')?.dataset.desktopCategory, siteId: element?.closest<HTMLElement>('[data-desktop-site]')?.dataset.desktopSite };
  }
  function moveDrag(event: PointerEvent<HTMLElement>) {
    const source = dragging.current;
    if (!source) return;
    const distance = Math.hypot(event.clientX - source.x, event.clientY - source.y);
    if (!source.ready) { if (distance > 8) finishDrag(); return; }
    if (!source.moved && distance < 8) return;
    event.preventDefault();
    if (!source.moved) { source.moved = true; setPreview({ ...source }); }
    ghost.current?.style.setProperty('--drag-left', `${source.left + event.clientX - source.x}px`);
    ghost.current?.style.setProperty('--drag-top', `${source.top + event.clientY - source.y}px`);
    const target = targetAt(event.clientX, event.clientY);
    setDropTarget(source.kind === 'site' ? target.siteId || target.category || '' : target.category || '');
    const scroller = document.scrollingElement;
    if (scroller) { if (event.clientY > window.innerHeight - 40) scroller.scrollTop += 12; else if (event.clientY < 40) scroller.scrollTop -= 12; }
  }
  function drop(event: PointerEvent<HTMLElement>) {
    const source = dragging.current;
    if (source?.moved) {
      event.preventDefault(); suppressClickUntil.current = performance.now() + 450;
      const target = targetAt(event.clientX, event.clientY);
      if (target.category) {
        if (source.kind === 'site') { onPlaceSite(source.id, target.category, target.siteId); setStatus(`网站已移到${target.category}`); }
        else { onPlaceCategory(source.id, target.category); setStatus('分组顺序已保存'); }
      }
    }
    finishDrag();
  }
  function showMenu(event: MouseEvent<HTMLElement>, open: (position: Position) => void) {
    event.preventDefault(); event.stopPropagation();
    if (dragging.current?.moved) { finishDrag(); return; }
    finishDrag(); event.currentTarget.focus({ preventScroll: true });
    const rect = event.currentTarget.getBoundingClientRect();
    open(event.clientX || event.clientY ? { x: event.clientX, y: event.clientY } : { x: rect.left + 20, y: rect.top + 28 });
  }
  const draggedSite = preview?.kind === 'site' ? workspace.shortcuts.find((site) => site.id === preview.id) : undefined;
  return <div ref={surface} className="icon-desktop">
    <div className="icon-desktop-groups" aria-label="网站分组">
      {groups.map((category) => {
        const sites = workspace.shortcuts.filter((site) => site.category === category);
        const isExpanded = !collapsed.includes(category);
        return <section key={category} className={`icon-desktop-group${dropTarget === category ? ' is-drop-target' : ''}${preview?.kind === 'category' && preview.id === category ? ' is-drag-source' : ''}${workspace.categoryBackgrounds?.[category] ? ' has-block-background' : ''}`} style={blockBackgroundStyle(workspace.categoryBackgrounds?.[category])} aria-label={`${category}分组`} data-desktop-category={category}>
          <div className="icon-group-heading" onPointerDown={(event) => { if (event.target === event.currentTarget) beginDrag(event, 'category', category); }} onPointerMove={moveDrag} onPointerUp={drop} onPointerCancel={finishDrag}>
            <h3 tabIndex={0} aria-label={`${category}分组，右键管理，Alt加左右键排序`} data-draggable="true" onPointerDown={(event) => beginDrag(event, 'category', category)} onPointerMove={moveDrag} onPointerUp={drop} onPointerCancel={finishDrag} onContextMenu={(event) => showMenu(event, (position) => onCategoryContextMenu(category, position))} onKeyDown={(event) => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); const r = event.currentTarget.getBoundingClientRect(); onCategoryContextMenu(category, { x: r.left + 20, y: r.bottom }); } else if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); onMoveCategory(category, event.key === 'ArrowLeft' ? -1 : 1); } }}>{category}<small>{sites.length}</small></h3>
            <button className="group-background-button" type="button" onClick={() => onBackground(category)} aria-label={`设置${category}分组背景`}><Palette aria-hidden="true" /></button>
            <button type="button" onClick={() => onAdd(category)} aria-label={`向${category}添加网站`}><Plus aria-hidden="true" /></button>
          </div>
          <div className={`desktop-site-grid${isExpanded ? ' is-expanded' : ''}`}>
            {(isExpanded ? sites : sites.slice(0, 6)).map((site) => <a key={site.id} href={site.url} target="_blank" rel="noopener noreferrer" className={`desktop-site${dropTarget === site.id ? ' is-drop-target' : ''}${preview?.kind === 'site' && preview.id === site.id ? ' is-drag-source' : ''}`} style={{ '--site-accent': site.accent } as CSSProperties} aria-label={`打开 ${site.title}`} title={site.title} draggable={false} data-desktop-site={site.id} onPointerDown={(event) => beginDrag(event, 'site', site.id)} onPointerMove={moveDrag} onPointerUp={drop} onPointerCancel={finishDrag} onContextMenu={(event) => showMenu(event, (position) => onContextMenu(site, position))} onClick={(event) => { if (performance.now() < suppressClickUntil.current) { event.preventDefault(); return; } onOpen(site); }} onKeyDown={(event) => { if (event.key === 'ContextMenu' || (event.shiftKey && event.key === 'F10')) { event.preventDefault(); const r = event.currentTarget.getBoundingClientRect(); onContextMenu(site, { x: r.left + 20, y: r.bottom }); } else if (event.altKey && (event.key === 'ArrowLeft' || event.key === 'ArrowRight')) { event.preventDefault(); onMoveSite(site.id, event.key === 'ArrowLeft' ? -1 : 1); setStatus(`${site.title}顺序已保存`); } }}>
              <span className="desktop-site-icon"><WebsiteIcon shortcut={site} /></span><span className="desktop-site-title">{site.title}</span>
            </a>)}
            {!sites.length && <button className="desktop-site desktop-site-add" type="button" onClick={() => onAdd(category)}><span className="desktop-site-icon"><Plus aria-hidden="true" /></span><span className="desktop-site-title">添加网站</span></button>}
          </div>
          {sites.length > 6 && <button type="button" className="icon-group-expand" aria-expanded={isExpanded} aria-label={`${isExpanded ? '收起' : '展开'}${category}分组网址`} onClick={() => setCollapsed((current) => isExpanded ? [...current, category] : current.filter((item) => item !== category))}>{isExpanded ? <ChevronUp aria-hidden="true" /> : <ChevronDown aria-hidden="true" />}{isExpanded ? '收起' : `查看全部 ${sites.length} 个`}</button>}
        </section>;
      })}
    </div>
    {preview && createPortal(<div ref={ghost} className={`desktop-drag-ghost${draggedSite ? ' is-site' : ''}`} aria-hidden="true" style={{ '--drag-left': `${preview.left}px`, '--drag-top': `${preview.top}px`, width: preview.width, '--site-accent': draggedSite?.accent } as CSSProperties}>{draggedSite ? <><span className="desktop-site-icon"><WebsiteIcon shortcut={draggedSite} /></span><span>{draggedSite.title}</span></> : <strong>{preview.id}</strong>}</div>, document.body)}
    <span className="sr-only" role="status">{status}</span>
  </div>;
}
