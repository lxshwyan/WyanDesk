import { SUMMARY_KEY, CAPTURE_KEY, DESTINATION_KEY, RESULT_KEY, fallbackSummary, normalizedURL, contextMenuEntries, appendQueue, resolveDestination } from './capture-core.js';
import { SESSION_KEY, normalizeSession, normalizeSessions } from './session-core.js';

const api = chrome;
let captures = Promise.resolve();
let menus = Promise.resolve();
let sessionWrites = Promise.resolve();
let menuFingerprint = '';

async function readContext() {
  const stored = await api.storage.local.get([SUMMARY_KEY, DESTINATION_KEY]);
  return { summary: stored[SUMMARY_KEY] || fallbackSummary, preferred: stored[DESTINATION_KEY], initialized: Boolean(stored[SUMMARY_KEY]?.workspaces?.length) };
}

function refreshMenus() {
  menus = menus.catch(() => undefined).then(async () => {
    const { summary, preferred } = await readContext();
    const entries = contextMenuEntries(summary, preferred);
    const fingerprint = JSON.stringify(entries);
    if (fingerprint === menuFingerprint) return;
    await api.contextMenus.removeAll();
    for (const entry of entries) {
      await new Promise((resolve, reject) => api.contextMenus.create(entry, () => {
        const error = api.runtime.lastError;
        if (error) reject(new Error(error.message)); else resolve();
      }));
    }
    menuFingerprint = fingerprint;
  });
  return menus;
}

async function ensureDesktop() {
  const home = api.runtime.getURL('app/index.html');
  // Inspect only this extension's contexts, never other sites' titles or URLs.
  const contexts = await api.runtime.getContexts({ contextTypes: ['TAB'] });
  if (!contexts.some((context) => context.documentUrl?.split(/[?#]/)[0] === home)) await api.tabs.create({ url: home, active: false });
}

export function enqueueCapture(kind, value) {
  const operation = captures.catch(() => undefined).then(async () => {
    const { summary, initialized } = await readContext();
    if (!initialized) throw new Error('请先打开一个微言桌面新标签页完成初始化，再收藏');
    const workspace = summary.workspaces.find((workspace) => workspace.id === value.workspaceId);
    if (!workspace) throw new Error('目标桌面已不存在，请重新选择');
    const existing = kind === 'items' && (!value.kind || value.kind === 'link')
      && workspace.shortcuts?.find((shortcut) => normalizedURL(shortcut.url) === normalizedURL(value.url));
    if (existing) return { ok: true, message: `此网页已在“${existing.category}”分组，不重复添加；可在桌面右键移动分组。` };
    const stored = await api.storage.local.get(CAPTURE_KEY);
    await api.storage.local.set({ [CAPTURE_KEY]: appendQueue(stored[CAPTURE_KEY], kind, value) });
    let opened = true;
    try { await ensureDesktop(); } catch { opened = false; }
    return { ok: true, message: opened ? '已交给桌面处理；登录后按原同步设置保存到云端。' : '已暂存，请打开微言桌面完成保存和同步。' };
  });
  captures = operation;
  return operation;
}

async function captureFromMenu(info, tab) {
  const menuId = String(info.menuItemId);
  const reading = menuId === 'reading-save' || menuId === 'reading-excerpt';
  if (!reading && !menuId.startsWith('capture:') && !menuId.startsWith('destination:')) return;
  try {
    const { summary, preferred, initialized } = await readContext();
    if (!initialized) throw new Error('请先打开一个微言桌面新标签页完成初始化，再收藏');
    const destination = reading ? resolveDestination(summary, preferred) : JSON.parse(menuId.slice(menuId.indexOf(':') + 1));
    const workspace = summary.workspaces.find((item) => item.id === destination.workspaceId);
    if (!workspace?.categories.includes(destination.category)) throw new Error('目标分组已改变，请重新选择分组');
    if (menuId === 'reading-excerpt' && (info.editable || !info.selectionText?.trim())) throw new Error('请选择网页正文中的文字，不保存输入框内容');
    const raw = menuId === 'reading-excerpt' ? info.pageUrl || tab?.url : info.linkUrl || info.pageUrl || tab?.url;
    const url = normalizedURL(raw);
    if (!url) throw new Error('只能收藏普通 http/https 网页，且网址不能包含账号密码');
    const title = info.linkUrl ? new URL(url).hostname : tab?.title || new URL(url).hostname;
    const result = await enqueueCapture('items', { id: crypto.randomUUID(), kind: reading ? 'reading' : 'link', title, url, ...(menuId === 'reading-excerpt' ? { excerpt: info.selectionText.trim().slice(0, 2000) } : {}), ...destination });
    await api.storage.local.set({ [DESTINATION_KEY]: destination, [RESULT_KEY]: { ...result, createdAt: Date.now(), title } });
    await api.action.setBadgeText({ text: '✓' });
    await api.action.setBadgeBackgroundColor({ color: '#237054' });
    await api.action.setTitle({ title: `已收藏：${title}；点击查看` });
  } catch (error) {
    await api.storage.local.set({ [RESULT_KEY]: { ok: false, message: error.message || '收藏失败，请从工具栏重试', createdAt: Date.now() } });
    await api.action.setBadgeText({ text: '!' });
    await api.action.setBadgeBackgroundColor({ color: '#a33b3b' });
    await api.action.setTitle({ title: '收藏失败，点击查看原因' });
  }
}

api.runtime.onInstalled.addListener(() => { void refreshMenus().catch(() => undefined); });
api.runtime.onStartup.addListener(() => { void refreshMenus().catch(() => undefined); });
api.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && (changes[SUMMARY_KEY] || changes[DESTINATION_KEY])) void refreshMenus().catch(() => undefined);
});
api.contextMenus.onClicked.addListener((info, tab) => { void captureFromMenu(info, tab); });
api.runtime.onMessage.addListener((message, sender, respond) => {
  if (sender.id !== api.runtime.id) return;
  const source = sender.url?.split(/[?#]/)[0];
  if ((source === api.runtime.getURL('popup.html') || source === api.runtime.getURL('app/index.html')) && ['session.save', 'session.delete'].includes(message?.type)) {
    const operation = sessionWrites.catch(() => undefined).then(async () => {
      const stored = await api.storage.local.get(SESSION_KEY);
      const current = normalizeSessions(stored[SESSION_KEY]);
      if (message.type === 'session.delete') {
        if (typeof message.id !== 'string') throw new Error('窗口编号无效');
        await api.storage.local.set({ [SESSION_KEY]: current.filter((item) => item.id !== message.id) });
      } else {
        const session = normalizeSession(message.session);
        if (!session || session.tabs.length > 200) throw new Error('窗口记录无效或超过 200 个网页');
        await api.storage.local.set({ [SESSION_KEY]: [session, ...current.filter((item) => item.id !== session.id)].slice(0, 20) });
      }
    });
    sessionWrites = operation;
    void operation.then(() => respond({ ok: true }), (error) => respond({ ok: false, message: error.message || '窗口未保存成功，请重试' }));
    return true;
  }
  if (message?.type === 'capture.ack' && source === api.runtime.getURL('app/index.html')) {
    const operation = captures.catch(() => undefined).then(async () => {
      const stored = await api.storage.local.get(CAPTURE_KEY);
      const current = stored[CAPTURE_KEY];
      if (!current) return;
      const next = { version: 1 };
      for (const kind of ['items', 'groups', 'bookmarks']) {
        const ids = new Set(message.ids?.[kind] || []);
        next[kind] = (current[kind] || []).filter((item) => !ids.has(item.id));
      }
      await api.storage.local.set({ [CAPTURE_KEY]: next });
    });
    captures = operation;
    void operation.then(() => respond({ ok: true }), () => respond({ ok: false }));
    return true;
  }
  if (source !== api.runtime.getURL('popup.html') || message?.type !== 'capture') return;
  void enqueueCapture(message.kind, message.value).then(respond, (error) => respond({ ok: false, message: error.message || '保存失败，请重试' }));
  return true;
});
