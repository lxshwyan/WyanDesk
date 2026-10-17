import { AppWindow, Check, Download, RefreshCw, Share2, WifiOff } from 'lucide-react';
import { pwaInstallCopy, type PwaInstallMode } from '../lib/pwa';

interface PwaInstallCardProps {
  installMode: PwaInstallMode;
  offlineReady: boolean;
  registrationError: boolean;
  updateAvailable: boolean;
  updateBusy: boolean;
  onInstall: () => void;
  onUpdate: () => void;
}

export function PwaInstallCard({
  installMode,
  offlineReady,
  registrationError,
  updateAvailable,
  updateBusy,
  onInstall,
  onUpdate,
}: PwaInstallCardProps) {
  const copy = pwaInstallCopy(installMode);
  const installationSupported = installMode !== 'unavailable';

  return (
    <article className={`settings-tool-card pwa-install-card${copy.steps ? ' has-steps' : ''}`}>
      <div className="settings-tool-heading">
        <span>{installMode === 'installed' ? <Check /> : installMode.startsWith('ios') ? <Share2 /> : <AppWindow />}</span>
        <div><strong>{copy.title}</strong><small>{copy.description}</small></div>
      </div>
      {copy.steps && <ol className="pwa-install-steps">{copy.steps.map((step) => <li key={step}>{step}</li>)}</ol>}
      <div className={`pwa-readiness${registrationError ? ' is-error' : ''}`}>
        {registrationError ? <WifiOff /> : <Check />}
        <span>{registrationError ? '离线能力暂未就绪，请联网刷新' : offlineReady ? '基础桌面已可离线打开' : '正在准备离线能力'}</span>
      </div>
      {updateAvailable ? (
        <div className="settings-tool-actions single"><button type="button" onClick={onUpdate} disabled={updateBusy}><RefreshCw className={updateBusy ? 'is-spinning' : ''} />{updateBusy ? '正在更新' : '更新到新版本'}</button></div>
      ) : copy.actionLabel ? (
        <div className="settings-tool-actions single"><button type="button" onClick={onInstall}><Download />{copy.actionLabel}</button></div>
      ) : !installationSupported ? null : (
        <small className="pwa-install-note">安装不会获得手机文件夹权限；文件仍需由你主动选择。</small>
      )}
    </article>
  );
}
