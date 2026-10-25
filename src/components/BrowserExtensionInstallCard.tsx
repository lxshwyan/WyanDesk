import { Check, Download, Puzzle, ShieldCheck } from 'lucide-react';

interface BrowserExtensionInstallCardProps {
  installed: boolean;
  version: string;
}

export function BrowserExtensionInstallCard({ installed, version }: BrowserExtensionInstallCardProps) {
  return (
    <article className="settings-tool-card browser-extension-card">
      <div className="settings-tool-heading">
        <span>{installed ? <Check /> : <Puzzle />}</span>
        <div>
          <strong>{installed ? '浏览器扩展已安装' : 'Chrome / Edge 扩展（测试版）'}</strong>
          <small>{installed ? `当前为 WyanDesk v${version}，新标签页已由微言桌面接管` : '新标签页就是你的桌面，一键收藏网页或整个窗口'}</small>
        </div>
      </div>

      {installed ? (
        <div className="extension-install-status"><Check /><span>可从浏览器工具栏打开扩展，保存网页、窗口组合或迁移书签。</span></div>
      ) : (
        <>
          <div className="settings-tool-actions extension-download-actions">
            <a className="is-primary" href="/downloads/wyandesk-extension.zip" download><Download />下载 ZIP · v{version}</a>
            <a href="/downloads/wyandesk-extension.zip.sha256" download><ShieldCheck />校验文件</a>
          </div>
          <details className="extension-install-guide">
            <summary>安装与更新步骤<span>需开启开发者模式</span></summary>
            <ol className="extension-install-steps">
              <li>下载 ZIP 并解压到一个固定文件夹。</li>
              <li>打开 <code>chrome://extensions</code> 或 <code>edge://extensions</code>，开启“开发者模式”。</li>
              <li>点击“加载已解压的扩展程序”，选择里面含有 <code>manifest.json</code> 的文件夹。</li>
              <li>把 WyanDesk 固定到工具栏；以后更新时重新下载、覆盖文件，再在扩展页点击“重新加载”。</li>
            </ol>
            <small className="pwa-install-note">手动安装版不会自动更新。只有使用“保存当前窗口”时，浏览器才会另行询问标签页读取权限。</small>
          </details>
        </>
      )}
    </article>
  );
}
