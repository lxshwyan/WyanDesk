import { useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from 'react';
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronDown,
  CircleCheck,
  Compass,
  Copy,
  CornerDownLeft,
  ExternalLink,
  Globe2,
  LayoutGrid,
  LifeBuoy,
  Lightbulb,
  LogIn,
  MessageCircle,
  MessageSquareWarning,
  Monitor,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  Square,
  ThumbsUp,
  Trash2,
  Wrench,
  X,
} from 'lucide-react';
import {
  AssistantRequestError,
  fetchAssistantConfig,
  queryAssistant,
  safeAssistantSourceURL,
  submitAssistantFeedback,
  type AssistantAnswer,
  type AssistantConfig,
  type AssistantFeedbackOutcome,
  type AssistantHistoryMessage,
  type AssistantNetwork,
  type AssistantQuota,
  type AssistantScope,
  type AssistantTask,
} from '../lib/assistant';
import { ManagedLayer } from './ManagedLayer';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  scope: AssistantScope;
  answer?: AssistantAnswer;
}

export interface AssistantAnalysisItem {
  label: string;
  value: string;
}

interface AssistantPanelProps {
  open: boolean;
  signedIn: boolean;
  userName?: string;
  onClose: () => void;
  onLogin: () => void;
  onOpenFeedback?: () => void;
  onNotify?: (message: string, undo?: () => void) => void;
}

const scopeDetails: Record<AssistantScope, {
  title: string;
  emptyTitle: string;
  emptyCopy: string;
  placeholder: string;
  thinking: string;
}> = {
  guide: {
    title: 'WyanHub 指南',
    emptyTitle: '从一个具体目标开始',
    emptyCopy: '查询桌面操作、产品功能、工作流和百余项工具，并获得可核对的 WyanHub 来源。',
    placeholder: '例如：怎么导入书签？',
    thinking: '正在查找已核对资料并组织回答',
  },
  general: {
    title: '通用助手',
    emptyTitle: '处理一个日常问题',
    emptyCopy: '可以解释、写作、翻译、整理和拆分任务；涉及当前信息时请切换到联网模式。',
    placeholder: '例如：帮我整理一份周计划',
    thinking: '正在组织通用回答',
  },
  web: {
    title: '联网搜索',
    emptyTitle: '搜索需要当前信息的问题',
    emptyCopy: '适合天气、新闻、价格、政策等时效问题；回答会列出外部网页来源供你核对。',
    placeholder: '例如：搜索今天的科技新闻',
    thinking: '正在联网搜索并核对来源',
  },
};

function messageID(): string {
  return crypto.randomUUID();
}

function truncateHistory(value: string): string {
  return Array.from(value).slice(0, 1200).join('');
}

function requestHistory(messages: ConversationMessage[], question: string): AssistantHistoryMessage[] {
  const items = messages.at(-1)?.role === 'user' && messages.at(-1)?.content === question
    ? messages.slice(0, -1)
    : messages;
  return items.slice(-6).map((item) => ({ role: item.role, content: truncateHistory(item.content) }));
}

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === 'AbortError';
}

function applyQuota(config: AssistantConfig, quota: AssistantQuota): AssistantConfig {
  if (!quota.exhausted && (quota.authenticated || quota.anonymousReady)) return { ...config, quota };
  return {
    ...config,
    quota,
    tasks: config.tasks.map((item) => ({ ...item, enabled: item.id === 'auto' ? item.enabled : false })),
    networks: config.networks.map((item) => ({ ...item, enabled: item.id === 'off' ? item.enabled : false })),
  };
}

function ScopeIcon({ scope }: { scope: AssistantScope }) {
  if (scope === 'web') return <Globe2 aria-hidden="true" />;
  if (scope === 'general') return <MessageCircle aria-hidden="true" />;
  return <BookOpen aria-hidden="true" />;
}

function SuggestionIcon({ groupID }: { groupID: string }) {
  if (groupID === 'desktop') return <Monitor aria-hidden="true" />;
  if (groupID === 'products') return <LayoutGrid aria-hidden="true" />;
  if (groupID === 'tools') return <Wrench aria-hidden="true" />;
  if (groupID === 'daily') return <Lightbulb aria-hidden="true" />;
  if (groupID === 'web') return <Search aria-hidden="true" />;
  return <Compass aria-hidden="true" />;
}

const taskLabels: Record<AssistantTask, string> = {
  auto: '自动匹配',
  fast: '快速回答',
  standard: '标准回答',
  deep: '深度分析',
  coding: '编程辅助',
};

const networkLabels: Record<AssistantNetwork, string> = {
  auto: '需要时联网',
  off: '不联网',
  on: '每次先联网',
};

const taskDescriptions: Record<AssistantTask, string> = {
  auto: '按问题自动匹配产品知识、速度和回答方式',
  fast: '优先使用低延迟回答，适合简单问题',
  standard: '兼顾回答速度与质量',
  deep: '适合复杂分析和多步问题',
  coding: '适合编程解释、调试与方案设计',
};

const networkDescriptions: Record<AssistantNetwork, string> = {
  auto: '遇到时效问题才查询外部网页',
  off: '本次不查询外部网页',
  on: '每次都先查询外部网页再回答',
};

export function describeAssistantAnalysis(answer: AssistantAnswer): AssistantAnalysisItem[] {
  const routeLabels: Record<AssistantScope, string> = {
    guide: 'WyanHub 产品知识',
    general: '通用知识回答',
    web: '联网信息检索',
  };
  const items: AssistantAnalysisItem[] = [
    { label: '信息来源', value: routeLabels[answer.scope] },
    { label: '回答方式', value: taskLabels[answer.task || 'auto'] },
    { label: '联网情况', value: answer.scope === 'web' ? '已联网检索' : '本次未联网' },
  ];
  if (answer.sources.length > 0) items.push({ label: '参考来源', value: `${answer.sources.length} 条` });
  items.push({ label: '消耗额度', value: answer.costPoints ? `${answer.costPoints} 点` : '未消耗点数' });
  return items;
}

export function describeAssistantPointCost(config: AssistantConfig | null, task: AssistantTask, network: AssistantNetwork): string {
  if (!config?.quotaWeights) return '额度按实际使用计算';
  const taskPoints = config.quotaWeights[task];
  const maximum = network === 'off' ? taskPoints : Math.max(taskPoints, config.quotaWeights.web);
  return `本次最多 ${maximum} 点`;
}

function assistantInline(value: string, keyPrefix: string, citationHref?: (index: number) => string | null): ReactNode[] {
  return value.split(/(\*\*[^*]+\*\*|`[^`]+`|\[\d+\])/g).filter(Boolean).map((part, index) => {
    const key = `${keyPrefix}-${index}`;
    if (part.startsWith('**') && part.endsWith('**')) return <strong key={key}>{part.slice(2, -2)}</strong>;
    if (part.startsWith('`') && part.endsWith('`')) return <code key={key}>{part.slice(1, -1)}</code>;
    const citation = part.match(/^\[(\d+)\]$/);
    if (citation && citationHref) {
      const citationIndex = Number(citation[1]);
      const href = citationHref(citationIndex);
      if (href) return <a key={key} className="assistant-citation" href={href} aria-label={`查看参考来源 ${citationIndex}`}>{part}</a>;
    }
    return <span key={key}>{part}</span>;
  });
}

export function AssistantAnswerContent({ content, sourceCount = 0, sourcePrefix = '' }: { content: string; sourceCount?: number; sourcePrefix?: string }) {
  const citationHref = (citationIndex: number) => citationIndex >= 1 && citationIndex <= sourceCount && sourcePrefix
    ? `#${sourcePrefix}-${citationIndex}`
    : null;
  const lines = content.replace(/\r/g, '').split('\n');
  const blocks: ReactNode[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index].trim();
    if (!line) {
      index += 1;
      continue;
    }
    const heading = line.match(/^#{1,3}\s+(.+)$/);
    if (heading) {
      blocks.push(<h4 key={`heading-${index}`}>{assistantInline(heading[1], `heading-${index}`, citationHref)}</h4>);
      index += 1;
      continue;
    }
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (ordered) {
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^\d+\.\s+(.+)$/);
        if (!match) break;
        items.push(<li key={`ordered-${index}`}>{assistantInline(match[1], `ordered-${index}`, citationHref)}</li>);
        index += 1;
      }
      blocks.push(<ol key={`ordered-list-${index}`}>{items}</ol>);
      continue;
    }
    const unordered = line.match(/^[-*]\s+(.+)$/);
    if (unordered) {
      const items: ReactNode[] = [];
      while (index < lines.length) {
        const match = lines[index].trim().match(/^[-*]\s+(.+)$/);
        if (!match) break;
        items.push(<li key={`unordered-${index}`}>{assistantInline(match[1], `unordered-${index}`, citationHref)}</li>);
        index += 1;
      }
      blocks.push(<ul key={`unordered-list-${index}`}>{items}</ul>);
      continue;
    }
    const paragraph: string[] = [];
    while (index < lines.length) {
      const candidate = lines[index].trim();
      if (!candidate || /^#{1,3}\s+/.test(candidate) || /^\d+\.\s+/.test(candidate) || /^[-*]\s+/.test(candidate)) break;
      paragraph.push(candidate);
      index += 1;
    }
    blocks.push(
      <p key={`paragraph-${index}`}>
        {paragraph.map((part, partIndex) => (
          <span key={`paragraph-${index}-${partIndex}`}>{partIndex > 0 && <br />}{assistantInline(part, `paragraph-${index}-${partIndex}`, citationHref)}</span>
        ))}
      </p>,
    );
  }
  return <div className="assistant-answer-body">{blocks}</div>;
}

export function AssistantPanel({ open, signedIn, userName, onClose, onLogin, onOpenFeedback, onNotify }: AssistantPanelProps) {
  const [config, setConfig] = useState<AssistantConfig | null>(null);
  const [configLoading, setConfigLoading] = useState(false);
  const [configError, setConfigError] = useState('');
  const [configAttempt, setConfigAttempt] = useState(0);
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [question, setQuestion] = useState('');
  const [selectedTask, setSelectedTask] = useState<AssistantTask>('auto');
  const [selectedNetwork, setSelectedNetwork] = useState<AssistantNetwork>('auto');
  const [selectedGroup, setSelectedGroup] = useState('recommended');
  const [sending, setSending] = useState(false);
  const [requestError, setRequestError] = useState('');
  const [lastFailedQuestion, setLastFailedQuestion] = useState('');
  const [lastFailedTask, setLastFailedTask] = useState<AssistantTask>('auto');
  const [lastFailedNetwork, setLastFailedNetwork] = useState<AssistantNetwork>('auto');
  const [feedbackByRequestID, setFeedbackByRequestID] = useState<Record<string, AssistantFeedbackOutcome | 'sending'>>({});
  const [copiedMessageID, setCopiedMessageID] = useState('');
  const configControllerRef = useRef<AbortController | null>(null);
  const queryControllerRef = useRef<AbortController | null>(null);
  const conversationRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const copyTimerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!open) {
      configControllerRef.current?.abort();
      queryControllerRef.current?.abort();
      setSending(false);
      return undefined;
    }

    let ignore = false;
    const controller = new AbortController();
    configControllerRef.current?.abort();
    configControllerRef.current = controller;
    setConfigLoading(true);
    setConfigError('');
    void fetchAssistantConfig(controller.signal)
      .then((value) => {
        if (ignore) return;
        const next = value.quota ? applyQuota(value, value.quota) : value;
        setConfig(next);
        setSelectedTask((current) => next.tasks.some((item) => item.id === current && item.enabled)
          ? current
          : (next.tasks.find((item) => item.enabled)?.id || 'auto'));
        setSelectedNetwork((current) => next.networks.some((item) => item.id === current && item.enabled)
          ? current
          : (next.networks.find((item) => item.enabled)?.id || 'off'));
        setSelectedGroup((current) => next.suggestionGroups.some((item) => item.id === current) ? current : 'recommended');
      })
      .catch((error: unknown) => {
        if (ignore || isAbortError(error)) return;
        setConfigError(error instanceof Error ? error.message : '暂时无法读取助手配置');
      })
      .finally(() => {
        if (!ignore) setConfigLoading(false);
      });

    return () => {
      ignore = true;
      controller.abort();
    };
  }, [configAttempt, open, signedIn]);

  useEffect(() => () => {
    queryControllerRef.current?.abort();
    if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
  }, []);

  useEffect(() => {
    if (!open || !config?.enabled || typeof window.matchMedia !== 'function' || !window.matchMedia('(hover: hover) and (pointer: fine)').matches) return undefined;
    const frame = window.requestAnimationFrame(() => textareaRef.current?.focus());
    return () => window.cancelAnimationFrame(frame);
  }, [config?.enabled, open]);

  useEffect(() => {
    if (!open) return;
    conversationRef.current?.scrollTo({ top: conversationRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, open, sending]);

  const availableGroups = useMemo(() => {
    if (!config) return [];
    const enabledScopes = new Set(config.capabilities.filter((item) => item.enabled).map((item) => item.id));
    return config.suggestionGroups.filter((group) => group.scope === 'guide' || enabledScopes.has(group.scope));
  }, [config]);

  if (!open) return null;

  const maxQuestionChars = config?.maxQuestionChars || 600;
  const questionLength = Array.from(question).length;
  const selectedTaskOption = config?.tasks.find((item) => item.id === selectedTask);
  const selectedNetworkOption = config?.networks.find((item) => item.id === selectedNetwork);
  const controlsEnabled = Boolean(selectedTaskOption?.enabled && selectedNetworkOption?.enabled);
  const canAsk = Boolean(config?.enabled && controlsEnabled && question.trim().length >= 2 && questionLength <= maxQuestionChars && !sending);
  const activeGroup = availableGroups.find((group) => group.id === selectedGroup) || availableGroups[0];
  const quota = config?.quota;
  const quotaLabel = quota?.limit === 0
    ? '个人额度不限'
    : quota ? `今日剩余 ${quota.remaining} 点` : '';
  const pointCostLabel = describeAssistantPointCost(config, selectedTask, selectedNetwork);
  const capabilityIssue = selectedTaskOption && !selectedTaskOption.enabled
    ? `${taskLabels[selectedTask]}尚未配置可用模型`
    : selectedNetworkOption && !selectedNetworkOption.enabled
      ? `${networkLabels[selectedNetwork]}尚未配置联网搜索服务`
      : '';

  const closePanel = () => {
    queryControllerRef.current?.abort();
    setSending(false);
    onClose();
  };

  const chooseGroup = (groupID: string) => {
    const group = availableGroups.find((item) => item.id === groupID);
    if (!group || sending) return;
    setSelectedGroup(group.id);
    if (group.scope === 'web' && config?.networks.some((item) => item.id === 'on' && item.enabled)) setSelectedNetwork('on');
    if (group.scope !== 'web' && selectedNetwork === 'on') {
      setSelectedNetwork(config?.networks.find((item) => item.enabled && item.id !== 'on')?.id || 'off');
    }
    setRequestError('');
  };

  const handleGroupKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const lastIndex = availableGroups.length - 1;
    const nextIndex = event.key === 'Home'
      ? 0
      : event.key === 'End'
        ? lastIndex
        : event.key === 'ArrowRight'
          ? (index + 1) % availableGroups.length
          : (index - 1 + availableGroups.length) % availableGroups.length;
    const next = availableGroups[nextIndex];
    if (!next) return;
    chooseGroup(next.id);
    const tabs = event.currentTarget.parentElement?.querySelectorAll<HTMLButtonElement>('[role="tab"]');
    tabs?.[nextIndex]?.focus();
  };

  const clearConversation = () => {
    const previousMessages = messages;
    const previousFeedback = feedbackByRequestID;
    setMessages([]);
    setFeedbackByRequestID({});
    setRequestError('');
    setLastFailedQuestion('');
    onNotify?.('已清空当前对话', () => {
      setMessages(previousMessages);
      setFeedbackByRequestID(previousFeedback);
    });
  };

  const copyAnswer = async (message: ConversationMessage) => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopiedMessageID(message.id);
      if (copyTimerRef.current !== null) window.clearTimeout(copyTimerRef.current);
      copyTimerRef.current = window.setTimeout(() => setCopiedMessageID(''), 1800);
      onNotify?.('回答已复制');
    } catch {
      onNotify?.('暂时无法复制，请手动选择回答');
    }
  };

  const continueConversation = () => {
    textareaRef.current?.focus();
    textareaRef.current?.scrollIntoView({ block: 'nearest' });
  };

  const recordAnswerFeedback = async (requestID: string, outcome: AssistantFeedbackOutcome) => {
    const previous = feedbackByRequestID[requestID];
    if (previous === 'sending' || previous === outcome) return;
    setFeedbackByRequestID((current) => ({ ...current, [requestID]: 'sending' }));
    try {
      await submitAssistantFeedback(requestID, outcome);
      setFeedbackByRequestID((current) => ({ ...current, [requestID]: outcome }));
      onNotify?.(outcome === 'helpful' ? '感谢反馈' : '已记录“未解决”，可继续追问或联系支持');
    } catch (error) {
      setFeedbackByRequestID((current) => {
        const next = { ...current };
        if (previous) next[requestID] = previous;
        else delete next[requestID];
        return next;
      });
      onNotify?.(error instanceof Error ? error.message : '暂时无法记录反馈');
    }
  };

  const sendQuestion = async (text: string, addUserMessage = true, task: AssistantTask = selectedTask, network: AssistantNetwork = selectedNetwork) => {
    const cleanQuestion = text.trim();
    const taskAvailable = config?.tasks.some((item) => item.id === task && item.enabled);
    const networkAvailable = config?.networks.some((item) => item.id === network && item.enabled);
    if (!config?.enabled || !taskAvailable || !networkAvailable || cleanQuestion.length < 2 || Array.from(cleanQuestion).length > maxQuestionChars || sending) return;
    const history = requestHistory(messages, cleanQuestion);
    if (addUserMessage) {
      setMessages((current) => [...current, { id: messageID(), role: 'user', content: cleanQuestion, scope: 'guide' }]);
    }
    setQuestion('');
    setSending(true);
    setRequestError('');
    setLastFailedQuestion('');
    setLastFailedTask(task);
    setLastFailedNetwork(network);
    const controller = new AbortController();
    queryControllerRef.current?.abort();
    queryControllerRef.current = controller;
    try {
      const answer = await queryAssistant(
        cleanQuestion,
        history,
        task,
        network,
        controller.signal,
      );
      setMessages((current) => [...current, { id: messageID(), role: 'assistant', content: answer.answer, answer, scope: answer.scope }]);
      if (answer.quota) {
        setConfig((current) => current ? applyQuota(current, answer.quota as AssistantQuota) : current);
        if (answer.quota.exhausted) {
          setSelectedTask('auto');
          setSelectedNetwork('off');
        }
      }
    } catch (error) {
      setRequestError(isAbortError(error)
        ? '已取消这次提问，你可以直接重试。'
        : error instanceof AssistantRequestError
          ? error.message
          : '助手暂时无法回答，请稍后重试');
      const quotaError = error instanceof AssistantRequestError && ['login_required', 'anonymous_daily_limit_reached', 'anonymous_ip_daily_limit_reached', 'authenticated_daily_limit_reached', 'daily_limit_reached'].includes(error.code);
      if (error instanceof AssistantRequestError && error.quota) {
        const nextQuota = ['daily_limit_reached', 'anonymous_ip_daily_limit_reached'].includes(error.code)
          ? { ...error.quota, remaining: 0, exhausted: true }
          : error.quota;
        setConfig((current) => current ? applyQuota(current, nextQuota) : current);
      }
      if (quotaError && error instanceof AssistantRequestError && !error.quota) {
        setConfig((current) => current?.quota ? applyQuota(current, {
          ...current.quota,
          anonymousReady: error.code === 'login_required' ? false : current.quota.anonymousReady,
          remaining: 0,
          exhausted: true,
        }) : current);
        setSelectedTask('auto');
        setSelectedNetwork('off');
      }
      if (quotaError) {
        setSelectedTask('auto');
        setSelectedNetwork('off');
      }
      setLastFailedQuestion(quotaError ? '' : cleanQuestion);
    } finally {
      if (queryControllerRef.current === controller) queryControllerRef.current = null;
      setSending(false);
    }
  };

  const submitQuestion = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void sendQuestion(question);
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return;
    event.preventDefault();
    if (canAsk) void sendQuestion(question);
  };

  return (
    <ManagedLayer className="drawer-layer assistant-layer" onEscape={closePanel}>
      <button className="drawer-backdrop" type="button" onClick={closePanel} aria-label="关闭 WyanHub 助手" />
      <aside className="assistant-drawer" role="dialog" aria-modal="true" aria-labelledby="assistantTitle" aria-describedby="assistantScope">
        <header className="assistant-heading">
          <div className="assistant-brand">
            <span className="assistant-mark"><Sparkles aria-hidden="true" /></span>
            <span><h2 id="assistantTitle">WyanHub 助手</h2><p id="assistantScope">懂产品，也懂怎么操作</p></span>
          </div>
          <div className="assistant-heading-actions">
            {messages.length > 0 && (
              <button type="button" onClick={clearConversation} aria-label="清空当前对话" title="清空当前对话">
                <Trash2 aria-hidden="true" />
              </button>
            )}
            <button type="button" onClick={closePanel} aria-label="关闭"><X aria-hidden="true" /></button>
          </div>
        </header>

        <>
            <div className="assistant-context">
              <div className="assistant-service-state">
                <span className={`assistant-state-dot ${selectedNetwork === 'on' ? 'web' : 'guide'}${config?.mode === 'model' ? ' model' : ''}`} />
                <strong>{configLoading && !config ? '正在连接' : config?.enabled ? '助手可用' : config?.mode === 'disabled' ? '暂未开放' : '等待配置'}</strong>
                {quotaLabel && <small className="assistant-quota-label">{quotaLabel}</small>}
                <small className="assistant-user-label">{userName || '游客试用'}</small>
              </div>
              <details>
                <summary><ShieldCheck aria-hidden="true" />{selectedNetwork === 'on' ? '每次先联网，不读桌面' : selectedNetwork === 'off' ? '不联网，不读桌面' : '需要时联网，不读桌面'}</summary>
                <p>{config?.privacyNotice || '不会读取桌面卡片、云同步内容或其他业务数据。'}</p>
              </details>
            </div>

            <div ref={conversationRef} className="assistant-conversation" role="log" aria-live="polite" aria-relevant="additions text">
              {configLoading && !config ? (
                <div className="assistant-loading" role="status" aria-label="正在读取助手配置"><i /><i /><i /></div>
              ) : configError && !config ? (
                <div className="assistant-error-state" role="alert">
                  <h3>暂时无法连接助手</h3>
                  <p>{configError}</p>
                  <div>
                    <button type="button" onClick={() => setConfigAttempt((value) => value + 1)}><RefreshCw aria-hidden="true" />重新连接</button>
                    <button type="button" onClick={onLogin}><LogIn aria-hidden="true" />{signedIn ? '重新登录' : '登录 WyanHub'}</button>
                  </div>
                </div>
              ) : config && !config.enabled ? (
                <div className="assistant-error-state">
                  <h3>助手暂未开放</h3>
                  <p>本地桌面不受影响。管理员启用服务后，这里会自动显示可用能力。</p>
                </div>
              ) : messages.length === 0 ? (
                <div className="assistant-empty">
                  <div className="assistant-empty-intro">
                    <span className="assistant-empty-mark"><Sparkles aria-hidden="true" /></span>
                    <h3>今天想完成什么？</h3>
                    <p>查功能、学操作，或处理一个日常问题。助手会自动匹配产品知识、回答方式和可信网页来源。</p>
                  </div>
                  <div className="assistant-preset-tabs" role="tablist" aria-label="预置问题分类">
                    {availableGroups.map((group, groupIndex) => (
                      <button key={group.id} id={`assistant-group-${group.id}`} type="button" role="tab" className={activeGroup?.id === group.id ? 'active' : ''} onClick={() => chooseGroup(group.id)} onKeyDown={(event) => handleGroupKeyDown(event, groupIndex)} disabled={sending} aria-selected={activeGroup?.id === group.id} aria-controls="assistant-suggestion-panel" tabIndex={activeGroup?.id === group.id ? 0 : -1}>
                        {group.label}
                      </button>
                    ))}
                  </div>
                  <div id="assistant-suggestion-panel" className="assistant-suggestions" role="tabpanel" aria-labelledby={activeGroup ? `assistant-group-${activeGroup.id}` : undefined} aria-label={`${activeGroup?.label || '推荐'}问题`}>
                    {(activeGroup?.items || config?.suggestions || []).map((suggestion) => (
                      <button key={suggestion} type="button" onClick={() => void sendQuestion(suggestion)} disabled={sending}>
                        <span className="assistant-suggestion-icon"><SuggestionIcon groupID={activeGroup?.id || 'recommended'} /></span>
                        <span>{suggestion}</span>
                        <ArrowUpRight aria-hidden="true" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="assistant-messages">
                  {messages.map((message) => {
                    const sourcePrefix = `assistant-source-${message.id}`;
                    const feedbackState = message.answer ? feedbackByRequestID[message.answer.requestId] : undefined;
                    return (
                      <article key={message.id} className={`assistant-message ${message.role}`}>
                        {message.role === 'assistant' && <small className={`assistant-answer-scope ${message.scope}`}><ScopeIcon scope={message.scope} />{scopeDetails[message.scope].title}</small>}
                        {message.role === 'assistant'
                          ? <AssistantAnswerContent content={message.content} sourceCount={message.answer?.sources.length} sourcePrefix={sourcePrefix} />
                          : <p>{message.content}</p>}
                        {message.answer?.notice && <small className="assistant-notice">{message.answer.notice}</small>}
                        {message.answer && (
                          <details className="assistant-analysis">
                            <summary><span><CircleCheck aria-hidden="true" />回答依据</span><ChevronDown aria-hidden="true" /></summary>
                            <ul>
                              {describeAssistantAnalysis(message.answer).map((item) => (
                                <li key={item.label}><span>{item.label}</span><strong>{item.value}</strong></li>
                              ))}
                            </ul>
                            <p>这里只展示可核验的来源和处理信息，不展示模型内部思维。</p>
                          </details>
                        )}
                        {message.answer && message.answer.sources.length > 0 && (
                          <div className="assistant-sources" aria-label="回答来源">
                            <strong>{message.answer.scope === 'web' ? '联网来源' : '相关来源'}</strong>
                            {message.answer.sources.map((source, sourceIndex) => {
                              const safeURL = safeAssistantSourceURL(source.url, source.kind);
                              if (!safeURL) return null;
                              return (
                                <a key={source.id} id={`${sourcePrefix}-${sourceIndex + 1}`} href={safeURL} target="_blank" rel="noreferrer">
                                  <span className="assistant-source-number" aria-hidden="true">{sourceIndex + 1}</span>
                                  <span><b>{source.title}</b><small>{source.sourceLabel}</small></span>
                                  <ExternalLink aria-hidden="true" />
                                </a>
                              );
                            })}
                          </div>
                        )}
                        {message.answer && (
                          <div className="assistant-answer-actions" aria-label="回答操作">
                            <button type="button" onClick={() => void copyAnswer(message)}>
                              {copiedMessageID === message.id ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
                              {copiedMessageID === message.id ? '已复制' : '复制'}
                            </button>
                            <button type="button" onClick={continueConversation}><CornerDownLeft aria-hidden="true" />继续追问</button>
                            <button type="button" className={feedbackState === 'helpful' ? 'active' : ''} onClick={() => void recordAnswerFeedback(message.answer!.requestId, 'helpful')} disabled={feedbackState === 'sending'} aria-pressed={feedbackState === 'helpful'}>
                              <ThumbsUp aria-hidden="true" />有帮助
                            </button>
                            <button type="button" className={feedbackState === 'unresolved' ? 'active warning' : ''} onClick={() => void recordAnswerFeedback(message.answer!.requestId, 'unresolved')} disabled={feedbackState === 'sending'} aria-pressed={feedbackState === 'unresolved'}>
                              <MessageSquareWarning aria-hidden="true" />未解决
                            </button>
                            {feedbackState === 'unresolved' && onOpenFeedback && (
                              <button type="button" className="support" onClick={onOpenFeedback}><LifeBuoy aria-hidden="true" />联系支持</button>
                            )}
                          </div>
                        )}
                      </article>
                    );
                  })}
                  {sending && (
                    <div className="assistant-thinking" role="status">
                      <span className="assistant-thinking-mark"><Sparkles aria-hidden="true" /></span>
                      <span><strong>{selectedNetwork === 'on' ? '正在联网检索并核对来源' : selectedTask === 'deep' ? '正在进行深度分析' : '正在理解问题并组织回答'}</strong><small>{taskLabels[selectedTask]} · {networkLabels[selectedNetwork]}</small></span>
                      <span className="assistant-thinking-dots" aria-hidden="true"><i /><i /><i /></span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {(config?.enabled || configLoading) && (
              <form className="assistant-composer" onSubmit={submitQuestion}>
                {requestError && (
                  <div className="assistant-request-error" role="alert">
                    <span>{requestError}</span>
                    {lastFailedQuestion && !sending && <button type="button" onClick={() => void sendQuestion(lastFailedQuestion, false, lastFailedTask, lastFailedNetwork)}>重试</button>}
                  </div>
                )}
                {quota?.exhausted && (
                  <div className="assistant-quota-note" role="status">
                    <span>{quota.authenticated ? '今日智能额度已用完，仍可查询产品知识。' : '游客智能额度已用完，仍可查询产品知识。'}</span>
                    {!signedIn && <button type="button" onClick={onLogin}><LogIn aria-hidden="true" />登录获得更多额度</button>}
                  </div>
                )}
                {capabilityIssue && <p className="assistant-capability-note">{capabilityIssue}。</p>}
                <div className="assistant-compose-box">
                  <label className="sr-only" htmlFor="assistantQuestion">向 WyanHub 助手提问</label>
                  <textarea
                    ref={textareaRef}
                    id="assistantQuestion"
                    name="assistantQuestion"
                    autoComplete="off"
                    rows={2}
                    value={question}
                    onChange={(event) => setQuestion(Array.from(event.target.value).slice(0, maxQuestionChars).join(''))}
                    onKeyDown={handleComposerKeyDown}
                    placeholder={messages.length > 0 ? '继续追问，或补充你的要求' : activeGroup ? scopeDetails[activeGroup.scope].placeholder : '输入你想了解或完成的事情'}
                    disabled={!config?.enabled || !controlsEnabled || sending}
                  />
                  <div className="assistant-compose-toolbar">
                    <div className="assistant-compose-controls">
                      <label title={taskDescriptions[selectedTask]}>
                        <Sparkles aria-hidden="true" />
                        <select aria-label="回答方式" value={selectedTask} onChange={(event) => setSelectedTask(event.target.value as AssistantTask)} disabled={sending}>
                          {config?.tasks.map((item) => <option key={item.id} value={item.id} disabled={!item.enabled}>{taskLabels[item.id]}{item.enabled ? '' : '（未配置）'}</option>)}
                        </select>
                      </label>
                      <label title={networkDescriptions[selectedNetwork]}>
                        <Globe2 aria-hidden="true" />
                        <select aria-label="联网方式" value={selectedNetwork} onChange={(event) => setSelectedNetwork(event.target.value as AssistantNetwork)} disabled={sending}>
                          {config?.networks.map((item) => <option key={item.id} value={item.id} disabled={!item.enabled}>{networkLabels[item.id]}{item.enabled ? '' : '（未配置）'}</option>)}
                        </select>
                      </label>
                    </div>
                    {sending ? (
                      <button className="assistant-cancel-button" type="button" onClick={() => queryControllerRef.current?.abort()} aria-label="取消本次提问" title="取消本次提问"><Square aria-hidden="true" /></button>
                    ) : (
                      <button className="assistant-send-button" type="submit" disabled={!canAsk} aria-label="发送问题" title="发送问题"><Send aria-hidden="true" /></button>
                    )}
                  </div>
                </div>
                <div className="assistant-compose-meta">
                  <span title="直接命中产品知识时可能不消耗点数"><strong>{pointCostLabel}</strong><span className="assistant-shortcut-hint"> · Enter 发送 · Shift + Enter 换行</span></span>
                  <span className={questionLength > maxQuestionChars - 40 ? 'near-limit' : ''}>{questionLength}/{maxQuestionChars}</span>
                </div>
              </form>
            )}
          </>
      </aside>
    </ManagedLayer>
  );
}
