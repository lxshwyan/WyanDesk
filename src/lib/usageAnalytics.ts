type UsageEvent = { eventType: 'page_view' | 'click' | 'engagement' | 'conversion'; pageId?: string; actionId?: string; durationMs?: number };

const conversionEvent = 'wyan:desk-conversion';
const conversionIDs = new Set(['desktop_ready', 'capture_saved', 'sync_enabled']);

function sendUsageEvent(event: UsageEvent): void {
  void fetch('/api/analytics/events', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-WyanHub-Event': '1' }, credentials: 'same-origin', cache: 'no-store', keepalive: true, body: JSON.stringify({ applicationId: 'desk', ...event }) }).catch(() => undefined);
}

export function deskConversionAllowed(actionId: string): boolean {
  return conversionIDs.has(actionId);
}

export function trackUsageConversion(actionId: string): void {
  if (!deskConversionAllowed(actionId)) return;
  window.dispatchEvent(new CustomEvent(conversionEvent, { detail: { actionId } }));
}

export function installUsageAnalytics() {
  let startedAt: number | null = document.visibilityState === 'visible' ? performance.now() : null;
  const flush = () => { if (startedAt === null) return; const durationMs = Math.min(1800000, Math.round(performance.now() - startedAt)); startedAt = null; if (durationMs >= 1000) sendUsageEvent({ eventType: 'engagement', pageId: 'home', durationMs }); };
  sendUsageEvent({ eventType: 'page_view', pageId: 'home' });
  try {
    if (!window.sessionStorage.getItem('wyan.desk.analytics.ready')) {
      window.sessionStorage.setItem('wyan.desk.analytics.ready', '1');
      sendUsageEvent({ eventType: 'conversion', actionId: 'desktop_ready' });
    }
  } catch { /* Session deduplication is optional. */ }
  window.addEventListener(conversionEvent, (event) => {
    const actionId = (event as CustomEvent<{ actionId?: unknown }>).detail?.actionId;
    if (typeof actionId === 'string' && deskConversionAllowed(actionId)) sendUsageEvent({ eventType: 'conversion', actionId });
  });
  window.addEventListener('pagehide', flush);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') flush(); else if (startedAt === null) startedAt = performance.now(); });
  document.addEventListener('click', (event) => { const target = (event.target as Element | null)?.closest<HTMLElement>('[data-analytics-id],button[id],a[id]'); const actionId = target?.dataset.analyticsId || target?.id || ''; if (actionId && actionId.length <= 80 && !/[a-z0-9]{12,}/i.test(actionId) && /^[a-zA-Z0-9][a-zA-Z0-9._:/-]*$/.test(actionId)) sendUsageEvent({ eventType: 'click', pageId: 'home', actionId }); });
}
