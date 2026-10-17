import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { AssistantAnswerContent, AssistantPanel, describeAssistantAnalysis, describeAssistantPointCost } from './AssistantPanel';

describe('AssistantPanel', () => {
  it('shows the guest assistant and privacy boundary without a login gate', () => {
    const html = renderToStaticMarkup(
      <AssistantPanel open signedIn={false} onClose={vi.fn()} onLogin={vi.fn()} />,
    );
    expect(html).toContain('游客');
    expect(html).toContain('需要时联网，不读桌面');
    expect(html).not.toContain('登录后使用助手');
    expect(html).not.toContain('/api/desk/assistant/query');
  });

  it('renders nothing while closed so the desktop remains unchanged', () => {
    expect(renderToStaticMarkup(
      <AssistantPanel open={false} signedIn onClose={vi.fn()} onLogin={vi.fn()} />,
    )).toBe('');
  });

  it('keeps the essential privacy boundary visible for signed-in users', () => {
    const html = renderToStaticMarkup(
      <AssistantPanel open signedIn userName="微言用户" onClose={vi.fn()} onLogin={vi.fn()} />,
    );
    expect(html).toContain('需要时联网，不读桌面');
  });

  it('describes verifiable routing facts without exposing raw model reasoning', () => {
    const items = describeAssistantAnalysis({
      answer: '根据核对结果，这是当前答案。',
      sources: [
        { id: 'web:1', kind: 'web', product: 'web', title: '官方资料', summary: '摘要', url: 'https://example.org', sourceLabel: '官方网站' },
        { id: 'web:2', kind: 'web', product: 'web', title: '补充资料', summary: '摘要', url: 'https://docs.example.org', sourceLabel: '文档' },
      ],
      mode: 'web',
      scope: 'web',
      route: 'web',
      task: 'deep',
      network: 'on',
      knowledgeVersion: 'test',
      requestId: 'req_test',
      costPoints: 2,
    });

    expect(items).toEqual([
      { label: '信息来源', value: '联网信息检索' },
      { label: '回答方式', value: '深度分析' },
      { label: '联网情况', value: '已联网检索' },
      { label: '参考来源', value: '2 条' },
      { label: '消耗额度', value: '2 点' },
    ]);
    expect(items.map((item) => item.value).join('')).not.toContain('思维链');
  });

  it('reports that a knowledge answer did not use the web even under automatic policy', () => {
    const items = describeAssistantAnalysis({
      answer: '知识回答', sources: [], mode: 'knowledge', scope: 'guide', task: 'auto', network: 'auto',
      knowledgeVersion: 'test', requestId: 'req_guide',
    });
    expect(items).toContainEqual({ label: '联网情况', value: '本次未联网' });
    expect(items).toContainEqual({ label: '消耗额度', value: '未消耗点数' });
  });

  it('renders the supported answer formatting without injecting raw HTML', () => {
    const html = renderToStaticMarkup(
      <AssistantAnswerContent content={'常见用法：\n1. **快捷入口**：使用网站卡片\n2. `HTTPS` 地址\n\n<script>alert(1)</script>'} />,
    );
    expect(html).toContain('<ol>');
    expect(html).toContain('<strong>快捷入口</strong>');
    expect(html).toContain('<code>HTTPS</code>');
    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(html).not.toContain('<script>');
  });

  it('links valid inline citations to the matching numbered source only', () => {
    const html = renderToStaticMarkup(
      <AssistantAnswerContent content={'根据官方资料[1]，这一点可以确认[3]。'} sourceCount={2} sourcePrefix="answer-source" />,
    );
    expect(html).toContain('href="#answer-source-1"');
    expect(html).toContain('查看参考来源 1');
    expect(html).not.toContain('href="#answer-source-3"');
  });

  it('shows the maximum possible point cost for the selected policy', () => {
    const config = {
      quotaWeights: { auto: 1, fast: 1, standard: 1, deep: 2, coding: 2, web: 3 },
    } as Parameters<typeof describeAssistantPointCost>[0];
    expect(describeAssistantPointCost(config, 'deep', 'off')).toBe('本次最多 2 点');
    expect(describeAssistantPointCost(config, 'fast', 'auto')).toBe('本次最多 3 点');
  });
});
