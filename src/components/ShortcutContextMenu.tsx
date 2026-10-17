import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Check, ExternalLink, FolderInput, Pencil, Trash2 } from 'lucide-react';
import type { Shortcut } from '../types';

interface ShortcutContextMenuProps {
  shortcut: Shortcut;
  categories: string[];
  x: number;
  y: number;
  onClose: () => void;
  onDelete: (shortcut: Shortcut) => void;
  onEdit: (shortcut: Shortcut) => void;
  onMove: (shortcut: Shortcut, category: string) => void;
  onOpen: (shortcut: Shortcut) => void;
}

const viewportInset = 10;

export function ShortcutContextMenu({ shortcut, categories, x, y, onClose, onDelete, onEdit, onMove, onOpen }: ShortcutContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null);

  useLayoutEffect(() => {
    const menu = menuRef.current;
    if (!menu) return;
    const bounds = menu.getBoundingClientRect();
    setPosition({
      left: Math.max(viewportInset, Math.min(x, window.innerWidth - bounds.width - viewportInset)),
      top: Math.max(viewportInset, Math.min(y, window.innerHeight - bounds.height - viewportInset)),
    });
  }, [categories.length, x, y]);

  useEffect(() => {
    const menu = menuRef.current;
    menu?.querySelector<HTMLButtonElement>('[role="menuitem"]:not(:disabled)')?.focus({ preventScroll: true });

    const closeOutside = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && !menu?.contains(target)) onClose();
    };
    const closeForViewportChange = () => onClose();
    const closeForPageScroll = (event: Event) => {
      const target = event.target;
      if (target instanceof Node && menu?.contains(target)) return;
      onClose();
    };
    document.addEventListener('pointerdown', closeOutside);
    window.addEventListener('resize', closeForViewportChange);
    window.addEventListener('scroll', closeForPageScroll, true);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      window.removeEventListener('resize', closeForViewportChange);
      window.removeEventListener('scroll', closeForPageScroll, true);
    };
  }, [onClose]);

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key === 'Tab') {
      onClose();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled), [role="menuitemradio"]:not(:disabled)') || [])];
    if (!items.length) return;
    const currentIndex = items.indexOf(document.activeElement as HTMLButtonElement);
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? items.length - 1
        : event.key === 'ArrowDown'
          ? (currentIndex + 1 + items.length) % items.length
          : (currentIndex - 1 + items.length) % items.length;
    event.preventDefault();
    items[nextIndex].focus();
  }

  return createPortal(
    <div
      ref={menuRef}
      className="shortcut-context-menu"
      role="menu"
      aria-label={`${shortcut.title}操作`}
      onKeyDown={handleKeyDown}
      style={{ left: position?.left ?? x, top: position?.top ?? y, visibility: position ? 'visible' : 'hidden' }}
    >
      <div className="shortcut-context-title">
        <span style={{ '--shortcut-color': shortcut.accent } as CSSProperties}>{shortcut.icon}</span>
        <strong>{shortcut.title}</strong>
      </div>
      <button type="button" role="menuitem" onClick={() => { onClose(); onOpen(shortcut); }}><ExternalLink aria-hidden="true" />打开网站</button>
      <button type="button" role="menuitem" onClick={() => { onClose(); onEdit(shortcut); }}><Pencil aria-hidden="true" />编辑网站</button>
      <div className="shortcut-context-divider" role="separator" />
      <p className="shortcut-context-label"><FolderInput aria-hidden="true" />移动到分类</p>
      <div className="shortcut-context-categories" role="group" aria-label="选择目标分类">
        {categories.map((category) => {
          const selected = category === shortcut.category;
          return (
            <button key={category} type="button" role="menuitemradio" aria-checked={selected} disabled={selected} onClick={() => { onClose(); onMove(shortcut, category); }}>
              <span>{category}</span>{selected && <Check aria-hidden="true" />}
            </button>
          );
        })}
      </div>
      <div className="shortcut-context-divider" role="separator" />
      <button className="danger" type="button" role="menuitem" onClick={() => { onClose(); onDelete(shortcut); }}><Trash2 aria-hidden="true" />删除网站</button>
    </div>,
    document.body,
  );
}
