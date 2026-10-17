export interface AssistantModel {
  id: string;
  label: string;
  provider: string;
}

export type AssistantScope = 'guide' | 'general' | 'web';
export type AssistantTask = 'auto' | 'fast' | 'standard' | 'deep' | 'coding';
export type AssistantNetwork = 'auto' | 'off' | 'on';

export interface AssistantOption<T extends string> {
  id: T;
  label: string;
  description: string;
  enabled: boolean;
}

export interface AssistantCapability {
  id: AssistantScope;
  label: string;
  description: string;
  enabled: boolean;
  unavailableReason?: string;
}

export interface AssistantSuggestionGroup {
  id: string;
  label: string;
  scope: AssistantScope;
  items: string[];
}

export interface AssistantConfig {
  enabled: boolean;
  mode: 'disabled' | 'knowledge' | 'model';
  models: AssistantModel[];
  defaultModel?: string;
  allowModelSelection: boolean;
  suggestions: string[];
  suggestionGroups: AssistantSuggestionGroup[];
  capabilities: AssistantCapability[];
  maxQuestionChars: number;
  privacyNotice: string;
  knowledgeVersion: string;
  tasks: AssistantOption<AssistantTask>[];
  networks: AssistantOption<AssistantNetwork>[];
  quota?: AssistantQuota;
  quotaWeights?: AssistantQuotaWeights;
}

export interface AssistantQuotaWeights {
  auto: number;
  fast: number;
  standard: number;
  deep: number;
  coding: number;
  web: number;
}

export type AssistantFeedbackOutcome = 'helpful' | 'unresolved';

export interface AssistantQuota {
  authenticated: boolean;
  anonymousReady: boolean;
  limit: number;
  used: number;
  remaining: number;
  resetDate: string;
  exhausted: boolean;
}

export interface AssistantHistoryMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantSource {
  id: string;
  kind: string;
  product: string;
  title: string;
  summary: string;
  url: string;
  sourceLabel: string;
  dataFlow?: string;
}

export interface AssistantAnswer {
  answer: string;
  sources: AssistantSource[];
  mode: 'knowledge' | 'model' | 'web';
  scope: AssistantScope;
  route?: AssistantScope;
  task?: AssistantTask;
  network?: AssistantNetwork;
  knowledgeVersion: string;
  requestId: string;
  model?: AssistantModel;
  notice?: string;
  quota?: AssistantQuota;
  costPoints?: number;
}

interface AssistantErrorPayload {
  error?: {
    code?: string;
    message?: string;
    retryAfterSeconds?: number;
    quota?: AssistantQuota;
  };
}

export class AssistantRequestError extends Error {
  code: string;
  status: number;
  retryAfterSeconds?: number;
  quota?: AssistantQuota;

  constructor(message: string, code = 'assistant_unavailable', status = 0, retryAfterSeconds?: number, quota?: AssistantQuota) {
    super(message);
    this.name = 'AssistantRequestError';
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
    this.quota = quota;
  }
}

function isJSON(response: Response): boolean {
  return response.headers.get('content-type')?.includes('application/json') ?? false;
}

async function assistantError(response: Response, fallback: string): Promise<AssistantRequestError> {
  if (response.status >= 300 && response.status < 400) {
    return new AssistantRequestError('登录状态已失效，请重新登录后使用助手', 'auth_required', response.status);
  }
  if (!isJSON(response)) {
    const message = response.status === 401 || response.status === 403 ? '登录状态已失效，请重新登录后使用助手' : fallback;
    return new AssistantRequestError(message, response.status === 401 || response.status === 403 ? 'auth_required' : 'invalid_response', response.status);
  }
  const payload = await response.json().catch(() => null) as AssistantErrorPayload | null;
  const quota = isQuota(payload?.error?.quota) ? payload?.error?.quota : undefined;
  return new AssistantRequestError(
    payload?.error?.message || fallback,
    payload?.error?.code || 'assistant_unavailable',
    response.status,
    payload?.error?.retryAfterSeconds,
    quota,
  );
}

function isModel(value: unknown): value is AssistantModel {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssistantModel>;
  return typeof item.id === 'string' && typeof item.label === 'string' && typeof item.provider === 'string';
}

function isScope(value: unknown): value is AssistantScope {
  return value === 'guide' || value === 'general' || value === 'web';
}

function isTask(value: unknown): value is AssistantTask {
  return value === 'auto' || value === 'fast' || value === 'standard' || value === 'deep' || value === 'coding';
}

function isNetwork(value: unknown): value is AssistantNetwork {
  return value === 'auto' || value === 'off' || value === 'on';
}

function isOption<T extends string>(value: unknown, isID: (id: unknown) => id is T): value is AssistantOption<T> {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssistantOption<T>>;
  return isID(item.id) && typeof item.label === 'string' && typeof item.description === 'string' && typeof item.enabled === 'boolean';
}

function isCapability(value: unknown): value is AssistantCapability {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssistantCapability>;
  return isScope(item.id)
    && typeof item.label === 'string'
    && typeof item.description === 'string'
    && typeof item.enabled === 'boolean'
    && (item.unavailableReason === undefined || typeof item.unavailableReason === 'string');
}

function isSuggestionGroup(value: unknown): value is AssistantSuggestionGroup {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssistantSuggestionGroup>;
  return typeof item.id === 'string'
    && typeof item.label === 'string'
    && isScope(item.scope)
    && Array.isArray(item.items)
    && item.items.length > 0
    && item.items.every((question) => typeof question === 'string');
}

function isQuota(value: unknown): value is AssistantQuota {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssistantQuota>;
  return typeof item.authenticated === 'boolean'
    && typeof item.anonymousReady === 'boolean'
    && typeof item.limit === 'number'
    && Number.isInteger(item.limit)
    && item.limit >= 0
    && typeof item.used === 'number'
    && Number.isInteger(item.used)
    && item.used >= 0
    && typeof item.remaining === 'number'
    && Number.isInteger(item.remaining)
    && item.remaining >= 0
    && typeof item.resetDate === 'string'
    && typeof item.exhausted === 'boolean';
}

function isQuotaWeights(value: unknown): value is AssistantQuotaWeights {
  if (!value || typeof value !== 'object') return false;
  const item = value as Partial<AssistantQuotaWeights>;
  return ['auto', 'fast', 'standard', 'deep', 'coding', 'web'].every((key) => {
    const points = item[key as keyof AssistantQuotaWeights];
    return typeof points === 'number' && Number.isInteger(points) && points >= 1;
  });
}

function isSource(value: unknown): value is AssistantSource {
  if (!value || typeof value !== 'object') return false;
  const source = value as Partial<AssistantSource>;
  return typeof source.id === 'string'
    && typeof source.kind === 'string'
    && typeof source.product === 'string'
    && typeof source.title === 'string'
    && typeof source.summary === 'string'
    && typeof source.url === 'string'
    && typeof source.sourceLabel === 'string'
    && (source.dataFlow === undefined || typeof source.dataFlow === 'string');
}

function readConfig(value: unknown): AssistantConfig {
  if (!value || typeof value !== 'object') throw new AssistantRequestError('助手配置格式无效', 'invalid_response');
  const config = value as Partial<AssistantConfig>;
  if (
    typeof config.enabled !== 'boolean'
    || !['disabled', 'knowledge', 'model'].includes(config.mode || '')
    || !Array.isArray(config.models)
    || !config.models.every(isModel)
    || typeof config.allowModelSelection !== 'boolean'
    || !Array.isArray(config.suggestions)
    || !config.suggestions.every((item) => typeof item === 'string')
    || (config.suggestionGroups !== undefined && (!Array.isArray(config.suggestionGroups) || !config.suggestionGroups.every(isSuggestionGroup)))
    || (config.capabilities !== undefined && (!Array.isArray(config.capabilities) || !config.capabilities.every(isCapability)))
    || (config.tasks !== undefined && (!Array.isArray(config.tasks) || !config.tasks.every((item) => isOption(item, isTask))))
    || (config.networks !== undefined && (!Array.isArray(config.networks) || !config.networks.every((item) => isOption(item, isNetwork))))
    || (config.quota !== undefined && !isQuota(config.quota))
    || (config.quotaWeights !== undefined && !isQuotaWeights(config.quotaWeights))
    || typeof config.maxQuestionChars !== 'number'
    || !Number.isInteger(config.maxQuestionChars)
    || config.maxQuestionChars < 1
    || typeof config.privacyNotice !== 'string'
    || typeof config.knowledgeVersion !== 'string'
  ) {
    throw new AssistantRequestError('助手配置格式无效', 'invalid_response');
  }
  const guideAvailable = Boolean(config.enabled);
  return {
    ...config,
    suggestionGroups: config.suggestionGroups || [{ id: 'recommended', label: '推荐', scope: 'guide', items: config.suggestions }],
    capabilities: config.capabilities || [
      { id: 'guide', label: 'WyanHub', description: '产品功能、桌面操作与工具推荐', enabled: guideAvailable },
      { id: 'general', label: '通用', description: '解释、写作、翻译与日常知识', enabled: false, unavailableReason: '需要管理员配置可用模型' },
      { id: 'web', label: '联网', description: '查询需要当前信息的问题并附来源', enabled: false, unavailableReason: '需要管理员单独配置联网搜索' },
    ],
    tasks: config.tasks || [{ id: 'auto', label: '自动匹配', description: '按问题自动匹配回答方式', enabled: true }],
    networks: config.networks || [
      { id: 'auto', label: '需要时联网', description: '遇到时效问题才查询外部网页', enabled: true },
      { id: 'off', label: '不联网', description: '不查询外部网页', enabled: true },
      { id: 'on', label: '每次先联网', description: '每次都先查询外部网页', enabled: false },
    ],
  } as AssistantConfig;
}

function readAnswer(value: unknown): AssistantAnswer {
  if (!value || typeof value !== 'object') throw new AssistantRequestError('助手返回了无法识别的内容', 'invalid_response');
  const answer = value as Partial<AssistantAnswer>;
  if (
    typeof answer.answer !== 'string'
    || !Array.isArray(answer.sources)
    || !answer.sources.every(isSource)
    || !answer.sources.every((source) => safeAssistantSourceURL(source.url, source.kind) !== null)
    || !['knowledge', 'model', 'web'].includes(answer.mode || '')
    || (answer.scope !== undefined && !isScope(answer.scope))
    || (answer.route !== undefined && !isScope(answer.route))
    || (answer.task !== undefined && !isTask(answer.task))
    || (answer.network !== undefined && !isNetwork(answer.network))
    || typeof answer.knowledgeVersion !== 'string'
    || typeof answer.requestId !== 'string'
    || (answer.model !== undefined && !isModel(answer.model))
    || (answer.notice !== undefined && typeof answer.notice !== 'string')
    || (answer.quota !== undefined && !isQuota(answer.quota))
    || (answer.costPoints !== undefined && (typeof answer.costPoints !== 'number' || !Number.isInteger(answer.costPoints) || answer.costPoints < 0))
  ) {
    throw new AssistantRequestError('助手返回了无法识别的内容', 'invalid_response');
  }
  return { ...answer, scope: answer.scope || 'guide' } as AssistantAnswer;
}

let volatileAssistantClientID = '';

function createAssistantClientID(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  const bytes = new Uint8Array(24);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') crypto.getRandomValues(bytes);
  else for (let index = 0; index < bytes.length; index += 1) bytes[index] = Math.floor(Math.random() * 256);
  return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
}

function assistantClientID(): string {
  const storageKey = 'wyan-assistant-client-v1';
  if (typeof window !== 'undefined') {
    try {
      const existing = window.localStorage.getItem(storageKey) || '';
      if (/^[A-Za-z0-9._-]{16,96}$/.test(existing)) return existing;
      const created = createAssistantClientID();
      window.localStorage.setItem(storageKey, created);
      return created;
    } catch {
      // Private browsing or blocked storage falls back to a per-tab identifier.
    }
  }
  if (!volatileAssistantClientID) volatileAssistantClientID = createAssistantClientID();
  return volatileAssistantClientID;
}

export async function fetchAssistantConfig(signal?: AbortSignal): Promise<AssistantConfig> {
  const response = await fetch('/api/desk/assistant/config', {
    credentials: 'include',
    redirect: 'manual',
    headers: { Accept: 'application/json', 'X-Wyan-Assistant-Client': assistantClientID() },
    signal,
  });
  if (!response.ok || !isJSON(response)) throw await assistantError(response, '暂时无法读取助手配置');
  return readConfig(await response.json());
}

export async function queryAssistant(
  question: string,
  history: AssistantHistoryMessage[],
  task: AssistantTask = 'auto',
  network: AssistantNetwork = 'auto',
  signal?: AbortSignal,
  model?: string,
): Promise<AssistantAnswer> {
  const response = await fetch('/api/desk/assistant/query', {
    method: 'POST',
    credentials: 'include',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Wyan-Assistant-Client': assistantClientID() },
    body: JSON.stringify({ question, history, task, network, ...(model ? { model } : {}) }),
    signal,
  });
  if (!response.ok || !isJSON(response)) throw await assistantError(response, '助手暂时无法回答，请稍后重试');
  return readAnswer(await response.json());
}

export async function submitAssistantFeedback(
  requestId: string,
  outcome: AssistantFeedbackOutcome,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/desk/assistant/feedback', {
    method: 'POST',
    credentials: 'include',
    redirect: 'manual',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-Wyan-Assistant-Client': assistantClientID() },
    body: JSON.stringify({ requestId, outcome }),
    signal,
  });
  if (!response.ok) throw await assistantError(response, '暂时无法记录反馈，请稍后重试');
}

const nonPublicWebSuffixes = ['.local', '.localhost', '.internal', '.lan', '.home', '.home.arpa', '.test', '.invalid', '.example', '.onion'];

function isPublicWebHostname(value: string): boolean {
  const hostname = value.toLowerCase().replace(/\.$/, '');
  if (!hostname.includes('.') || hostname.includes(':')) return false;
  if (/^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) return false;
  if (hostname.split('.').every((label) => /^\d+$/.test(label) || /^0x[\da-f]+$/i.test(label))) return false;
  return !nonPublicWebSuffixes.some((suffix) => hostname.endsWith(suffix));
}

export function safeAssistantSourceURL(value: string, kind = ''): string | null {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:') return null;
    if (parsed.username || parsed.password) return null;
    const hostname = parsed.hostname.toLowerCase();
    const wyanhubSource = hostname === 'wyanhub.com' || hostname.endsWith('.wyanhub.com');
    if (kind !== 'web' && !wyanhubSource) return null;
    if (kind === 'web' && !isPublicWebHostname(hostname)) return null;
    return parsed.href;
  } catch {
    return null;
  }
}
