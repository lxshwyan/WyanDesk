import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { BrowserExtensionInstallCard } from './BrowserExtensionInstallCard';

describe('BrowserExtensionInstallCard', () => {
  it('shows a direct test package download and complete Chrome or Edge steps', () => {
    const html = renderToStaticMarkup(<BrowserExtensionInstallCard installed={false} version="0.4.6" />);

    expect(html).toContain('href="/downloads/wyandesk-extension.zip"');
    expect(html).toContain('href="/downloads/wyandesk-extension.zip.sha256"');
    expect(html).toContain('chrome://extensions');
    expect(html).toContain('edge://extensions');
    expect(html).toContain('加载已解压的扩展程序');
    expect(html).toContain('manifest.json');
    expect(html).toContain('手动安装版不会自动更新');
    expect(html).toContain('标签页读取权限');
  });

  it('shows installed state without a broken extension-relative download link', () => {
    const html = renderToStaticMarkup(<BrowserExtensionInstallCard installed version="0.4.6" />);

    expect(html).toContain('浏览器扩展已安装');
    expect(html).toContain('当前为 WyanDesk v0.4.6');
    expect(html).not.toContain('/downloads/wyandesk-extension.zip');
  });
});
