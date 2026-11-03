import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Grid3X3, Layers3, Minimize2, Palette, PanelsTopLeft, Search, X } from 'lucide-react';
import { DesktopModePicker } from './DesktopModePicker';
import type { DesktopMode } from '../lib/desktopMode';
import './desktopModes.css';

const labels = { navigation: '轻导航', icons: '图标桌面', work: '卡片桌面', minimal: '极简模式' };
const symbols = { navigation: Search, icons: Grid3X3, work: Layers3, minimal: Minimize2 };

export function DesktopModeMenu({ value, onChange, onComponents, onWallpaper, onBackgrounds }: { value: DesktopMode; onChange: (mode: DesktopMode) => void; onComponents: () => void; onWallpaper: () => void; onBackgrounds: () => void }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const Symbol = symbols[value];

  function close() { setOpen(false); trigger.current?.focus({ preventScroll: true }); }

  useEffect(() => {
    if (!open) return;
    function outside(event: Event) { if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false); }
    function escape(event: KeyboardEvent) { if (event.key === 'Escape') { event.preventDefault(); close(); } }
    document.addEventListener('pointerdown', outside);
    document.addEventListener('focusin', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('focusin', outside); document.removeEventListener('keydown', escape); };
  }, [open]);

  return <div className="desktop-mode-menu" ref={root}>
    <button ref={trigger} type="button" className="text-button view-header-button" aria-label={`切换桌面模式，当前${labels[value]}`} aria-expanded={open} aria-haspopup="dialog" onClick={() => setOpen(!open)}><Symbol aria-hidden="true" /><span>{labels[value]}</span><ChevronDown className="mode-menu-chevron" aria-hidden="true" /></button>
    {open && <div className="desktop-mode-popover" role="dialog" aria-label="切换桌面模式">
      <div className="mode-popover-heading"><strong>桌面模式</strong><button type="button" onClick={close} aria-label="关闭模式选择"><X aria-hidden="true" /></button></div>
      <DesktopModePicker value={value} onChange={(mode) => { onChange(mode); close(); }} />
      <div className="mode-popover-actions"><button type="button" onClick={() => { setOpen(false); onComponents(); }}><PanelsTopLeft aria-hidden="true" />选择组件</button><button type="button" onClick={() => { setOpen(false); onWallpaper(); }}><Palette aria-hidden="true" />更换壁纸</button><button className="mode-background-entry" type="button" onClick={() => { setOpen(false); onBackgrounds(); }}><Palette aria-hidden="true" />分组与组件背景</button></div>
    </div>}
  </div>;
}
