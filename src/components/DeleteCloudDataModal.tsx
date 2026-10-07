import { useState, type FormEvent } from 'react';
import { CloudOff, Trash2, X } from 'lucide-react';

interface DeleteCloudDataModalProps {
  userName: string;
  onClose: () => void;
  onDelete: () => Promise<void>;
  onDeleted: () => void;
}

export function DeleteCloudDataModal({ userName, onClose, onDelete, onDeleted }: DeleteCloudDataModalProps) {
  const [confirmation, setConfirmation] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (confirmation !== '删除' || deleting) return;
    setDeleting(true);
    setError('');
    try {
      await onDelete();
      onDeleted();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : '云端数据删除失败');
      setDeleting(false);
    }
  }

  return (
    <div className="modal-layer">
      <button className="modal-backdrop" type="button" onClick={onClose} aria-label="取消删除云端桌面数据" />
      <section className="shortcut-modal cloud-delete-modal" role="dialog" aria-modal="true" aria-labelledby="cloudDeleteTitle">
        <div className="modal-heading">
          <div><span className="modal-icon danger"><CloudOff /></span><div><h2 id="cloudDeleteTitle">删除云端桌面数据</h2><p>账号：{userName}</p></div></div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭"><X /></button>
        </div>
        <form className="cloud-delete-form" onSubmit={submit}>
          <div className="cloud-delete-summary">
            <Trash2 />
            <span><strong>云端当前数据与全部历史版本将永久删除</strong><small>当前浏览器里的桌面仍会保留；同步将暂停，只有再次主动开启才会重新上传。</small></span>
          </div>
          <label><span>输入“删除”继续</span><input autoFocus value={confirmation} onChange={(event) => setConfirmation(event.target.value.slice(0, 8))} autoComplete="off" placeholder="删除" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <div className="modal-actions"><button className="quiet-button" type="button" onClick={onClose}>取消</button><button className="primary-button destructive-button" type="submit" disabled={confirmation !== '删除' || deleting}>{deleting ? '正在删除…' : '删除云端数据'}</button></div>
        </form>
      </section>
    </div>
  );
}
