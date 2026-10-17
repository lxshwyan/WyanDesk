import type { CSSProperties, MouseEvent, PointerEvent } from 'react';
import { MoreVertical } from 'lucide-react';
import type { Shortcut } from '../types';

interface ShortcutCardProps {
  shortcut: Shortcut;
  compact: boolean;
  onOpen: (shortcut: Shortcut) => void;
  onContextMenu: (shortcut: Shortcut, position: { x: number; y: number }) => void;
}

function shortcutDescription(shortcut: Shortcut): string {
  if (shortcut.description) return shortcut.description;
  try {
    return new URL(shortcut.url).hostname;
  } catch {
    return '快捷网站';
  }
}

export function ShortcutCard({ shortcut, compact, onOpen, onContextMenu }: ShortcutCardProps) {
  function updateHighlight(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    event.currentTarget.style.setProperty('--pointer-x', `${x}%`);
    event.currentTarget.style.setProperty('--pointer-y', `${y}%`);
  }

  const style = { '--shortcut-color': shortcut.accent } as CSSProperties;

  function showContextMenu(event: MouseEvent<HTMLElement>) {
    event.preventDefault();
    event.stopPropagation();
    const bounds = event.currentTarget.getBoundingClientRect();
    const fromKeyboard = event.clientX === 0 && event.clientY === 0;
    onContextMenu(shortcut, {
      x: fromKeyboard ? bounds.left + Math.min(bounds.width - 18, 72) : event.clientX,
      y: fromKeyboard ? bounds.top + Math.min(bounds.height - 12, 44) : event.clientY,
    });
  }

  return (
    <article className={`shortcut-card${compact ? ' compact' : ''}${shortcut.featured ? ' featured' : ''}`} style={style} onPointerMove={updateHighlight} onContextMenu={showContextMenu}>
      <a href={shortcut.url} target="_blank" rel="noreferrer" aria-label={`打开 ${shortcut.title}`} onClick={() => onOpen(shortcut)}>
        <span className="shortcut-icon">{shortcut.icon}</span>
        <span className="shortcut-copy">
          <strong>{shortcut.title}</strong>
          {!compact && <small>{shortcutDescription(shortcut)}</small>}
        </span>
      </a>
      <button className="shortcut-more" type="button" aria-label={`管理 ${shortcut.title}`} aria-haspopup="menu" onClick={showContextMenu}><MoreVertical aria-hidden="true" /></button>
    </article>
  );
}
