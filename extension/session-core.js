export const SESSION_KEY = 'wyandesk.extension.sessions';

export function normalizeSession(value) {
  if (!value || typeof value !== 'object' || typeof value.id !== 'string' || !/^[a-zA-Z0-9_-]{1,128}$/.test(value.id) || !Array.isArray(value.tabs)) return null;
  const tabs = value.tabs.flatMap((tab) => {
    try {
      const url = new URL(tab.url);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || tab.incognito) return [];
      return [{ title: String(tab.title || url.hostname).slice(0, 200), url: url.href, pinned: Boolean(tab.pinned), active: Boolean(tab.active) }];
    } catch { return []; }
  });
  if (!tabs.length) return null;
  return {
    id: value.id,
    title: String(value.title || '未命名窗口').trim().slice(0, 60) || '未命名窗口',
    tabs,
    createdAt: typeof value.createdAt === 'string' && Number.isFinite(Date.parse(value.createdAt)) ? value.createdAt : new Date(0).toISOString(),
  };
}

export function normalizeSessions(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  return value.flatMap((entry) => {
    const session = normalizeSession(entry);
    if (!session || seen.has(session.id)) return [];
    seen.add(session.id);
    return [session];
  }).sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)).slice(0, 20);
}
