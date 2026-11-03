import { defaultShortcuts } from '../data/defaults';
import { normalizeURL } from './storage';

/** Local suggestions only: adding a link never crawls the destination. */
export function websiteNameFromURL(value: string): string {
  try {
    const url = new URL(normalizeURL(value));
    if (url.username || url.password) return '';
    const known = defaultShortcuts.find((site) => new URL(site.url).hostname === url.hostname);
    return known?.title || url.hostname.replace(/^www\./i, '');
  } catch {
    return '';
  }
}

export function updateLinkURL<T extends { title: string; url: string }>(draft: T, url: string, editing = false): T {
  const automaticTitle = !draft.title || draft.title === websiteNameFromURL(draft.url);
  return { ...draft, url, title: !editing && automaticTitle ? websiteNameFromURL(url) : draft.title };
}
