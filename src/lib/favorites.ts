import type { FavoriteGroup, FavoriteLink } from '../types';
import { createDefaultFavoriteGroups } from '../data/appLauncher';

export const MAX_FAVORITE_GROUPS = 12;
export const MAX_FAVORITE_LINKS = 60;

export function favoriteURL(value: string): string {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) throw new Error('请填写有效的网站地址（不超过 2048 字）');
  let url: URL;
  try {
    url = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
  } catch {
    throw new Error('网站地址格式不正确');
  }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error('请使用不含账号密码的 HTTP 或 HTTPS 网址');
  return url.href;
}

export function favoriteLink(value: Omit<FavoriteLink, 'url'> & { url: string }): FavoriteLink {
  const title = value.title.trim().slice(0, 40);
  if (!title) throw new Error('请填写网站名称');
  return {
    id: value.id,
    title,
    url: favoriteURL(value.url),
    icon: Array.from(value.icon.trim() || title).slice(0, 2).join(''),
    iconStyle: value.iconStyle === 'text' ? 'text' : 'auto',
    accent: /^#[\da-f]{6}$/i.test(value.accent) ? value.accent : '#3478f6',
  };
}

/** Missing field upgrades old clients; an explicit empty array stays empty. */
export function normalizeFavoriteGroups(value: unknown): FavoriteGroup[] {
  if (!Array.isArray(value)) return createDefaultFavoriteGroups();
  const groups: FavoriteGroup[] = [];
  const groupIds = new Set<string>();
  for (const raw of value) {
    if (!raw || typeof raw !== 'object' || groups.length >= MAX_FAVORITE_GROUPS) continue;
    const group = raw as Record<string, unknown>;
    const id = typeof group.id === 'string' ? group.id.trim().slice(0, 120) : '';
    const title = typeof group.title === 'string' ? group.title.trim().slice(0, 20) : '';
    if (!id || !title || groupIds.has(id)) continue;
    const links: FavoriteLink[] = [];
    const linkIds = new Set<string>();
    const urls = new Set<string>();
    for (const rawLink of Array.isArray(group.links) ? group.links : []) {
      if (!rawLink || typeof rawLink !== 'object' || links.length >= MAX_FAVORITE_LINKS) continue;
      const link = rawLink as Record<string, unknown>;
      if (typeof link.id !== 'string' || !link.id.trim() || typeof link.title !== 'string' || typeof link.url !== 'string') continue;
      try {
        const normalized = favoriteLink({ id: link.id.trim().slice(0, 120), title: link.title, url: link.url, icon: typeof link.icon === 'string' ? link.icon : '', iconStyle: link.iconStyle === 'text' ? 'text' : 'auto', accent: typeof link.accent === 'string' ? link.accent : '' });
        if (linkIds.has(normalized.id) || urls.has(normalized.url)) continue;
        links.push(normalized);
        linkIds.add(normalized.id);
        urls.add(normalized.url);
      } catch { /* Invalid imported links never become clickable. */ }
    }
    groups.push({ id, title, links });
    groupIds.add(id);
  }
  const stockIds = ['wyan-tools', 'wyan-whiteboard', 'wyan-forms', 'wyan-survey', 'wyan-fishing', 'wyan-sudoku', 'wyan-idc'];
  const stockTitles = ['工具箱', '手绘白板', '表单', '问卷', '闲钓小栈', '算独方格', '三维机房'];
  const stockURLs = ['https://tools.wyanhub.com/tools', 'https://tools.wyanhub.com/tools/design/whiteboard', 'https://forms.wyanhub.com/', 'https://survey.wyanhub.com/', 'https://fishing.wyanhub.com/', 'https://wyanhub.com/sudoku/', 'https://wyanhub.com/idc/'];
  return groups.map((group) => group.id === 'favorites-default' && group.title === '常用' && group.links.length === 7 && group.links.every((link) => stockTitles[stockIds.indexOf(link.id)] === link.title && stockURLs[stockIds.indexOf(link.id)] === link.url)
    ? { ...group, links: createDefaultFavoriteGroups()[0].links } : group);
}

export function putFavoriteLink(groups: FavoriteGroup[], groupId: string, draft: FavoriteLink): FavoriteGroup[] {
  const group = groups.find((item) => item.id === groupId);
  if (!group) throw new Error('请先新建或选择分组');
  const link = favoriteLink(draft);
  if (group.links.some((item) => item.id !== link.id && favoriteURL(item.url) === link.url)) throw new Error('这个网址已经在该分组中');
  const editing = group.links.some((item) => item.id === link.id);
  if (!editing && group.links.length >= MAX_FAVORITE_LINKS) throw new Error(`每个分组最多保存 ${MAX_FAVORITE_LINKS} 个网站`);
  return groups.map((item) => item.id !== groupId ? item : { ...item, links: editing ? item.links.map((old) => old.id === link.id ? link : old) : [...item.links, link] });
}

export function moveFavoriteItem<T extends { id: string }>(items: T[], id: string, direction: -1 | 1): T[] {
  const index = items.findIndex((item) => item.id === id);
  const target = index + direction;
  if (index < 0 || target < 0 || target >= items.length) return items;
  const result = [...items];
  [result[index], result[target]] = [result[target], result[index]];
  return result;
}
