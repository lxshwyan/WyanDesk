export type WebsiteAvailability = 'reachable' | 'unreachable' | 'cancelled';

interface ProbeOptions {
  fetcher?: typeof fetch;
  signal?: AbortSignal;
  timeoutMs?: number;
}

export interface WebsiteProbeTarget {
  id: string;
  url: string;
}

export interface WebsiteProbeProgress {
  id: string;
  result: Exclude<WebsiteAvailability, 'cancelled'>;
  completed: number;
  total: number;
}

export async function probeWebsite(url: string, options: ProbeOptions = {}): Promise<WebsiteAvailability> {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return 'unreachable';
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) return 'unreachable';
  if (options.signal?.aborted) return 'cancelled';

  const controller = new AbortController();
  let timedOut = false;
  const abortFromParent = () => controller.abort();
  options.signal?.addEventListener('abort', abortFromParent, { once: true });
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, options.timeoutMs ?? 7000);

  try {
    await (options.fetcher ?? fetch)(parsed.toString(), {
      method: 'GET',
      mode: 'no-cors',
      cache: 'no-store',
      credentials: 'omit',
      redirect: 'follow',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    controller.abort();
    return 'reachable';
  } catch {
    if (options.signal?.aborted && !timedOut) return 'cancelled';
    return 'unreachable';
  } finally {
    clearTimeout(timer);
    options.signal?.removeEventListener('abort', abortFromParent);
  }
}

export async function probeWebsites(
  targets: WebsiteProbeTarget[],
  onProgress: (progress: WebsiteProbeProgress) => void,
  options: ProbeOptions & { concurrency?: number } = {},
): Promise<void> {
  if (!targets.length || options.signal?.aborted) return;
  const concurrency = Math.max(1, Math.min(options.concurrency ?? 4, targets.length));
  let cursor = 0;
  let completed = 0;

  async function worker() {
    while (!options.signal?.aborted) {
      const index = cursor;
      cursor += 1;
      if (index >= targets.length) return;
      const target = targets[index];
      const result = await probeWebsite(target.url, options);
      if (result === 'cancelled' || options.signal?.aborted) return;
      completed += 1;
      onProgress({ id: target.id, result, completed, total: targets.length });
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
}
