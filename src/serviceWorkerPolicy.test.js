import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

const source = readFileSync(new URL('../public/sw.js', import.meta.url), 'utf8');

function createWorker(fetchImplementation, matchImplementation = vi.fn()) {
  const listeners = {};
  const cache = { addAll: vi.fn(), put: vi.fn() };
  const caches = {
    keys: vi.fn(async () => []),
    delete: vi.fn(),
    open: vi.fn(async () => cache),
    match: matchImplementation,
  };
  const self = {
    location: { origin: 'https://desk.test' },
    clients: { claim: vi.fn() },
    skipWaiting: vi.fn(),
    addEventListener: (type, listener) => { listeners[type] = listener; },
  };
  vm.runInNewContext(source, { URL, Response, caches, fetch: fetchImplementation, self });
  return { caches, listeners };
}

describe('service worker routing', () => {
  it('leaves same-origin API requests to the network instead of the app-shell cache', () => {
    const { listeners } = createWorker(vi.fn());
    const respondWith = vi.fn();
    listeners.fetch({
      request: { method: 'GET', mode: 'cors', url: 'https://desk.test/api/desk/me' },
      respondWith,
    });
    expect(respondWith).not.toHaveBeenCalled();
  });

  it('uses the app shell only for failed navigation requests', async () => {
    const shell = new Response('<!doctype html>');
    const match = vi.fn(async (request) => request === '/index.html' ? shell : undefined);
    const { listeners } = createWorker(vi.fn(async () => { throw new Error('offline'); }), match);
    const respondWith = vi.fn();
    const request = { method: 'GET', mode: 'navigate', url: 'https://desk.test/work' };
    listeners.fetch({ request, respondWith });

    await expect(respondWith.mock.calls[0][0]).resolves.toBe(shell);
    expect(match).toHaveBeenNthCalledWith(1, request);
    expect(match).toHaveBeenNthCalledWith(2, '/index.html');
  });

  it('does not return HTML for a failed non-navigation asset request', async () => {
    const match = vi.fn(async () => undefined);
    const { listeners } = createWorker(vi.fn(async () => { throw new Error('offline'); }), match);
    const respondWith = vi.fn();
    const request = { method: 'GET', mode: 'cors', url: 'https://desk.test/assets/missing.js' };
    listeners.fetch({ request, respondWith });

    const response = await respondWith.mock.calls[0][0];
    expect(response.type).toBe('error');
    expect(match).toHaveBeenCalledTimes(1);
    expect(match).toHaveBeenCalledWith(request);
  });
});
