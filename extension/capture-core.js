export const SUMMARY_KEY = 'wyandesk.extension.summary';
export const CAPTURE_KEY = 'wyandesk.extension.captures';
export const DESTINATION_KEY = 'wyandesk.extension.destination';
export const RESULT_KEY = 'wyandesk.extension.result';

export const fallbackSummary = { version: 1, activeWorkspaceId: 'workspace-main', workspaces: [{ id: 'workspace-main', name: '我的桌面', categories: ['常用'], shortcuts: [], shortcutGroups: [] }] };

export function normalizedURL(value) {
  try {
    const url = new URL(value);
    if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) return '';
    // Keep hash-router destinations; plain document anchors can share one shortcut.
    if (!/^#(?:\/|!\/)/.test(url.hash)) url.hash = '';
    return url.href;
  } catch { return ''; }
}

export function resolveDestination(summary, preferred = {}) {
  const workspace = summary.workspaces.find((item) => item.id === preferred.workspaceId)
    || summary.workspaces.find((item) => item.id === summary.activeWorkspaceId) || summary.workspaces[0];
  const categories = workspace.categories?.length ? workspace.categories : ['常用'];
  return { workspaceId: workspace.id, category: categories.includes(preferred.category) ? preferred.category : categories[0] };
}

export function bookmarkFolders(nodes, trail = [], result = []) {
  for (const node of nodes || []) {
    if (node.url) continue;
    const next = node.title ? [...trail, node.title] : trail;
    if (node.id && node.title) result.push({ id: node.id, title: next.join(' / ') });
    bookmarkFolders(node.children, next, result);
  }
  return result;
}

export function selectBookmarkNodes(nodes, folderId) {
  if (!folderId) return nodes;
  for (const node of nodes || []) {
    if (!node.url && node.id === folderId) return [node];
    const found = selectBookmarkNodes(node.children, folderId);
    if (found.length) return found;
  }
  return [];
}

export function collectBookmarks(nodes, { category = '常用', preserveFolders = false, limit = 5000 } = {}) {
  const entries = [];
  const seen = new Set();
  let duplicates = 0;
  let unsupported = 0;
  let overflow = 0;
  function walk(items, folder = category) {
    for (const node of items || []) {
      if (node.url) {
        const url = normalizedURL(node.url);
        if (!url) { unsupported++; continue; }
        if (seen.has(url)) { duplicates++; continue; }
        seen.add(url);
        if (entries.length >= limit) { overflow++; continue; }
        entries.push({ title: String(node.title || new URL(url).hostname).trim().slice(0, 50), url, category: preserveFolders ? folder : category });
      } else {
        walk(node.children, node.title?.trim().slice(0, 16) || folder);
      }
    }
  }
  walk(nodes);
  return { entries, duplicates, unsupported, overflow };
}

export function contextMenuEntries(summary, preferred) {
  const destination = resolveDestination(summary, preferred);
  const workspace = summary.workspaces.find((item) => item.id === destination.workspaceId);
  const entries = [{ id: 'capture-root', title: '收藏到微言桌面', contexts: ['page', 'link'] }];
  entries.push({ id: `capture:${JSON.stringify(destination)}`, parentId: 'capture-root', title: `收藏到 ${workspace.name} / ${destination.category}`.replaceAll('&', '&&'), contexts: ['page', 'link'] });
  entries.push({ id: 'capture-separator', parentId: 'capture-root', type: 'separator', contexts: ['page', 'link'] });
  for (const item of summary.workspaces) {
    const parentId = `workspace:${item.id}`;
    entries.push({ id: parentId, parentId: 'capture-root', title: item.name.replaceAll('&', '&&'), contexts: ['page', 'link'] });
    for (const category of item.categories?.length ? item.categories : ['常用']) {
      // Include a prefix to distinguish the remembered target from its ordinary destination entry.
      entries.push({ id: `destination:${JSON.stringify({ workspaceId: item.id, category })}`, parentId, title: category.replaceAll('&', '&&'), contexts: ['page', 'link'] });
    }
  }
  entries.push({ id: 'reading-save', title: '加入微言稍后阅读', contexts: ['page', 'link'] });
  entries.push({ id: 'reading-excerpt', title: '保存选中文字到微言稍后阅读', contexts: ['selection'] });
  return entries;
}

export function appendQueue(current, kind, value) {
  if (!['items', 'groups', 'bookmarks'].includes(kind)) throw new Error('不支持的收藏类型');
  const limit = { items: 60, groups: 20, bookmarks: 4 }[kind];
  if (Array.isArray(current?.[kind]) && current[kind].length >= limit) throw new Error('待处理收藏较多，请打开桌面完成处理后再试；已有收藏不会被覆盖');
  return {
    version: 1,
    items: [...(Array.isArray(current?.items) ? current.items : []), ...(kind === 'items' ? [value] : [])],
    groups: [...(Array.isArray(current?.groups) ? current.groups : []), ...(kind === 'groups' ? [value] : [])],
    bookmarks: [...(Array.isArray(current?.bookmarks) ? current.bookmarks : []), ...(kind === 'bookmarks' ? [value] : [])],
  };
}
