import { Cloud, History, RotateCcw, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { CloudRevision } from '../lib/cloudSync';

interface CloudHistoryModalProps {
  onClose: () => void;
  onLoad: () => Promise<CloudRevision[]>;
  onRestore: (version: number) => Promise<void>;
}

export function CloudHistoryModal({ onClose, onLoad, onRestore }: CloudHistoryModalProps) {
  const [items, setItems] = useState<CloudRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [restoring, setRestoring] = useState(0);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    void onLoad().then((value) => {
      if (active) setItems(value);
    }).catch((cause) => {
      if (active) setError(cause instanceof Error ? cause.message : '历史版本读取失败');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [onLoad]);

  async function restore(version: number) {
    if (!window.confirm(`恢复云端版本 ${version}？当前本机数据会先保留为恢复副本。`)) return;
    setRestoring(version);
    setError('');
    try {
      await onRestore(version);
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '历史版本恢复失败');
      setRestoring(0);
    }
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="关闭云端历史版本" />
      <section className="shortcut-modal cloud-history-modal" role="dialog" aria-modal="true" aria-labelledby="cloudHistoryTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><History /></span><div><h2 id="cloudHistoryTitle">云端历史版本</h2><p>最多保留最近 20 次成功同步</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <div className="cloud-history-list">
          {items.map((item, index) => (
            <div key={item.version}>
              <span className="cloud-version-icon"><Cloud /></span>
              <span><strong>版本 {item.version}{index === 0 ? ' · 最新' : ''}</strong><small>{new Date(item.createdAt).toLocaleString('zh-CN', { hour12: false })}</small></span>
              <button type="button" disabled={restoring > 0 || index === 0} onClick={() => void restore(item.version)}>{restoring === item.version ? '恢复中…' : <><RotateCcw />恢复</>}</button>
            </div>
          ))}
          {loading && <div className="manager-empty">正在读取历史版本…</div>}
          {!loading && !items.length && !error && <div className="manager-empty">还没有云端历史版本</div>}
        </div>
        {error && <p className="form-error">{error}</p>}
      </section>
    </div>
  );
}
