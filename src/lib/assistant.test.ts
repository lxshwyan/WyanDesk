import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssistantRequestError, fetchAssistantConfig, queryAssistant, safeAssistantSourceURL, submitAssistantFeedback } from './assistant';

afterEach(() => {
  vi.unstubAllGlobals();
});

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), { status, headers: { 'Content-Type': 'application/json' } });
}

describe('assistant transport', () => {
  it('accepts only verified WyanHub source links', () => {
    expect(safeAssistantSourceURL('https://forms.wyanhub.com/path')).toBe('https://forms.wyanhub.com/path');
    expect(safeAssistantSourceURL('https://wyanhub.com')).toBe('https://wyanhub.com/');
    expect(safeAssistantSourceURL('http://wyanhub.com')).toBeNull();
    expect(safeAssistantSourceURL('https://wyanhub.com.example.org')).toBeNull();
    expect(safeAssistantSourceURL('javascript:alert(1)')).toBeNull();

	  expect(safeAssistantSourceURL('https://news.example.org/item', 'web')).toBe('https://news.example.org/item');
	  expect(safeAssistantSourceURL('https://localhost/item', 'web')).toBeNull();
	  expect(safeAssistantSourceURL('https://127.0.0.1/item', 'web')).toBeNull();
	  expect(safeAssistantSourceURL('https://router/admin', 'web')).toBeNull();
	  expect(safeAssistantSourceURL('https://panel.internal/login', 'web')).toBeNull();
	  expect(safeAssistantSourceURL('https://0x7f.0.0.1/private', 'web')).toBeNull();
	  expect(safeAssistantSourceURL('https://name:secret@example.org/item', 'web')).toBeNull();
  });

  it('loads a validated public configuration without provider secrets', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
      enabled: true,
      mode: 'model',
      models: [{ id: 'guide-fast', label: '快速助手', provider: 'openai-compatible' }],
      defaultModel: 'guide-fast',
      allowModelSelection: false,
      suggestions: ['微言表单能做什么？'],
	  suggestionGroups: [{ id: 'desktop', label: '桌面使用', scope: 'guide', items: ['怎么添加网站？'] }],
	  capabilities: [
	    { id: 'guide', label: 'WyanHub', description: '产品帮助', enabled: true },
	    { id: 'general', label: '通用', description: '日常问答', enabled: true },
	    { id: 'web', label: '联网', description: '实时搜索', enabled: false, unavailableReason: '未配置' },
	  ],
      maxQuestionChars: 600,
      privacyNotice: '不会读取桌面内容。',
      knowledgeVersion: 'test',
	  quota: { authenticated: false, anonymousReady: true, limit: 3, used: 1, remaining: 2, resetDate: '2099-01-02', exhausted: false },
    }));
    vi.stubGlobal('fetch', fetchMock);
    const config = await fetchAssistantConfig();
    expect(config.defaultModel).toBe('guide-fast');
	 expect(config.suggestionGroups[0].label).toBe('桌面使用');
	 expect(config.capabilities.find((item) => item.id === 'web')?.enabled).toBe(false);
    expect(config.quota?.remaining).toBe(2);
    expect(JSON.stringify(config)).not.toContain('apiKey');
    expect(fetchMock).toHaveBeenCalledWith('/api/desk/assistant/config', expect.objectContaining({ credentials: 'include' }));
    expect((fetchMock.mock.calls[0][1] as RequestInit).headers).toEqual(expect.objectContaining({ 'X-Wyan-Assistant-Client': expect.any(String) }));
  });

  it('sends bounded conversation fields and maps stable API errors', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(jsonResponse({
        answer: '可以使用微言表单。[1]',
        sources: [],
        mode: 'knowledge',
	    scope: 'guide',
        knowledgeVersion: 'test',
        requestId: 'request-1',
      }))
      .mockResolvedValueOnce(jsonResponse({ error: { code: 'rate_limited', message: '提问过于频繁', retryAfterSeconds: 30 } }, 429));
    vi.stubGlobal('fetch', fetchMock);
    await queryAssistant('表单能做什么？', [{ role: 'user', content: '你好' }], 'auto', 'auto');
    const request = fetchMock.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(request.body as string)).toEqual({ question: '表单能做什么？', history: [{ role: 'user', content: '你好' }], task: 'auto', network: 'auto' });
    expect(request.headers).toEqual(expect.objectContaining({ 'X-Wyan-Assistant-Client': expect.any(String) }));

    await expect(queryAssistant('再试一次', [], 'auto', 'auto')).rejects.toMatchObject({
      code: 'rate_limited',
      retryAfterSeconds: 30,
    } satisfies Partial<AssistantRequestError>);
  });

  it('preserves an anonymous quota error and its updated counter', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      error: {
        code: 'anonymous_daily_limit_reached',
        message: '今日游客额度已用完',
        quota: { authenticated: false, anonymousReady: true, limit: 3, used: 3, remaining: 0, resetDate: '2099-01-02', exhausted: true },
      },
    }, 429)));
    await expect(queryAssistant('再试一次', [], 'auto', 'auto')).rejects.toMatchObject({
      code: 'anonymous_daily_limit_reached',
      quota: { authenticated: false, anonymousReady: true, limit: 3, used: 3, remaining: 0, resetDate: '2099-01-02', exhausted: true },
    } satisfies Partial<AssistantRequestError>);
  });

  it('fails closed when an answer contains malformed source metadata', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      answer: '不可信响应',
      sources: [{ id: 'bad', title: '缺少必要字段' }],
      mode: 'model',
      knowledgeVersion: 'test',
      requestId: 'request-2',
    })));
    await expect(queryAssistant('微言表单能做什么？', [], 'auto', 'off')).rejects.toMatchObject({
      code: 'invalid_response',
    } satisfies Partial<AssistantRequestError>);
  });

  it('fails closed when an answer contains a source URL outside the allowed boundary', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      answer: '不可信来源[1]',
      sources: [{ id: 'bad-url', kind: 'guide', product: 'desk', title: '错误来源', summary: '摘要', url: 'https://evil.example.org', sourceLabel: '未知' }],
      mode: 'knowledge',
      scope: 'guide',
      knowledgeVersion: 'test',
      requestId: 'request-bad-url',
    })));
    await expect(queryAssistant('微言桌面怎么用？', [], 'auto', 'off')).rejects.toMatchObject({
      code: 'invalid_response',
    } satisfies Partial<AssistantRequestError>);
  });

  it('fails closed when quota metadata is malformed', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse({
      enabled: true,
      mode: 'knowledge',
      models: [],
      allowModelSelection: false,
      suggestions: ['测试'],
      maxQuestionChars: 600,
      privacyNotice: '不读取桌面。',
      knowledgeVersion: 'test',
      quota: { authenticated: false, anonymousReady: true, limit: 3, used: 4, remaining: -1, resetDate: '2099-01-02', exhausted: true },
    })));
    await expect(fetchAssistantConfig()).rejects.toMatchObject({ code: 'invalid_response' } satisfies Partial<AssistantRequestError>);
  });

  it('sends an explicit live-search scope and validates web answers', async () => {
	const fetchMock = vi.fn().mockResolvedValue(jsonResponse({
	  answer: '今天有一项更新。[1]',
	  sources: [{ id: 'web:1', kind: 'web', product: 'web', title: '官方更新', summary: '摘要', url: 'https://example.org/update', sourceLabel: 'example.org' }],
	  mode: 'web',
	  scope: 'web',
	  knowledgeVersion: 'test',
	  requestId: 'request-web',
	}));
	vi.stubGlobal('fetch', fetchMock);
	const answer = await queryAssistant('今天有什么更新？', [], 'auto', 'on');
	expect(answer.scope).toBe('web');
	expect(answer.sources[0].kind).toBe('web');
	expect(JSON.parse((fetchMock.mock.calls[0][1] as RequestInit).body as string)).toMatchObject({ task: 'auto', network: 'on' });
  });

  it('submits answer feedback without sending the question or answer text', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
    vi.stubGlobal('fetch', fetchMock);
    await submitAssistantFeedback('abcdef1234567890', 'helpful');
    const [url, request] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/desk/assistant/feedback');
    expect(JSON.parse(request.body as string)).toEqual({ requestId: 'abcdef1234567890', outcome: 'helpful' });
    expect(request.headers).toEqual(expect.objectContaining({ 'X-Wyan-Assistant-Client': expect.any(String) }));
  });
});
