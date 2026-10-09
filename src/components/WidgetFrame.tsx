import { GripVertical } from 'lucide-react';
import { useEffect, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent, type ReactNode } from 'react';
import type { DeskWidgetHeight, DeskWidgetId, DeskWidgetSize } from '../types';

const heightLabels: Record<DeskWidgetHeight, string> = {
  compact: '紧凑',
  standard: '标准',
  tall: '加高',
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
  onChange: (next: Partial<DeskWidgetSize>) => void;
  onDragStart?: (id: DeskWidgetId) => void;
  onDragMove?: (id: DeskWidgetId, clientX: number, clientY: number) => void;
  onDragEnd?: (id: DeskWidgetId) => void;
}

export function WidgetFrame({ id, label, size, editing, allowWide = true, dragging = false, dropTarget = false, children, onChange, onDragStart, onDragMove, onDragEnd }: WidgetFrameProps) {
  const frameRef = useRef<HTMLDivElement>(null);
  const activePointer = useRef<number | null>(null);
  const mouseCleanup = useRef<(() => void) | null>(null);
  const dragOrigin = useRef<DragOrigin | null>(null);

  useEffect(() => () => {
    mouseCleanup.current?.();
    clearDragOffset();
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

  return (
    <div ref={frameRef} className={`widget-frame${editing ? ' layout-editing' : ''}${dragging ? ' is-dragging' : ''}${dropTarget ? ' drag-target' : ''}`} data-widget={id} data-widget-width={size.width} data-widget-height={size.height}>
      {editing && (
        <div className="widget-layout-controls" role="group" aria-label={`${label}尺寸`}>
          <strong>{label}</strong>
          {onDragStart && <button className="widget-drag-handle" type="button" aria-label={`拖动${label}调整顺序`} aria-pressed={dragging} onMouseDown={startMouseDrag} onPointerDown={startDrag} onPointerMove={moveDrag} onPointerUp={finishDrag} onPointerCancel={finishDrag}><GripVertical aria-hidden="true" /></button>}
          <span className="widget-height-control" aria-label="高度">
            {(['compact', 'standard', 'tall'] as DeskWidgetHeight[]).map((height) => (
              <button key={height} className={size.height === height ? 'active' : ''} type="button" aria-pressed={size.height === height} onClick={() => onChange({ height })}>{heightLabels[height]}</button>
            ))}
          </span>
          {allowWide && <button className={`widget-width-control${size.width === 'wide' ? ' active' : ''}`} type="button" aria-pressed={size.width === 'wide'} onClick={() => onChange({ width: size.width === 'wide' ? 'standard' : 'wide' })}>{size.width === 'wide' ? '收窄' : '加宽'}</button>}
        </div>
      )}
      {children}
    </div>
  );
}
