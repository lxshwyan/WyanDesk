import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { WidgetFrame } from './WidgetFrame';

describe('WidgetFrame', () => {
  it('offers a quick three-row height toggle for work widgets', () => {
    const html = renderToStaticMarkup(
      <WidgetFrame id="tasks" label="今日任务" size={{ width: 'standard', height: 'standard' }} editing={false} onChange={vi.fn()}>
        <section className="glass-panel"><div className="mini-heading">今日任务</div></section>
      </WidgetFrame>,
    );

    expect(html).toContain('has-height-toggle');
    expect(html).toContain('aria-label="今日任务放大组件"');
    expect(html).toContain('aria-pressed="false"');
  });

  it('labels tall widgets as collapsible and avoids duplicating layout controls', () => {
    const tallHtml = renderToStaticMarkup(
      <WidgetFrame id="schedule" label="今日日程" size={{ width: 'standard', height: 'tall' }} editing={false} onChange={vi.fn()}>
        <section className="glass-panel"><div className="mini-heading">今日日程</div></section>
      </WidgetFrame>,
    );
    const editingHtml = renderToStaticMarkup(
      <WidgetFrame id="schedule" label="今日日程" size={{ width: 'standard', height: 'standard' }} editing onChange={vi.fn()}>
        <section className="glass-panel"><div className="mini-heading">今日日程</div></section>
      </WidgetFrame>,
    );

    expect(tallHtml).toContain('aria-label="今日日程恢复原高度"');
    expect(tallHtml).toContain('aria-pressed="true"');
    expect(editingHtml).not.toContain('widget-height-toggle');
    expect(editingHtml).toContain('紧凑');
    expect(editingHtml).toContain('加高');
  });

  it('keeps the shortcut panel free of the work-widget control', () => {
    const html = renderToStaticMarkup(
      <WidgetFrame id="shortcuts" label="快捷网站" size={{ width: 'standard', height: 'standard' }} editing={false} onChange={vi.fn()}>
        <section className="glass-panel"><div className="panel-heading">快捷网站</div></section>
      </WidgetFrame>,
    );

    expect(html).not.toContain('widget-height-toggle');
  });

  it('presents legacy medium widths as the same full-row choice', () => {
    const html = renderToStaticMarkup(
      <WidgetFrame id="weather" label="天气" size={{ width: 'medium', height: 'standard' }} editing onChange={vi.fn()}>
        <section className="glass-panel"><div className="mini-heading">天气</div></section>
      </WidgetFrame>,
    );

    expect(html).toContain('当前通栏');
    expect(html).not.toContain('双列');
  });
});
