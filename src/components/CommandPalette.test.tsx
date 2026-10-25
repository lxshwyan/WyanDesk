import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { CommandPalette } from './CommandPalette';

describe('unified search presentation', () => {
  it('shows saved content with a typed action and escapes untrusted titles', () => {
    const html = renderToStaticMarkup(<CommandPalette open initialQuery="报告" commands={[]} shortcuts={[]} currentWorkspaceId="work" resources={[{ id: 'task', kind: '任务', label: '周五报告 <script>', description: '工作', keywords: '报告', icon: null, run: () => undefined }]} onClose={() => undefined} onOpenShortcut={() => undefined} />);
    expect(html).toContain('周五报告 &lt;script&gt;');
    expect(html).toContain('搜索桌面内容与操作');
    expect(html).toContain('role="combobox"');
    expect(html).toContain('aria-controls=');
    expect(html).toContain('aria-activedescendant=');
    expect(html).toContain('任务');
    expect(html).not.toContain('搜索已打开标签');
  });
  it('exposes the browser-tab opt-in only for an explicitly supplied extension handler', () => {
    const html = renderToStaticMarkup(<CommandPalette open commands={[]} shortcuts={[]} currentWorkspaceId="work" onLoadTabs={async () => []} onClose={() => undefined} onOpenShortcut={() => undefined} />);
    expect(html).toContain('搜索已打开标签');
    expect(html).toContain('不读取浏览历史');
  });
});
