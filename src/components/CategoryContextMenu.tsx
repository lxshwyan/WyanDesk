import { useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { Grid3X3, Play, Settings } from 'lucide-react';

interface CategoryContextMenuProps {
  category: string;
  count: number;
  x: number;
  y: number;
  onClose: () => void;
  onManage: () => void;
  onOpen: () => void;
}

const viewportInset = 10;

export function CategoryContextMenu({ category, count, x, y, onClose, onManage, onOpen }: CategoryContextMenuProps) {
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
  }, [count, x, y]);

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
    const items = [...(menuRef.current?.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)') || [])];
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
      className="shortcut-context-menu category-context-menu"
      role="menu"
      aria-label={`${category}分类操作`}
      onKeyDown={handleKeyDown}
      style={{ left: position?.left ?? x, top: position?.top ?? y, visibility: position ? 'visible' : 'hidden' }}
    >
      <div className="shortcut-context-title category-context-title">
        <span><Grid3X3 aria-hidden="true" /></span>
        <strong>{category}</strong>
      </div>
      <button type="button" role="menuitem" disabled={!count} onClick={() => { onClose(); onOpen(); }}>
        <Play aria-hidden="true" />打开全部<span>{count ? `${count} 个网站` : '暂无网站'}</span>
      </button>
      <button type="button" role="menuitem" onClick={() => { onClose(); onManage(); }}><Settings aria-hidden="true" />管理分类</button>
    </div>,
    document.body,
  );
}
