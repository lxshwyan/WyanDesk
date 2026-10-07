import type { ReactNode } from 'react';
import type { DeskWidgetHeight, DeskWidgetId, DeskWidgetSize } from '../types';

const heightLabels: Record<DeskWidgetHeight, string> = {
  compact: '紧凑',
  standard: '标准',
  tall: '加高',
};

interface WidgetFrameProps {
  id: DeskWidgetId;
  label: string;
  size: DeskWidgetSize;
  editing: boolean;
  allowWide?: boolean;
  children: ReactNode;
  onChange: (next: Partial<DeskWidgetSize>) => void;
}

export function WidgetFrame({ id, label, size, editing, allowWide = true, children, onChange }: WidgetFrameProps) {
  return (
    <div className={`widget-frame${editing ? ' layout-editing' : ''}`} data-widget={id} data-widget-width={size.width} data-widget-height={size.height}>
      {editing && (
        <div className="widget-layout-controls" role="group" aria-label={`${label}尺寸`}>
          <strong>{label}</strong>
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
