import { describe, expect, it, vi } from 'vitest';
import { probeWebsite, probeWebsites } from './siteAvailability';

describe('website availability probes', () => {
  it('reports a completed browser request as reachable', async () => {
    const fetcher = vi.fn(async () => new Response(null, { status: 204 })) as typeof fetch;
    await expect(probeWebsite('https://example.com', { fetcher })).resolves.toBe('reachable');
    expect(fetcher).toHaveBeenCalledWith('https://example.com/', expect.objectContaining({ mode: 'no-cors', credentials: 'omit' }));
  });

  it('reports invalid and failed requests as unreachable', async () => {
    const fetcher = vi.fn(async () => { throw new Error('offline'); }) as typeof fetch;
    await expect(probeWebsite('not-a-url', { fetcher })).resolves.toBe('unreachable');
    await expect(probeWebsite('https://offline.example', { fetcher })).resolves.toBe('unreachable');
  });

  it('limits concurrent checks and reports every result', async () => {
    let active = 0;
    let peak = 0;
    const fetcher = vi.fn(async () => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 2));
      active -= 1;
      return new Response(null, { status: 204 });
    }) as typeof fetch;
    const progress: string[] = [];
    await probeWebsites(
      Array.from({ length: 6 }, (_, index) => ({ id: String(index), url: `https://${index}.example.com` })),
      ({ id }) => progress.push(id),
      { fetcher, concurrency: 2 },
    );
    expect(peak).toBe(2);
    expect(progress).toHaveLength(6);
  });
});
