import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SyncConflictModal } from './SyncConflictModal';

describe('SyncConflictModal', () => {
  it('names both sync directions without requiring helper text', () => {
    const html = renderToStaticMarkup(
      <SyncConflictModal onClose={vi.fn()} onKeepLocal={vi.fn()} onUseCloud={vi.fn()} />,
    );

    expect(html).toContain('选择数据同步方向');
    expect(html).toContain('云端数据下载到本机');
    expect(html).toContain('本机数据上传到云端');
    expect(html).toContain('稍后处理');
    expect(html).not.toContain('使用云端数据');
    expect(html).not.toContain('保留本机数据');
  });
});
