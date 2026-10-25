import { SUMMARY_KEY, DESTINATION_KEY, RESULT_KEY, fallbackSummary, resolveDestination, normalizedURL, bookmarkFolders, collectBookmarks, selectBookmarkNodes } from './capture-core.js';
import { SESSION_KEY, normalizeSessions } from './session-core.js';
const extensionAPI = globalThis.chrome;

const workspaceSelect = document.querySelector('#workspace');
const categorySelect = document.querySelector('#category');
const captureKindButtons = [...document.querySelectorAll('[data-capture-kind]')];
const savePageLabel = document.querySelector('#save-page-label');
const savePageNote = document.querySelector('#save-page-note');
const shortcutGroupSelect = document.querySelector('#shortcutGroup');
const newGroupTitleField = document.querySelector('#newGroupTitleField');
const groupTitleInput = document.querySelector('#groupTitle');
const savePageButton = document.querySelector('#savePage');
const saveWindowButton = document.querySelector('#saveWindow');
const saveWindowLabel = document.querySelector('#save-window-label');
const saveWindowNote = document.querySelector('#save-window-note');
const openGroupButton = document.querySelector('#openGroup');
const openGroupNote = document.querySelector('#open-group-note');
const importBookmarksButton = document.querySelector('#importBookmarks');
const loadBookmarksButton = document.querySelector('#loadBookmarks');
const bookmarkFolderSelect = document.querySelector('#bookmarkFolder');
const bookmarkModeSelect = document.querySelector('#bookmarkMode');
const bookmarkOptions = document.querySelector('#bookmarkOptions');
const bookmarkPreview = document.querySelector('#bookmarkPreview');
const importBookmarksLabel = document.querySelector('#importBookmarksLabel');
const exportBookmarksButton = document.querySelector('#exportBookmarks');
const status = document.querySelector('#status');
const sessionList = document.querySelector('#session-list');
let summary = null;
let captureKind = 'link';
let bookmarkTree = [];
let initialized = false;
let deliveryMessage = '';

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

function currentGroups() {
  const groups = currentWorkspace()?.shortcutGroups;
  return Array.isArray(groups) ? groups : [];
}

function selectedGroup() {
  return currentGroups().find((group) => group.id === shortcutGroupSelect.value);
}

function updateGroupControls() {
  const group = selectedGroup();
  newGroupTitleField.hidden = Boolean(group);
  openGroupButton.hidden = !group;
  saveWindowLabel.textContent = group ? `加入“${group.title}”` : '创建网站组合';
  saveWindowNote.textContent = group ? '自动过滤重复网址，保留已有内容' : '保存当前窗口的全部网页';
  openGroupNote.textContent = group ? `在当前窗口打开 ${group.shortcutIds?.length || 0} 个网站` : '在当前窗口新建标签页';
}

function renderGroups() {
  const previous = shortcutGroupSelect.value;
  const createOption = new Option('＋ 新建网站组合', '');
  const options = currentGroups().map((group) => new Option(`${group.title} · ${group.shortcutIds?.length || 0} 个网站`, group.id));
  shortcutGroupSelect.replaceChildren(createOption, ...options);
  shortcutGroupSelect.value = currentGroups().some((group) => group.id === previous) ? previous : '';
  updateGroupControls();
}

async function loadSummary() {
  const result = await extensionAPI.storage.local.get([SUMMARY_KEY, DESTINATION_KEY, RESULT_KEY]);
  initialized = Boolean(result[SUMMARY_KEY]?.workspaces?.length);
  summary = initialized ? result[SUMMARY_KEY] : fallbackSummary;
  const destination = resolveDestination(summary, result[DESTINATION_KEY]);
  workspaceSelect.replaceChildren(...summary.workspaces.map((workspace) => {
    const option = document.createElement('option');
    option.value = workspace.id;
    option.textContent = workspace.name;
    option.selected = workspace.id === destination.workspaceId;
    return option;
  }));
  renderCategories();
  categorySelect.value = destination.category;
  renderGroups();
  for (const button of [savePageButton, saveWindowButton, loadBookmarksButton, exportBookmarksButton]) button.disabled = !initialized;
  if (!initialized) setStatus('请先点击“打开桌面”完成初始化，再回来收藏。');
  else if (result[RESULT_KEY] && Date.now() - result[RESULT_KEY].createdAt < 300000) setStatus(result[RESULT_KEY].message, result[RESULT_KEY].ok ? 'success' : 'error');
  else setStatus('已记住目标分组；收藏时会自动在后台打开桌面处理。');
  await extensionAPI.action.setBadgeText({ text: '' });
  await extensionAPI.action.setTitle({ title: '收藏到微言桌面' });
  const [tab] = await extensionAPI.tabs.query({ active: true, currentWindow: true });
  document.querySelector('#currentPage').textContent = validPage(tab) ? tab.title || new URL(tab.url).hostname : '浏览器内部页不能收藏，请打开普通网页。';
  if (!validPage(tab)) savePageButton.disabled = true;
}

function validPage(tab) {
  return Boolean(normalizedURL(tab?.url));
}

async function appendCapture(kind, value) {
  const result = await extensionAPI.runtime.sendMessage({ type: 'capture', kind, value });
  if (!result?.ok) throw new Error(result?.message || '扩展后台未响应，请在扩展管理页重新加载后重试');
  deliveryMessage = result.message;
  await rememberDestination();
}

async function rememberDestination() {
  if (!initialized) return;
  await extensionAPI.storage.local.set({ [DESTINATION_KEY]: { workspaceId: workspaceSelect.value, category: categorySelect.value } });
}

async function readSessions() {
  const result = await extensionAPI.storage.local.get(SESSION_KEY);
  return normalizeSessions(result[SESSION_KEY]);
}

async function saveSession(session) {
  const result = await extensionAPI.runtime.sendMessage({ type: 'session.save', session });
  if (!result?.ok) throw new Error(result?.message || '窗口未保存成功，请重试');
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
  const result = await extensionAPI.runtime.sendMessage({ type: 'session.delete', id });
  if (!result?.ok) return setStatus(result?.message || '删除失败，请重试', 'error');
  await renderSessions();
  setStatus('已删除本机会话。', 'success');
}

function selectCaptureKind(kind) {
  captureKind = ['link', 'task', 'note', 'reading'].includes(kind) ? kind : 'link';
  captureKindButtons.forEach((button) => button.classList.toggle('active', button.dataset.captureKind === captureKind));
  captureKindButtons.forEach((button) => button.setAttribute('aria-pressed', String(button.dataset.captureKind === captureKind)));
  savePageLabel.textContent = ({ link: '收藏当前网页', reading: '加入稍后阅读', task: '保存为任务', note: '保存到便签' })[captureKind];
  savePageNote.textContent = ({ link: '加入当前桌面分类', reading: '在收集箱中保留来源，之后再读', task: '添加网页标题和链接', note: '追加网页标题和链接' })[captureKind];
}

async function requestBookmarksPermission() {
  const granted = await extensionAPI.permissions.request({ permissions: ['bookmarks'] });
  if (!granted) throw new Error('未获得书签权限，未读取或修改任何书签');
}

function selectedBookmarkNodes() {
  return selectBookmarkNodes(bookmarkTree, bookmarkFolderSelect.value);
}

function bookmarkImportPlan() {
  const result = collectBookmarks(selectedBookmarkNodes(), { category: categorySelect.value, preserveFolders: bookmarkModeSelect.value === 'folders' });
  const existing = new Set((currentWorkspace()?.shortcuts || []).map((shortcut) => normalizedURL(shortcut.url)));
  const entries = result.entries.filter((entry) => !existing.has(entry.url));
  return { ...result, entries, existing: result.entries.length - entries.length };
}

function updateBookmarkPreview() {
  if (bookmarkOptions.hidden) return;
  const plan = bookmarkImportPlan();
  bookmarkPreview.textContent = `可导入 ${plan.entries.length} 个；跳过 ${plan.existing} 个桌面已有、${plan.duplicates} 个重复、${plan.unsupported} 个非网页书签。${plan.overflow ? `另有 ${plan.overflow} 个超出单次 5000 条上限，请分文件夹导入。` : ''}已有网站不移动分组。`;
  importBookmarksButton.disabled = !plan.entries.length;
  importBookmarksLabel.textContent = bookmarkModeSelect.value === 'folders' ? `按原文件夹导入 ${plan.entries.length} 个` : `导入 ${plan.entries.length} 个到“${categorySelect.value}”`;
}

async function loadBrowserBookmarks() {
  loadBookmarksButton.disabled = true;
  try {
    await requestBookmarksPermission();
    bookmarkTree = await extensionAPI.bookmarks.getTree();
    bookmarkFolderSelect.replaceChildren(new Option('全部浏览器书签', ''), ...bookmarkFolders(bookmarkTree).map((folder) => new Option(folder.title, folder.id)));
    bookmarkOptions.hidden = false;
    updateBookmarkPreview();
    setStatus('选择来源和导入方式后，点击导入；不会删除或修改原书签。');
    bookmarkFolderSelect.focus();
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '读取书签失败，请重试', 'error');
  } finally { loadBookmarksButton.disabled = false; }
}

async function importBrowserBookmarks() {
  importBookmarksButton.disabled = true;
  try {
    const { entries } = bookmarkImportPlan();
    if (!entries.length) throw new Error('浏览器里没有可导入的网页书签');
    await appendCapture('bookmarks', {
      id: crypto.randomUUID(),
      workspaceId: workspaceSelect.value,
      entries,
    });
    setStatus(`已提交 ${entries.length} 个书签。${deliveryMessage}`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '导入书签失败，请重试', 'error');
  } finally {
    updateBookmarkPreview();
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
    const url = normalizedURL(tab.url);
    const existing = captureKind === 'link' && currentWorkspace()?.shortcuts?.find((shortcut) => normalizedURL(shortcut.url) === url);
    if (existing) return setStatus(`此网页已在“${existing.category}”分组，不重复添加；可在桌面右键移动分组。`, 'success');
    await appendCapture('items', {
      id: crypto.randomUUID(),
      kind: captureKind,
      title: tab.title || new URL(tab.url).hostname,
      url,
      workspaceId: workspaceSelect.value,
      category: categorySelect.value,
    });
    setStatus(({ link: '已提交当前网页收藏。', reading: '已提交稍后阅读。', task: '已提交当前网页任务。', note: '已提交当前网页便签。' })[captureKind] + deliveryMessage, 'success');
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
    if (tabs.length > 200) throw new Error('当前窗口超过 200 个网页，请分窗口保存');
    const now = new Date();
    const fallbackTitle = `标签组 ${now.getMonth() + 1}月${now.getDate()}日 ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    const id = crypto.randomUUID();
    const group = selectedGroup();
    const title = group?.title || groupTitleInput.value.trim() || fallbackTitle;
    await appendCapture('groups', {
      id,
      title,
      targetGroupId: group?.id,
      workspaceId: workspaceSelect.value,
      category: categorySelect.value,
      tabs,
    });
    await saveSession({ id, title, tabs, createdAt: new Date().toISOString() });
    await renderSessions();
    setStatus((group ? `已将 ${tabs.length} 个网页送入“${group.title}”，将自动去重。` : `已暂存 ${tabs.length} 个网页并提交网站组合。`) + deliveryMessage, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '保存窗口失败，请重试', 'error');
  } finally {
    saveWindowButton.disabled = false;
  }
}

async function openSelectedGroup() {
  const group = selectedGroup();
  if (!group) return setStatus('请先选择一个已有组合', 'error');
  const workspace = currentWorkspace();
  const shortcutById = new Map((workspace?.shortcuts || []).map((shortcut) => [shortcut.id, shortcut]));
  const seen = new Set();
  const shortcuts = (group.shortcutIds || [])
    .map((id) => shortcutById.get(id))
    .filter((shortcut) => {
      if (!validPage(shortcut) || seen.has(shortcut.url)) return false;
      seen.add(shortcut.url);
      return true;
    });
  if (!shortcuts.length) return setStatus('这个组合里暂时没有可打开的网站', 'error');
  if (shortcuts.length > 12 && !globalThis.confirm(`“${group.title}”有 ${shortcuts.length} 个网站，确认全部打开？`)) return;
  openGroupButton.disabled = true;
  try {
    for (const shortcut of shortcuts) {
      await extensionAPI.tabs.create({ url: shortcut.url, active: false });
    }
    setStatus(`已在当前窗口打开“${group.title}”的 ${shortcuts.length} 个网站。`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '打开组合失败，请重试', 'error');
  } finally {
    openGroupButton.disabled = false;
  }
}

workspaceSelect.addEventListener('change', () => { renderCategories(); renderGroups(); updateBookmarkPreview(); void rememberDestination().catch(() => setStatus('未能记住目标分组，请重试', 'error')); });
categorySelect.addEventListener('change', () => { updateBookmarkPreview(); void rememberDestination().catch(() => setStatus('未能记住目标分组，请重试', 'error')); });
shortcutGroupSelect.addEventListener('change', updateGroupControls);
captureKindButtons.forEach((button) => button.addEventListener('click', () => selectCaptureKind(button.dataset.captureKind)));
savePageButton.addEventListener('click', saveCurrentPage);
saveWindowButton.addEventListener('click', saveCurrentWindow);
openGroupButton.addEventListener('click', openSelectedGroup);
importBookmarksButton.addEventListener('click', importBrowserBookmarks);
loadBookmarksButton.addEventListener('click', loadBrowserBookmarks);
bookmarkFolderSelect.addEventListener('change', updateBookmarkPreview);
bookmarkModeSelect.addEventListener('change', updateBookmarkPreview);
exportBookmarksButton.addEventListener('click', exportDesktopBookmarks);
if (extensionAPI?.storage?.local) {
  void Promise.all([loadSummary(), renderSessions()]).catch(() => setStatus('请先打开一个微言桌面新标签页', 'error'));
  selectCaptureKind('link');
} else {
  summary = { version: 1, activeWorkspaceId: 'workspace-work', workspaces: [{ id: 'workspace-work', name: '工作', categories: ['常用', '办公'], shortcuts: [], shortcutGroups: [] }] };
  workspaceSelect.replaceChildren(...summary.workspaces.map((workspace) => new Option(workspace.name, workspace.id)));
  renderCategories();
  renderGroups();
  savePageButton.disabled = true;
  saveWindowButton.disabled = true;
  importBookmarksButton.disabled = true;
  loadBookmarksButton.disabled = true;
  exportBookmarksButton.disabled = true;
  setStatus('扩展界面预览：安装后可使用收藏功能。');
}
