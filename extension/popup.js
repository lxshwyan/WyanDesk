const SUMMARY_KEY = 'wyandesk.extension.summary';
const CAPTURE_KEY = 'wyandesk.extension.captures';
const SESSION_KEY = 'wyandesk.extension.sessions';
const extensionAPI = globalThis.chrome;

const workspaceSelect = document.querySelector('#workspace');
const categorySelect = document.querySelector('#category');
const captureKindButtons = [...document.querySelectorAll('[data-capture-kind]')];
const savePageLabel = document.querySelector('#save-page-label');
const savePageNote = document.querySelector('#save-page-note');
const groupTitleInput = document.querySelector('#groupTitle');
const savePageButton = document.querySelector('#savePage');
const saveWindowButton = document.querySelector('#saveWindow');
const importBookmarksButton = document.querySelector('#importBookmarks');
const exportBookmarksButton = document.querySelector('#exportBookmarks');
const status = document.querySelector('#status');
const sessionList = document.querySelector('#session-list');
let summary = null;
let captureKind = 'link';

function setStatus(message, kind = '') {
  status.textContent = message;
  status.className = kind;
}

function currentWorkspace() {
  return summary?.workspaces.find((item) => item.id === workspaceSelect.value) || summary?.workspaces[0];
}

function renderCategories() {
  const workspace = currentWorkspace();
  const categories = workspace?.categories?.length ? workspace.categories : ['常用'];
  categorySelect.replaceChildren(...categories.map((category) => {
    const option = document.createElement('option');
    option.value = category;
    option.textContent = category;
    return option;
  }));
}

async function loadSummary() {
  const result = await extensionAPI.storage.local.get(SUMMARY_KEY);
  summary = result[SUMMARY_KEY] || {
    version: 1,
    activeWorkspaceId: 'workspace-work',
    workspaces: [{ id: 'workspace-work', name: '工作', categories: ['常用'], shortcuts: [] }],
  };
  workspaceSelect.replaceChildren(...summary.workspaces.map((workspace) => {
    const option = document.createElement('option');
    option.value = workspace.id;
    option.textContent = workspace.name;
    option.selected = workspace.id === summary.activeWorkspaceId;
    return option;
  }));
  renderCategories();
}

function validPage(tab) {
  return tab?.url && /^https?:\/\//i.test(tab.url);
}

async function appendCapture(kind, value) {
  const result = await extensionAPI.storage.local.get(CAPTURE_KEY);
  const current = result[CAPTURE_KEY] || { version: 1, items: [], groups: [], bookmarks: [] };
  const next = {
    version: 1,
    items: Array.isArray(current.items) ? current.items.slice(-59) : [],
    groups: Array.isArray(current.groups) ? current.groups.slice(-19) : [],
    bookmarks: Array.isArray(current.bookmarks) ? current.bookmarks.slice(-3) : [],
  };
  next[kind].push(value);
  await extensionAPI.storage.local.set({ [CAPTURE_KEY]: next });
}

async function readSessions() {
  const result = await extensionAPI.storage.local.get(SESSION_KEY);
  return Array.isArray(result[SESSION_KEY]) ? result[SESSION_KEY] : [];
}

async function writeSessions(items) {
  await extensionAPI.storage.local.set({ [SESSION_KEY]: items.slice(0, 20) });
}

async function renderSessions() {
  const sessions = await readSessions();
  sessionList.innerHTML = sessions.length ? sessions.slice(0, 4).map((session) => `<div class="session-row"><span><strong>${escapeHTML(session.title)}</strong><small>${session.tabs.length} 个网页 · ${new Date(session.createdAt).toLocaleDateString('zh-CN')}</small></span><span><button type="button" data-restore-session="${session.id}">恢复</button><button type="button" data-delete-session="${session.id}" aria-label="删除会话">×</button></span></div>`).join('') : '<p class="session-empty">暂无已保存会话</p>';
  sessionList.querySelectorAll('[data-restore-session]').forEach((button) => { button.addEventListener('click', () => restoreSession(button.dataset.restoreSession)); });
  sessionList.querySelectorAll('[data-delete-session]').forEach((button) => { button.addEventListener('click', () => deleteSession(button.dataset.deleteSession)); });
}

function escapeHTML(value = '') {
  return String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' })[character]);
}

async function restoreSession(id) {
  const granted = await extensionAPI.permissions.request({ permissions: ['tabs'] });
  if (!granted) return setStatus('未获得标签页权限', 'error');
  const session = (await readSessions()).find((item) => item.id === id);
  if (!session?.tabs?.length) return setStatus('会话不存在', 'error');
  try {
    const created = await extensionAPI.windows.create({ url: session.tabs[0].url, focused: true });
    const firstTab = created.tabs?.[0];
    if (firstTab?.id && session.tabs[0].pinned) await extensionAPI.tabs.update(firstTab.id, { pinned: true });
    for (const tab of session.tabs.slice(1)) {
      await extensionAPI.tabs.create({ windowId: created.id, url: tab.url, active: false, pinned: Boolean(tab.pinned) });
    }
    setStatus(`已在新窗口恢复 ${session.tabs.length} 个网页。`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '会话恢复失败', 'error');
  }
}

async function deleteSession(id) {
  await writeSessions((await readSessions()).filter((item) => item.id !== id));
  await renderSessions();
  setStatus('已删除本机会话。', 'success');
}

function selectCaptureKind(kind) {
  captureKind = ['link', 'task', 'note'].includes(kind) ? kind : 'link';
  captureKindButtons.forEach((button) => button.classList.toggle('active', button.dataset.captureKind === captureKind));
  categorySelect.disabled = captureKind !== 'link';
  savePageLabel.textContent = ({ link: '收藏当前网页', task: '保存为任务', note: '保存到便签' })[captureKind];
  savePageNote.textContent = ({ link: '加入当前桌面分类', task: '添加网页标题和链接', note: '追加网页标题和链接' })[captureKind];
}

async function requestBookmarksPermission() {
  const granted = await extensionAPI.permissions.request({ permissions: ['bookmarks'] });
  if (!granted) throw new Error('未获得书签权限，未读取或修改任何书签');
}

function categoryForTrail(trail) {
  const meaningful = trail.filter(Boolean);
  if (meaningful.length <= 1) return categorySelect.value || '常用';
  return meaningful.at(-1).trim().slice(0, 16) || categorySelect.value || '常用';
}

function flattenBookmarks(nodes, trail = [], entries = []) {
  for (const node of nodes || []) {
    if (entries.length >= 5000) break;
    if (node.url && /^https?:\/\//i.test(node.url)) {
      entries.push({
        title: (node.title || new URL(node.url).hostname).trim().slice(0, 50),
        url: node.url,
        category: categoryForTrail(trail),
      });
      continue;
    }
    const nextTrail = node.title ? [...trail, node.title] : trail;
    flattenBookmarks(node.children, nextTrail, entries);
  }
  return entries;
}

async function importBrowserBookmarks() {
  importBookmarksButton.disabled = true;
  try {
    await requestBookmarksPermission();
    const entries = flattenBookmarks(await extensionAPI.bookmarks.getTree());
    if (!entries.length) throw new Error('浏览器里没有可导入的网页书签');
    await appendCapture('bookmarks', {
      id: crypto.randomUUID(),
      workspaceId: workspaceSelect.value,
      entries,
    });
    const capped = entries.length === 5000 ? '（已达到单次 5000 条上限）' : '';
    setStatus(`已送入 ${entries.length} 个书签${capped}，微言桌面将自动去重。`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '导入书签失败，请重试', 'error');
  } finally {
    importBookmarksButton.disabled = false;
  }
}

function safeFolderTitle(value, fallback) {
  return String(value || fallback).replace(/[\r\n]+/g, ' ').trim().slice(0, 80) || fallback;
}

async function exportDesktopBookmarks() {
  exportBookmarksButton.disabled = true;
  try {
    await requestBookmarksPermission();
    const workspace = currentWorkspace();
    const shortcuts = Array.isArray(workspace?.shortcuts) ? workspace.shortcuts.filter((item) => /^https?:\/\//i.test(item.url)) : [];
    if (!shortcuts.length) throw new Error('当前桌面还没有可导出的网站');
    const now = new Date();
    const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')} ${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
    const root = await extensionAPI.bookmarks.create({ title: `WyanDesk 导出 ${stamp}` });
    const byCategory = new Map();
    for (const shortcut of shortcuts) {
      const category = safeFolderTitle(shortcut.category, '常用');
      if (!byCategory.has(category)) byCategory.set(category, []);
      byCategory.get(category).push(shortcut);
    }
    for (const [category, items] of byCategory) {
      const folder = await extensionAPI.bookmarks.create({ parentId: root.id, title: category });
      for (const shortcut of items) {
        await extensionAPI.bookmarks.create({
          parentId: folder.id,
          title: safeFolderTitle(shortcut.title, new URL(shortcut.url).hostname),
          url: shortcut.url,
        });
      }
    }
    setStatus(`已将“${workspace.name}”的 ${shortcuts.length} 个网站导出到浏览器书签。`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '导出书签失败，请重试', 'error');
  } finally {
    exportBookmarksButton.disabled = false;
  }
}

async function saveCurrentPage() {
  savePageButton.disabled = true;
  try {
    const [tab] = await extensionAPI.tabs.query({ active: true, currentWindow: true });
    if (!validPage(tab)) throw new Error('当前页面不能收藏');
    await appendCapture('items', {
      id: crypto.randomUUID(),
      kind: captureKind,
      title: tab.title || new URL(tab.url).hostname,
      url: tab.url,
      workspaceId: workspaceSelect.value,
      category: categorySelect.value,
    });
    setStatus(({ link: '已收藏当前网页。', task: '已保存为当前桌面任务。', note: '已追加到当前桌面便签。' })[captureKind], 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '收藏失败，请重试', 'error');
  } finally {
    savePageButton.disabled = false;
  }
}

async function saveCurrentWindow() {
  saveWindowButton.disabled = true;
  try {
    const granted = await extensionAPI.permissions.request({ permissions: ['tabs'] });
    if (!granted) throw new Error('未获得标签页权限');
    const tabs = (await extensionAPI.tabs.query({ currentWindow: true }))
      .filter(validPage)
      .map((tab) => ({ title: tab.title || new URL(tab.url).hostname, url: tab.url, pinned: Boolean(tab.pinned), active: Boolean(tab.active), index: tab.index }));
    if (!tabs.length) throw new Error('当前窗口没有可保存的网页');
    const now = new Date();
    const fallbackTitle = `标签组 ${now.getMonth() + 1}月${now.getDate()}日 ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    const id = crypto.randomUUID();
    const title = groupTitleInput.value.trim() || fallbackTitle;
    await appendCapture('groups', {
      id,
      title,
      workspaceId: workspaceSelect.value,
      category: categorySelect.value,
      tabs,
    });
    await writeSessions([{ id, title, tabs, createdAt: new Date().toISOString() }, ...(await readSessions()).filter((item) => item.id !== id)]);
    await renderSessions();
    setStatus(`已暂存 ${tabs.length} 个网页，并创建网站组合。`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '保存窗口失败，请重试', 'error');
  } finally {
    saveWindowButton.disabled = false;
  }
}

workspaceSelect.addEventListener('change', renderCategories);
captureKindButtons.forEach((button) => button.addEventListener('click', () => selectCaptureKind(button.dataset.captureKind)));
savePageButton.addEventListener('click', saveCurrentPage);
saveWindowButton.addEventListener('click', saveCurrentWindow);
importBookmarksButton.addEventListener('click', importBrowserBookmarks);
exportBookmarksButton.addEventListener('click', exportDesktopBookmarks);
if (extensionAPI?.storage?.local) {
  void Promise.all([loadSummary(), renderSessions()]).catch(() => setStatus('请先打开一个微言桌面新标签页', 'error'));
  selectCaptureKind('link');
} else {
  summary = { version: 1, activeWorkspaceId: 'workspace-work', workspaces: [{ id: 'workspace-work', name: '工作', categories: ['常用', '办公'], shortcuts: [] }] };
  workspaceSelect.replaceChildren(...summary.workspaces.map((workspace) => new Option(workspace.name, workspace.id)));
  renderCategories();
  savePageButton.disabled = true;
  saveWindowButton.disabled = true;
  importBookmarksButton.disabled = true;
  exportBookmarksButton.disabled = true;
  setStatus('扩展界面预览：安装后可使用收藏功能。');
}
