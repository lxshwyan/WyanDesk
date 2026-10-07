import type { Shortcut } from '../types';
import { cleanCategoryName } from './categories';
import { normalizeURL } from './storage';

export interface ImportedBookmark {
  title: string;
  url: string;
  category: string;
}

const accentPalette = ['#3478f6', '#0f9b74', '#7357d9', '#d97706', '#db4d75', '#2476a8'];

function decodeHTMLEntities(value: string): string {
  return value
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code: string) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&amp;/gi, '&');
}

function plainText(value: string): string {
  return decodeHTMLEntities(value.replace(/<[^>]*>/g, '')).trim().replace(/\s+/g, ' ');
}

function bookmarkCategory(value: string): string {
  return cleanCategoryName(value).slice(0, 16) || '浏览器书签';
}

function shortcutAccent(url: string): string {
  const score = Array.from(new URL(url).hostname).reduce((sum, character) => sum + character.codePointAt(0)!, 0);
  return accentPalette[score % accentPalette.length];
}

export function parseBrowserBookmarks(source: string): ImportedBookmark[] {
  const tokens = source.match(/<H3\b[^>]*>[\s\S]*?<\/H3>|<DL\b[^>]*>|<\/DL\s*>|<A\b[^>]*>[\s\S]*?<\/A>/gi) || [];
  const folders: string[] = [];
  const bookmarks: ImportedBookmark[] = [];
  const seen = new Set<string>();
  let pendingFolder = '';

  for (const token of tokens) {
    if (/^<H3\b/i.test(token)) {
      pendingFolder = plainText(token.replace(/^<H3\b[^>]*>/i, '').replace(/<\/H3>$/i, ''));
      continue;
    }
    if (/^<DL\b/i.test(token)) {
      folders.push(pendingFolder || folders.at(-1) || '');
      pendingFolder = '';
      continue;
    }
    if (/^<\/DL/i.test(token)) {
      folders.pop();
      continue;
    }
    if (!/^<A\b/i.test(token)) continue;
    const href = token.match(/\bHREF\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i);
    const rawURL = decodeHTMLEntities(href?.[1] || href?.[2] || href?.[3] || '');
    let url = '';
    try {
      url = normalizeURL(rawURL);
    } catch {
      continue;
    }
    if (!url || seen.has(url)) continue;
    const title = plainText(token.replace(/^<A\b[^>]*>/i, '').replace(/<\/A>$/i, '')) || new URL(url).hostname;
    const category = bookmarkCategory([...folders].reverse().find(Boolean) || '浏览器书签');
    bookmarks.push({ title, url, category });
    seen.add(url);
  }
  return bookmarks;
}

export function mergeBrowserBookmarks(
  categories: string[],
  shortcuts: Shortcut[],
  imports: ImportedBookmark[],
  createId: () => string,
) {
  const nextCategories = [...categories];
  const nextShortcuts = [...shortcuts];
  const urls = new Set(shortcuts.flatMap((shortcut) => {
    try {
      return [normalizeURL(shortcut.url)];
    } catch {
      return [];
    }
  }));
  let added = 0;
  let skipped = 0;

  for (const bookmark of imports) {
    const url = normalizeURL(bookmark.url);
    if (urls.has(url)) {
      skipped += 1;
      continue;
    }
    const category = nextCategories.find((item) => item.localeCompare(bookmark.category, 'zh-CN', { sensitivity: 'base' }) === 0)
      || bookmark.category;
    if (!nextCategories.includes(category)) nextCategories.push(category);
    nextShortcuts.push({
      id: createId(),
      title: bookmark.title,
      url,
      category,
      icon: Array.from(bookmark.title)[0] || '网',
      accent: shortcutAccent(url),
      description: '导入的书签',
    });
    urls.add(url);
    added += 1;
  }

  return { categories: nextCategories, shortcuts: nextShortcuts, added, skipped };
}
