import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { ManagedLayer } from './ManagedLayer';

describe('ManagedLayer', () => {
  it('keeps the visual layer class and marks the shared behavior boundary', () => {
    const html = renderToStaticMarkup(
      <ManagedLayer className="modal-layer" onEscape={vi.fn()}>
        <section role="dialog" aria-modal="true" aria-label="测试弹窗"><button type="button">完成</button></section>
      </ManagedLayer>,
    );

    expect(html).toContain('class="modal-layer"');
    expect(html).toContain('data-managed-layer="true"');
    expect(html).toContain('role="dialog"');
  });
});
