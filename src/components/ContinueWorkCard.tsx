import { useEffect, useRef, useState } from 'react';
import { ChevronDown, History, Play, Plus } from 'lucide-react';
import { readBrowserSessions, restoreBrowserSession, saveBrowserSession, watchBrowserSessions, type SavedBrowserSession } from '../lib/browserWorkspace';

export interface ContinueWorkActions {
  read: typeof readBrowserSessions;
  restore: typeof restoreBrowserSession;
  save: typeof saveBrowserSession;
  watch: typeof watchBrowserSessions;
}
const browserActions: ContinueWorkActions = { read: readBrowserSessions, restore: restoreBrowserSession, save: saveBrowserSession, watch: watchBrowserSessions };

export function ContinueWorkCard({ workspaceName, actions = browserActions }: { workspaceName: string; actions?: ContinueWorkActions }) {
  const [sessions, setSessions] = useState<SavedBrowserSession[]>([]);
  const [title, setTitle] = useState(workspaceName);
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const live = useRef(false);
  useEffect(() => { setTitle(workspaceName); }, [workspaceName]);
  useEffect(() => {
    live.current = true;
    let request = 0;
    const refresh = () => {
      const serial = ++request;
      void actions.read().then((items) => { if (live.current && serial === request) setSessions(items); }).catch(() => { if (live.current) setStatus('读取窗口记录失败，请重新打开桌面'); });
    };
    refresh();
    const unsubscribe = actions.watch(refresh);
    return () => { live.current = false; unsubscribe(); };
  }, [actions]);
  async function restore(session: SavedBrowserSession) {
    if (session.tabs.length > 12 && !window.confirm(`将在新窗口恢复“${session.title}”的 ${session.tabs.length} 个网页，继续？当前窗口不会关闭。`)) return;
    setBusy(true);
    try {
      const result = await actions.restore(session.id);
      if (live.current) setStatus(`已在新窗口打开 ${result.opened} 个网页${result.failed ? `，${result.failed} 个未打开，可重试` : '；当前窗口保留'}`);
    } catch (error) { if (live.current) setStatus(error instanceof Error ? error.message : '恢复失败，请重试'); }
    finally { if (live.current) setBusy(false); }
  }
  return <details className="continue-work glass-panel">
    <summary><History aria-hidden="true" /><strong>继续上次工作</strong><span>{sessions[0] ? `${sessions[0].title} · ${sessions[0].tabs.length} 个网页` : '保存窗口，下次接着做'}</span><ChevronDown aria-hidden="true" /></summary>
    <div className="continue-work-content">
      <form onSubmit={(event) => {
        event.preventDefault(); if (busy) return; setBusy(true);
        void actions.save(title).then(async () => { const next = await actions.read(); if (live.current) { setSessions(next); setStatus('窗口已保存在此浏览器，未关闭任何网页'); } }).catch((error) => { if (live.current) setStatus(error instanceof Error ? error.message : '未保存成功，请重试'); }).finally(() => { if (live.current) setBusy(false); });
      }}><label className="sr-only" htmlFor="sessionName">工作窗口名称</label><input id="sessionName" maxLength={60} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：论文资料、项目A" /><button className="quiet-button" disabled={busy} type="submit"><Plus aria-hidden="true" />{busy ? '处理中…' : '保存当前窗口'}</button></form>
      {sessions.length > 0 && <div className="continue-work-list">{sessions.map((session) => <div key={session.id}><span><strong>{session.title}</strong><small>{session.tabs.length} 个网页 · {new Date(session.createdAt).toLocaleDateString('zh-CN')}</small></span><button className="quiet-button" disabled={busy} type="button" onClick={() => void restore(session)}><Play aria-hidden="true" />恢复</button></div>)}</div>}
      {status && <p role="status">{status}</p>}
      <small>仅此浏览器保留最近 20 个窗口，不随账号同步；只保存网址与标题，不保存表单、登录状态或网页内容。</small>
    </div>
  </details>;
}
