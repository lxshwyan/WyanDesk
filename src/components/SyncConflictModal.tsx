import { Cloud, CloudDownload, Laptop, X } from 'lucide-react';
import { useState } from 'react';

interface SyncConflictModalProps {
  onClose: () => void;
  onKeepLocal: () => Promise<void>;
  onUseCloud: () => void;
}

export function SyncConflictModal({ onClose, onKeepLocal, onUseCloud }: SyncConflictModalProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function keepLocal() {
    setSaving(true);
    setError('');
    try {
      await onKeepLocal();
      onClose();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '同步失败，请重试');
      setSaving(false);
    }
  }

  return (
    <div className="modal-layer" role="presentation">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="稍后处理同步冲突" />
      <section className="shortcut-modal sync-conflict-modal" role="dialog" aria-modal="true" aria-labelledby="syncConflictTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Cloud /></span><div><h2 id="syncConflictTitle">发现两份桌面数据</h2><p>本机和云端都发生过修改，请选择保留哪一份</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <div className="sync-choice-list">
          <button type="button" onClick={() => { onUseCloud(); onClose(); }} disabled={saving}>
            <span><CloudDownload /></span><span><strong>使用云端数据</strong><small>先备份本机数据，再切换到云端版本</small></span>
          </button>
          <button type="button" onClick={() => void keepLocal()} disabled={saving}>
            <span><Laptop /></span><span><strong>{saving ? '正在保存…' : '保留本机数据'}</strong><small>先备份云端数据，再用本机版本覆盖</small></span>
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
        <p className="workspace-hint">两种选择都会保留恢复副本，之后也可以从云端历史版本恢复。</p>
      </section>
    </div>
  );
}
