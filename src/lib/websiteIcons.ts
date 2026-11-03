import icons from '../data/site-icons.json';
import type { Shortcut } from '../types';

export function websiteIconSource(shortcut: Pick<Shortcut, 'url' | 'icon' | 'iconStyle' | 'title'>): string | null {
  if (shortcut.iconStyle === 'text') return null;
  try {
    const host = new URL(shortcut.url).hostname.toLowerCase();
    const match = icons.find((item) => item.host === host);
    if (!match) return null;
    // Preserve a legacy, explicitly customized monogram.
    if (!shortcut.iconStyle && shortcut.icon && shortcut.icon !== match.icon && shortcut.icon !== Array.from(shortcut.title)[0]) return null;
    return `.${match.path}`;
  } catch {
    return null;
  }
}
