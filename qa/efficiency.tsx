// Development-only fixture; not an index.html entry or a public/download asset.
import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { AppWindow, BookMarked, ListTodo, StickyNote } from 'lucide-react';
import { createDefaultState } from '../src/data/defaults';
import { InboxModal } from '../src/components/InboxModal';
import { CommandPalette } from '../src/components/CommandPalette';
import { ContinueWorkCard, type ContinueWorkActions } from '../src/components/ContinueWorkCard';
import type { DeskInboxItem } from '../src/types';
import type { SavedBrowserSession } from '../src/lib/browserWorkspace';
import '../src/styles.css';

const initialItems: DeskInboxItem[] = [
  { id: 'research', kind: 'link', content: '学习资料：如何整理研究笔记', url: 'https://example.com/research', excerpt: '把资料、自己的思考和来源放在一起，下次才知道为什么保存。', note: '周五报告要引用这段观点，先对照原文。', createdAt: '2026-10-23T01:00:00Z' },
  { id: 'work', kind: 'link', content: '项目A · 评审参考', url: 'https://example.com/project-a', createdAt: '2026-10-23T00:00:00Z' },
];
const initialSessions: SavedBrowserSession[] = [{ id: 'research', title: '论文资料', createdAt: '2026-10-23T01:00:00Z', tabs: [{ title: '参考论文', url: 'https://example.com/paper', pinned: false, active: true }, { title: '研究笔记', url: 'https://example.com/note', pinned: true, active: false }] }];
const listeners = new Set<() => void>();
let sessions = initialSessions;
const actions: ContinueWorkActions = {
  read: async () => sessions,
  restore: async (id) => ({ opened: sessions.find((item) => item.id === id)?.tabs.length || 0, failed: 0 }),
  save: async (title) => { sessions = [{ ...initialSessions[0], id: crypto.randomUUID(), title, createdAt: new Date().toISOString() }, ...sessions]; listeners.forEach((listener) => listener()); },
  watch: (listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; },
};

function Fixture() {
  const [items, setItems] = useState(initialItems);
  const [open, setOpen] = useState(true);
  const mode = new URLSearchParams(location.search).get('mode') || 'reading';
  const state = createDefaultState();
  if (mode === 'search-long') return <CommandPalette open initialQuery="报告" commands={[]} shortcuts={[]} currentWorkspaceId={state.activeWorkspaceId} resources={Array.from({ length: 20 }, (_, index) => ({ id: `long-${index}`, label: `报告资料 ${index + 1}`, description: '足够产生滚动的合成结果', keywords: '报告', kind: '收集', icon: <BookMarked />, run: () => undefined }))} onClose={() => undefined} onOpenShortcut={() => undefined} />;
  if (mode === 'matrix') return <div style={{ display: 'flex', gap: 16, padding: 16, alignItems: 'flex-start', overflow: 'auto' }}><iframe title="手机阅读" src="?mode=reading" style={{ width: 390, height: 844, flex: 'none', border: 0 }} /><iframe title="手机继续工作" src="?mode=continue" style={{ width: 390, height: 844, flex: 'none', border: 0 }} /><iframe title="手机搜索" src="?mode=search" style={{ width: 390, height: 844, flex: 'none', border: 0 }} /></div>;
  return <div className="desktop-content" style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
    <p style={{ fontSize: 13, color: '#5f6f84' }}>本地合成数据验收 · 窗口操作为模拟，不打开真实标签</p>
    {!open && <button type="button" onClick={() => setOpen(true)}>重新打开验收界面</button>}
    {mode === 'continue' && <ContinueWorkCard workspaceName="项目A" actions={actions} />}
    {mode === 'reading' && open && <InboxModal items={items} workspaces={state.workspaces} activeWorkspaceId={state.activeWorkspaceId} initialKind="link" saveLabel="合成数据，仅本地测试" onAdd={() => true} onClose={() => setOpen(false)} onDelete={(item) => setItems((current) => current.filter((entry) => entry.id !== item.id))} onOrganize={() => undefined} onUpdate={(id, patch) => setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item))} />}
    {mode === 'search' && <CommandPalette open={open} initialQuery="报告" commands={[{ id: 'task-new', label: '新建报告任务', description: '操作', keywords: '报告', icon: <ListTodo />, run: () => undefined }]} shortcuts={[]} currentWorkspaceId={state.activeWorkspaceId} resources={[{ id: 'one', label: '周五交研究报告', description: '学习 · 待办任务', keywords: '报告', kind: '任务', icon: <ListTodo />, run: () => undefined }, { id: 'two', label: '工作 · 报告便签', description: '报告评审的关注点和资料链接', keywords: '报告', kind: '便签', icon: <StickyNote />, run: () => undefined }, { id: 'three', label: '研究笔记整理方法', description: '稍后阅读 · example.com', keywords: '报告', kind: '收集', icon: <BookMarked />, run: () => undefined }]} onLoadTabs={async () => [{ id: 'tab', kind: '切换标签', label: '项目报告', description: 'https://example.com/report', keywords: '报告', icon: <AppWindow />, run: () => undefined }]} onClose={() => setOpen(false)} onOpenShortcut={() => undefined} />}
  </div>;
}
createRoot(document.getElementById('root')!).render(<Fixture />);
