import { GripVertical, Maximize2, Palette, Scaling, X } from 'lucide-react';
import { useEffect, useRef, useState, type MouseEvent as ReactMouseEvent, type PointerEvent, type ReactNode, type KeyboardEvent } from 'react';
import type { DeskWidgetHeight, DeskWidgetId, DeskWidgetSize } from '../types';
import { createPortal } from 'react-dom';
import { WidgetPreviewContext, WidgetViewProvider } from './WidgetViewState';
import { ManagedLayer } from './ManagedLayer';
import { blockBackgroundStyle } from '../lib/blockBackground';
import { nextWidgetWidth } from '../lib/widgetLayout';
import { clampFloatingRect, initialFloatingRect, resizeFloatingRect, type FloatingRect } from '../lib/floatingWindow';

const heightLabels: Record<DeskWidgetHeight, string> = {
  compact: '紧凑',
  standard: '标准',
  tall: '加高',
};

const widthLabels: Record<DeskWidgetSize['width'], string> = {
  standard: '单列',
  medium: '通栏',
  wide: '通栏',
};

interface DragOrigin {
  x: number;
  y: number;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface WidgetFrameProps {
  id: DeskWidgetId;
  label: string;
  size: DeskWidgetSize;
  editing: boolean;
  allowWide?: boolean;
  dragging?: boolean;
  dropTarget?: boolean;
  children: ReactNode;
  previewRequest?: number;
  previewOnly?: boolean;
  catalogPreview?: boolean;
  onPreviewClose?: () => void;
  onBackground?: () => void;
  onChange: (next: Partial<DeskWidgetSize>) => void;
  onDragStart?: (id: DeskWidgetId) => void;
  onDragMove?: (id: DeskWidgetId, clientX: number, clientY: number) => void;
  onDragEnd?: (id: DeskWidgetId) => void;
}

export function WidgetFrame({ id, label, size, editing, allowWide = true, dragging = false, dropTarget = false, children, previewRequest, previewOnly = false, catalogPreview = false, onPreviewClose, onChange, onBackground, onDragStart, onDragMove, onDragEnd }: WidgetFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const mouseCleanup = useRef<(() => void) | null>(null);
  const dragOrigin = useRef<DragOrigin | null>(null);
  const directDrag = useRef<{ x: number; y: number; pointerId: number; started: boolean; ready: boolean } | null>(null);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const canQuickResize = id !== 'shortcuts';
  const [expanded, setExpanded] = useState(false);
  const floatingRef = useRef<HTMLDivElement>(null);
  const [previewRect, setPreviewRect] = useState<FloatingRect>({ left: 40, top: 96, width: 520, height: 300 });
  const previewGesture = useRef<{ kind: 'move' | 'resize'; x: number; y: number; rect: FloatingRect } | null>(null);
  const viewport = () => ({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    if (!expanded) return;
    const fit = () => setPreviewRect((rect) => clampFloatingRect(rect, viewport(), id));
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, [expanded]);
  const lastPreviewRequest = useRef<number | undefined>(undefined);
  useEffect(() => {
    if (previewRequest !== undefined) {
      setPreviewRect(initialFloatingRect(viewport(), id));
      setExpanded(true);
    } else if (lastPreviewRequest.current !== undefined) {
      setExpanded(false);
    }
    lastPreviewRequest.current = previewRequest;
  }, [previewRequest, id]);
  function startPreviewGesture(event: PointerEvent<HTMLElement>, kind: 'move' | 'resize') {
    if (event.button !== 0) return;
    event.preventDefault(); event.stopPropagation();
    previewGesture.current = { kind, x: event.clientX, y: event.clientY, rect: previewRect };
    floatingRef.current?.setPointerCapture(event.pointerId);
  }
  function adjustPreview(kind: 'move' | 'resize', dx: number, dy: number) {
    setPreviewRect((rect) => kind === 'resize' ? resizeFloatingRect(rect, dx, dy, viewport(), id) : clampFloatingRect({ ...rect, left: rect.left + dx, top: rect.top + dy }, viewport(), id));
  }
  function previewKeys(event: KeyboardEvent<HTMLButtonElement>, kind: 'move' | 'resize') {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    event.preventDefault(); const step = event.shiftKey ? 32 : 16;
    adjustPreview(kind, event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0, event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0);
  }

  useEffect(() => () => {
    mouseCleanup.current?.();
    clearTimeout(holdTimer.current);
    clearDragOffset();
  }, []);

  useEffect(() => {
    const frame = frameRef.current;
    const guard = (event: TouchEvent) => {
      if (directDrag.current?.ready) event.preventDefault();
    };
    frame?.addEventListener('touchmove', guard, { passive: false });
    return () => frame?.removeEventListener('touchmove', guard);
  }, []);

  function beginDrag(clientX: number, clientY: number) {
    const frame = frameRef.current;
    const rail = frame?.closest<HTMLElement>('.today-rail');
    const frameRect = frame?.getBoundingClientRect();
    const railRect = rail?.getBoundingClientRect();
    dragOrigin.current = {
      x: clientX,
      y: clientY,
      minX: frameRect && railRect ? railRect.left - frameRect.left : 0,
      maxX: frameRect && railRect ? railRect.right - frameRect.right : 0,
      minY: frameRect && railRect ? railRect.top - frameRect.top : 0,
      maxY: frameRect && railRect ? railRect.bottom - frameRect.bottom : 0,
    };
    frame?.style.setProperty('--widget-drag-x', '0px');
    frame?.style.setProperty('--widget-drag-y', '0px');
    onDragStart?.(id);
  }

  function updateDragOffset(clientX: number, clientY: number) {
    const origin = dragOrigin.current;
    const frame = frameRef.current;
    if (!origin || !frame) return;
    const offsetX = Math.max(origin.minX, Math.min(origin.maxX, clientX - origin.x));
    const offsetY = Math.max(origin.minY, Math.min(origin.maxY, clientY - origin.y));
    frame.style.setProperty('--widget-drag-x', `${offsetX}px`);
    frame.style.setProperty('--widget-drag-y', `${offsetY}px`);
  }

  function clearDragOffset() {
    dragOrigin.current = null;
    frameRef.current?.style.removeProperty('--widget-drag-x');
    frameRef.current?.style.removeProperty('--widget-drag-y');
  }

  function startDrag(event: PointerEvent<HTMLButtonElement>) {
    if (event.pointerType === 'mouse' || event.button !== 0) return;
    event.preventDefault();
    activePointer.current = event.pointerId;
    beginDrag(event.clientX, event.clientY);
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* Window-level pointer delivery is enough for the current move. */ }
  }

  function moveDrag(event: PointerEvent<HTMLButtonElement>) {
    if (activePointer.current !== event.pointerId) return;
    updateDragOffset(event.clientX, event.clientY);
    onDragMove?.(id, event.clientX, event.clientY);
  }

  function finishDrag(event: PointerEvent<HTMLButtonElement>) {
    if (activePointer.current !== event.pointerId) return;
    try { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); } catch { /* Pointer may already be released. */ }
    activePointer.current = null;
    clearDragOffset();
    onDragEnd?.(id);
  }

  function startMouseDrag(event: ReactMouseEvent<HTMLButtonElement>) {
    if (event.button !== 0) return;
    event.preventDefault();
    mouseCleanup.current?.();
    beginDrag(event.clientX, event.clientY);
    const move = (moveEvent: MouseEvent) => {
      updateDragOffset(moveEvent.clientX, moveEvent.clientY);
      onDragMove?.(id, moveEvent.clientX, moveEvent.clientY);
    };
    const finish = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', finish);
      mouseCleanup.current = null;
      clearDragOffset();
      onDragEnd?.(id);
    };
    mouseCleanup.current = finish;
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', finish, { once: true });
  }

  function directStart(event: PointerEvent<HTMLDivElement>) {
    if (editing || !onDragStart || event.button !== 0 || (event.target as Element).closest('button, a, input, select, textarea, [contenteditable="true"], .widget-floating-panel')) return;
    const pending = { x: event.clientX, y: event.clientY, pointerId: event.pointerId, started: false, ready: event.pointerType === 'mouse' };
    directDrag.current = pending;
    if (!pending.ready) holdTimer.current = setTimeout(() => { pending.ready = true; }, 350);
  }
  function directMove(event: PointerEvent<HTMLDivElement>) {
    const pending = directDrag.current;
    if (!pending || pending.pointerId !== event.pointerId) return;
    if (Math.hypot(event.clientX - pending.x, event.clientY - pending.y) < 8) return;
    if (!pending.ready) { clearTimeout(holdTimer.current); directDrag.current = null; return; }
    event.preventDefault();
    if (!pending.started) { pending.started = true; event.currentTarget.setPointerCapture(event.pointerId); beginDrag(pending.x, pending.y); }
    updateDragOffset(event.clientX, event.clientY);
    onDragMove?.(id, event.clientX, event.clientY);
  }
  function directFinish(event: PointerEvent<HTMLDivElement>) {
    clearTimeout(holdTimer.current);
    const pending = directDrag.current;
    directDrag.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    if (pending?.started) { clearDragOffset(); onDragEnd?.(id); }
  }

  function cycleWidth() {
    onChange({ width: nextWidgetWidth(size.width) });
  }

  function closePreview() {
    previewGesture.current = null;
    setExpanded(false);
    onPreviewClose?.();
  }

  if (catalogPreview) return <WidgetViewProvider><WidgetPreviewContext value={true}><div className={`widget-frame catalog-widget-preview${size.background ? ' has-block-background' : ''}`} style={blockBackgroundStyle(size.background)}>{children}</div></WidgetPreviewContext></WidgetViewProvider>;

  return (
    <WidgetViewProvider>
    <div ref={frameRef} className={`widget-frame${canQuickResize && !editing ? ' has-height-toggle' : ''}${editing ? ' layout-editing' : ''}${dragging ? ' is-dragging' : ''}${dropTarget ? ' drag-target' : ''}${size.background ? ' has-block-background' : ''}`} style={{ ...blockBackgroundStyle(size.background), ...(previewOnly ? { display: 'none' } : {}) }} aria-hidden={previewOnly || undefined} onPointerDownCapture={directStart} onPointerMove={directMove} onPointerUp={directFinish} onPointerCancel={directFinish} data-widget={id} data-widget-width={size.width} data-widget-height={size.height}>
      {canQuickResize && !editing && (
        <button className="widget-height-toggle" type="button" aria-label={`${label}放大查看`} aria-expanded={expanded} aria-haspopup="dialog" title="放大查看"
          onClick={() => { setPreviewRect(initialFloatingRect(viewport(), id)); setExpanded(true); }}>
          <Maximize2 aria-hidden="true" />
        </button>
      )}
      {editing && (
        <div className="widget-layout-controls" role="group" aria-label={`${label}尺寸`}>
          <strong>{label}</strong>
          {onDragStart && <button className="widget-drag-handle" type="button" aria-label={`拖动${label}调整顺序`} aria-pressed={dragging} onMouseDown={startMouseDrag} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}><GripVertical aria-hidden="true" /></button>}
          {onBackground && <button className="widget-drag-handle" type="button" onClick={onBackground} aria-label={`设置${label}背景`}><Palette aria-hidden="true" /></button>}
          <span className="widget-height-control" aria-label="高度">
            {(['compact', 'standard', 'tall'] as DeskWidgetHeight[]).map((height) => (
              <button key={height} className={size.height === height ? 'active' : ''} type="button" aria-pressed={size.height === height} onClick={() => onChange({ height })}>{heightLabels[height]}</button>
            ))}
          </span>
          {allowWide && <button className={`widget-width-control${size.width !== 'standard' ? ' active' : ''}`} type="button" aria-label={`${label}宽度，当前${widthLabels[size.width]}，点击切换`} onClick={cycleWidth}>{widthLabels[size.width]}</button>}
        </div>
      )}
      {children}
    </div>
    {expanded && createPortal(
      <ManagedLayer className="widget-preview-guard" onEscape={closePreview}>
        <button className="widget-preview-backdrop" type="button" onClick={closePreview} aria-label={`收起${label}放大查看`} tabIndex={-1} />
        <div ref={floatingRef} className={`widget-frame widget-floating-panel${size.background ? ' has-block-background' : ''}`} style={{ ...blockBackgroundStyle(size.background), left: previewRect.left, top: previewRect.top, width: previewRect.width, height: previewRect.height }} role="dialog" aria-modal="true" aria-label={`${label}放大查看`} tabIndex={0}
          onKeyDown={(event) => { if (event.target === event.currentTarget && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) { event.preventDefault(); const step = event.shiftKey ? 32 : 16; adjustPreview('move', event.key === 'ArrowLeft' ? -step : event.key === 'ArrowRight' ? step : 0, event.key === 'ArrowUp' ? -step : event.key === 'ArrowDown' ? step : 0); } }}
          onPointerDownCapture={(event) => { if (!(event.target as Element).closest('button, a, input, select, textarea, [contenteditable="true"]')) startPreviewGesture(event, 'move'); }}
          onPointerMove={(event) => {
            const gesture = previewGesture.current;
            if (!gesture) return;
            event.preventDefault();
            const dx = event.clientX - gesture.x, dy = event.clientY - gesture.y;
            setPreviewRect(gesture.kind === 'resize' ? resizeFloatingRect(gesture.rect, dx, dy, viewport(), id) : clampFloatingRect({ ...gesture.rect, left: gesture.rect.left + dx, top: gesture.rect.top + dy }, viewport(), id));
          }}
          onPointerUp={(event) => { previewGesture.current = null; if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId); }}
          onPointerCancel={() => { previewGesture.current = null; }}>
          <WidgetPreviewContext value={true}>{children}</WidgetPreviewContext>
          <button className="widget-preview-close" type="button" aria-label={`关闭${label}放大查看`} onClick={closePreview}><X aria-hidden="true" /></button>
          <button type="button" className="widget-preview-resize" aria-label={`调整${label}窗口大小`} title="拖动调整大小，或使用方向键" onPointerDown={(event) => startPreviewGesture(event, 'resize')} onKeyDown={(event) => previewKeys(event, 'resize')}><Scaling aria-hidden="true" /></button>
        </div>
      </ManagedLayer>, document.body)}
    </WidgetViewProvider>
  );
}
