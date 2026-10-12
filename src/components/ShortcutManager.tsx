import { useEffect, useRef, useState } from 'react';
import { Activity, ArrowDown, ArrowUp, CheckCircle2, CircleAlert, LoaderCircle, Pencil, Plus, Trash2, X } from 'lucide-react';
import type { Shortcut } from '../types';
import { probeWebsites, type WebsiteAvailability } from '../lib/siteAvailability';
import { ManagedLayer } from './ManagedLayer';

interface ShortcutManagerProps {
  category: string;
  shortcuts: Shortcut[];
  onAdd: () => void;
  onClose: () => void;
  onDelete: (id: string) => void;
  onEdit: (shortcut: Shortcut) => void;
  onMove: (id: string, direction: -1 | 1) => void;
}

function shortcutHost(value: string): string {
  try {
    return new URL(value).hostname;
  } catch {
    return value;
  }
}

export function ShortcutManager({ category, shortcuts, onAdd, onClose, onDelete, onEdit, onMove }: ShortcutManagerProps) {
  const [statuses, setStatuses] = useState<Record<string, WebsiteAvailability>>({});
  const [progress, setProgress] = useState({ completed: 0, reachable: 0, unreachable: 0 });
  const [checking, setChecking] = useState(false);
  const probeController = useRef<AbortController | null>(null);

  useEffect(() => () => probeController.current?.abort(), []);

  async function checkCategorySites() {
    if (!shortcuts.length || checking) return;
    probeController.current?.abort();
    const controller = new AbortController();
    probeController.current = controller;
    setStatuses(Object.fromEntries(shortcuts.map((shortcut) => [shortcut.id, 'cancelled'])));
    setProgress({ completed: 0, reachable: 0, unreachable: 0 });
    setChecking(true);
    await probeWebsites(
      shortcuts.map(({ id, url }) => ({ id, url })),
      ({ id, result, completed }) => {
        setStatuses((current) => ({ ...current, [id]: result }));
        setProgress((current) => ({
          completed,
          reachable: current.reachable + (result === 'reachable' ? 1 : 0),
          unreachable: current.unreachable + (result === 'unreachable' ? 1 : 0),
        }));
      },
      { signal: controller.signal, concurrency: 4, timeoutMs: 7000 },
    );
    if (!controller.signal.aborted) setChecking(false);
  }

  return (
    <ManagedLayer className="modal-layer" onEscape={onClose}>
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭网站管理" />
      <section className="shortcut-manager-modal" role="dialog" aria-modal="true" aria-labelledby="shortcutManagerTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Pencil /></span><div><h2 id="shortcutManagerTitle">管理“{category}”</h2><p>修改、排序并检查当前网络连通性</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>

        <div className="shortcut-manager-tools">
          <button className="manager-check-button" type="button" onClick={() => void checkCategorySites()} disabled={!shortcuts.length || checking}>
            {checking ? <LoaderCircle className="spin" /> : <Activity />}
            {checking ? `检测中 ${progress.completed}/${shortcuts.length}` : progress.completed ? '重新检测' : '一键检测本组'}
          </button>
          <button className="manager-add-button" type="button" onClick={onAdd}><Plus />添加网站</button>
        </div>

        <div className="shortcut-check-summary" aria-live="polite">
          {checking && <span>正在由当前浏览器逐个检查，请保持页面打开。</span>}
          {!checking && progress.completed > 0 && <span>检测完成：<strong>{progress.reachable} 个可连通</strong>{progress.unreachable > 0 && <>，<em>{progress.unreachable} 个未连通</em></>}</span>}
          {!checking && progress.completed === 0 && <span>按需检测，不会持续在后台访问这些网站。</span>}
        </div>

        <div className="shortcut-manager-list" role="list" aria-label={`${category}分类的网站`}>
          {shortcuts.map((shortcut, index) => (
            <div className="shortcut-manager-row" key={shortcut.id} role="listitem">
              <span className="shortcut-manager-icon" style={{ '--shortcut-color': shortcut.accent } as React.CSSProperties}>{shortcut.icon}</span>
              <span className="shortcut-manager-copy"><strong>{shortcut.title}</strong><small>{shortcutHost(shortcut.url)}</small></span>
              {statuses[shortcut.id] && (
                <span className={`shortcut-health ${statuses[shortcut.id]}`}>
                  {statuses[shortcut.id] === 'reachable' ? <><CheckCircle2 />可连通</> : statuses[shortcut.id] === 'unreachable' ? <><CircleAlert />未连通</> : <><LoaderCircle className={checking ? 'spin' : ''} />待检测</>}
                </span>
              )}
              <span className="shortcut-manager-actions">
                <button type="button" onClick={() => onMove(shortcut.id, -1)} disabled={index === 0} aria-label={`上移${shortcut.title}`}><ArrowUp /></button>
                <button type="button" onClick={() => onMove(shortcut.id, 1)} disabled={index === shortcuts.length - 1} aria-label={`下移${shortcut.title}`}><ArrowDown /></button>
                <button type="button" onClick={() => onEdit(shortcut)} aria-label={`编辑${shortcut.title}`}><Pencil /></button>
                <button className="danger" type="button" onClick={() => onDelete(shortcut.id)} aria-label={`删除${shortcut.title}`}><Trash2 /></button>
              </span>
            </div>
          ))}
          {!shortcuts.length && <div className="manager-empty">这个分类还没有网站</div>}
        </div>
        <p className="category-hint">检测结果只代表当前浏览器能否发起访问，不等同于持续的网站可用性监控。</p>
      </section>
    </ManagedLayer>
  );
}
