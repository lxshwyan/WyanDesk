const SUMMARY_KEY = 'wyandesk.extension.summary';
const CAPTURE_KEY = 'wyandesk.extension.captures';
const extensionAPI = globalThis.chrome;

const workspaceSelect = document.querySelector('#workspace');
const categorySelect = document.querySelector('#category');
const groupTitleInput = document.querySelector('#groupTitle');
const savePageButton = document.querySelector('#savePage');
const saveWindowButton = document.querySelector('#saveWindow');
const importBookmarksButton = document.querySelector('#importBookmarks');
const exportBookmarksButton = document.querySelector('#exportBookmarks');
const status = document.querySelector('#status');
let summary = null;

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
      title: tab.title || new URL(tab.url).hostname,
      url: tab.url,
      workspaceId: workspaceSelect.value,
      category: categorySelect.value,
    });
    setStatus('已收藏当前网页，微言桌面会自动整理。', 'success');
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
      .map((tab) => ({ title: tab.title || new URL(tab.url).hostname, url: tab.url }));
    if (!tabs.length) throw new Error('当前窗口没有可保存的网页');
    const now = new Date();
    const fallbackTitle = `标签组 ${now.getMonth() + 1}月${now.getDate()}日 ${now.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    await appendCapture('groups', {
      id: crypto.randomUUID(),
      title: groupTitleInput.value.trim() || fallbackTitle,
      workspaceId: workspaceSelect.value,
      category: categorySelect.value,
      tabs,
    });
    setStatus(`已保存 ${tabs.length} 个网页为网站组合。`, 'success');
  } catch (error) {
    setStatus(error instanceof Error ? error.message : '保存窗口失败，请重试', 'error');
  } finally {
    saveWindowButton.disabled = false;
  }
}

workspaceSelect.addEventListener('change', renderCategories);
savePageButton.addEventListener('click', saveCurrentPage);
saveWindowButton.addEventListener('click', saveCurrentWindow);
importBookmarksButton.addEventListener('click', importBrowserBookmarks);
exportBookmarksButton.addEventListener('click', exportDesktopBookmarks);
if (extensionAPI?.storage?.local) {
  void loadSummary().catch(() => setStatus('请先打开一个微言桌面新标签页', 'error'));
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
