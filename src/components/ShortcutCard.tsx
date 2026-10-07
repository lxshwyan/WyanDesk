import type { CSSProperties, PointerEvent } from 'react';
import { ExternalLink } from 'lucide-react';
import type { Shortcut } from '../types';

interface ShortcutCardProps {
  shortcut: Shortcut;
  compact: boolean;
  onOpen: (shortcut: Shortcut) => void;
}

function shortcutDescription(shortcut: Shortcut): string {
  if (shortcut.description) return shortcut.description;
  try {
    return new URL(shortcut.url).hostname;
  } catch {
    return '快捷网站';
  }
}

export function ShortcutCard({ shortcut, compact, onOpen }: ShortcutCardProps) {
  function updateHighlight(event: PointerEvent<HTMLElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    event.currentTarget.style.setProperty('--pointer-x', `${x}%`);
    event.currentTarget.style.setProperty('--pointer-y', `${y}%`);
  }

  const style = { '--shortcut-color': shortcut.accent } as CSSProperties;

  return (
    <article className={`shortcut-card${compact ? ' compact' : ''}${shortcut.featured ? ' featured' : ''}`} style={style} onPointerMove={updateHighlight}>
      <a href={shortcut.url} target="_blank" rel="noreferrer" aria-label={`打开 ${shortcut.title}`} onClick={() => onOpen(shortcut)}>
        <span className="shortcut-icon">{shortcut.icon}</span>
        <span className="shortcut-copy">
          <strong>{shortcut.title}</strong>
          {!compact && <small>{shortcutDescription(shortcut)}</small>}
        </span>
        <ExternalLink className="shortcut-open" aria-hidden="true" />
      </a>
    </article>
  );
}
