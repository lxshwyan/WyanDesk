type UsageEvent = { eventType: 'page_view' | 'click' | 'engagement'; pageId: string; actionId?: string; durationMs?: number };

export function installUsageAnalytics() {
  const send = (event: UsageEvent) => { void fetch('/api/analytics/events', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WyanHub-Event': '1' }, credentials: 'same-origin', cache: 'no-store', keepalive: true, body: JSON.stringify({ applicationId: 'desk', ...event }) }).catch(() => undefined); };
  let startedAt: number | null = document.visibilityState === 'visible' ? performance.now() : null;
  const flush = () => { if (startedAt === null) return; const durationMs = Math.min(1800000, Math.round(performance.now() - startedAt)); startedAt = null; if (durationMs >= 1000) send({ eventType: 'engagement', pageId: 'home', durationMs }); };
  send({ eventType: 'page_view', pageId: 'home' }); window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); else if (startedAt === null) startedAt = performance.now(); });
  document.addEventListener('click', (event) => { const target = (event.target as Element | null)?.closest<HTMLElement>('[data-analytics-id],button[id],a[id]'); const actionId = target?.dataset.analyticsId || target?.id || ''; if (actionId && actionId.length <= 80 && !/[a-z0-9]{12,}/i.test(actionId) && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(actionId)) send({ eventType: 'click', pageId: 'home', actionId }); });
}
