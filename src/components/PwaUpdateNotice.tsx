import { RefreshCw, X } from 'lucide-react';

interface PwaUpdateNoticeProps {
  busy: boolean;
  onDismiss: () => void;
  onUpdate: () => void;
}

export function PwaUpdateNotice({ busy, onDismiss, onUpdate }: PwaUpdateNoticeProps) {
  return (
    <div className="pwa-update-notice" role="status">
      <RefreshCw className={busy ? 'is-spinning' : ''} aria-hidden="true" />
      <span><strong>新版本已准备好</strong><small>更新后会重新打开桌面，本地数据不会丢失</small></span>
      <button type="button" onClick={onUpdate} disabled={busy}>{busy ? '更新中' : '现在更新'}</button>
      <button className="pwa-update-dismiss" type="button" onClick={onDismiss} disabled={busy} aria-label="稍后更新"><X /></button>
    </div>
  );
}
