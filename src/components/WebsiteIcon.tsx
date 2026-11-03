import { useState } from 'react';
import type { Shortcut } from '../types';
import { websiteIconSource } from '../lib/websiteIcons';

export function WebsiteIcon({ shortcut }: { shortcut: Pick<Shortcut, 'url' | 'icon' | 'iconStyle' | 'title'> }) {
  const source = websiteIconSource(shortcut);
  const [failedSource, setFailedSource] = useState<string | null>(null);
  return source && source !== failedSource
    ? <img className="website-logo" src={source} alt="" width="28" height="28" loading="lazy" decoding="async" onError={() => setFailedSource(source)} />
    : <>{shortcut.icon || Array.from(shortcut.title)[0] || 'W'}</>;
}

export function WebsitePreview({ shortcuts }: { shortcuts: Shortcut[] }) {
  return <span className="website-preview" aria-hidden="true">{shortcuts.slice(0, 4).map((shortcut) => <span key={shortcut.id} style={{ color: shortcut.accent }}><WebsiteIcon shortcut={shortcut} /></span>)}</span>;
}
