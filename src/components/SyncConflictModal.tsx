import { Cloud, CloudDownload, Laptop } from 'lucide-react';
import { useState } from 'react';
import { ManagedLayer } from './ManagedLayer';

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
    <ManagedLayer className="modal-layer" onEscape={onClose}>
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="稍后处理同步冲突" />
      <section className="shortcut-modal sync-conflict-modal" role="dialog" aria-modal="true" aria-labelledby="syncConflictTitle">
        <div className="modal-heading">
          <div><span className="modal-icon"><Cloud /></span><div><h2 id="syncConflictTitle">选择数据同步方向</h2><p>本机和云端内容不同，请选择以哪一份为准</p></div></div>
          <button className="quiet-button" type="button" onClick={onClose}>稍后处理</button>
        </div>
        <div className="sync-choice-list">
          <button type="button" onClick={() => { onUseCloud(); onClose(); }} disabled={saving}>
            <span><CloudDownload /></span><span><strong>云端数据下载到本机</strong><small>当前本机数据会先自动备份</small></span>
          </button>
          <button type="button" onClick={() => void keepLocal()} disabled={saving}>
            <span><Laptop /></span><span><strong>{saving ? '正在上传本机数据…' : '本机数据上传到云端'}</strong><small>当前云端数据会先自动备份</small></span>
          </button>
        </div>
        {error && <p className="form-error">{error}</p>}
        <p className="workspace-hint">系统会先保存被替换的数据，避免误操作丢失内容。</p>
      </section>
    </ManagedLayer>
  );
}
