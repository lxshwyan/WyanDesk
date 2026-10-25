import { afterEach, describe, expect, it, vi } from 'vitest';
import { loginExtension, readExtensionCredential } from './extensionAuth';

function mockAuthorization(changeCallback?: (callback: URL) => void, failStorage = false) {
  const redirectURI = 'https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/wyandesk-sync';
  const storage = { get: vi.fn(), set: failStorage ? vi.fn().mockRejectedValue(new Error('storage unavailable')) : vi.fn(), remove: vi.fn() };
  vi.stubGlobal('location', { protocol: 'chrome-extension:' });
  vi.stubGlobal('chrome', {
    storage: { local: storage },
    identity: {
      getRedirectURL: () => redirectURI,
      launchWebAuthFlow: vi.fn(async ({ url }: { url: string }) => {
        const callback = new URL(redirectURI);
        callback.searchParams.set('code', 'wydc_one-time-code');
        callback.searchParams.set('state', new URL(url).searchParams.get('state') ?? '');
        changeCallback?.(callback);
        return callback.toString();
      }),
    },
  });
  return storage;
}

describe('extension account authorization', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the browser identity flow, verifies state, and stores the scoped token', async () => {
    const values = new Map<string, unknown>();
    const storage = {
      get: vi.fn(async (key: string) => ({ [key]: values.get(key) })),
      set: vi.fn(async (items: Record<string, unknown>) => { for (const [key, value] of Object.entries(items)) values.set(key, value); }),
      remove: vi.fn(async (key: string) => { values.delete(key); }),
    };
    const redirectURI = 'https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/wyandesk-sync';
    const launchWebAuthFlow = vi.fn(async ({ url }: { url: string }) => {
      const authorize = new URL(url);
      expect(authorize.origin).toBe('https://wyanhub.com');
      expect(authorize.searchParams.get('redirect_uri')).toBe(redirectURI);
      expect(authorize.searchParams.get('code_challenge_method')).toBe('S256');
      const callback = new URL(redirectURI);
      callback.searchParams.set('code', 'wydc_one-time-code');
      callback.searchParams.set('state', authorize.searchParams.get('state') ?? '');
      return callback.toString();
    });
    vi.stubGlobal('location', { protocol: 'chrome-extension:' });
    vi.stubGlobal('chrome', {
      storage: { local: storage },
      identity: { getRedirectURL: () => redirectURI, launchWebAuthFlow },
    });
    const request = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      accessToken: 'wyandesk_access-token',
      tokenType: 'Bearer',
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      user: { workspaceId: 'wyanhub', userId: 'user-1', userName: 'Alice' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } }));
    vi.stubGlobal('fetch', request);

    await expect(loginExtension()).resolves.toEqual({ workspaceId: 'wyanhub', userId: 'user-1', userName: 'Alice' });
    await expect(readExtensionCredential()).resolves.toMatchObject({ accessToken: 'wyandesk_access-token' });
    expect(launchWebAuthFlow).toHaveBeenCalledWith(expect.objectContaining({ interactive: true }));
    expect(request).toHaveBeenCalledWith('https://wyanhub.com/api/desk-extension/token', expect.objectContaining({ method: 'POST' }));
  });

  it('turns a closed identity window into a clear cancellation message', async () => {
    vi.stubGlobal('location', { protocol: 'chrome-extension:' });
    vi.stubGlobal('chrome', {
      storage: { local: { get: vi.fn(), set: vi.fn(), remove: vi.fn() } },
      identity: {
        getRedirectURL: vi.fn().mockReturnValue('https://abcdefghijklmnopabcdefghijklmnop.chromiumapp.org/wyandesk-sync'),
        launchWebAuthFlow: vi.fn().mockRejectedValue(new Error('The user did not approve access.')),
      },
    });

    await expect(loginExtension()).rejects.toThrow('登录已取消');
  });

  it.each(['state', 'origin', 'path'])('rejects a mismatched callback %s before exchanging the code', async (part) => {
    mockAuthorization((callback) => {
      if (part === 'state') callback.searchParams.set('state', 'unexpected');
      if (part === 'origin') callback.hostname = 'evil.example';
      if (part === 'path') callback.pathname = '/other';
    });
    const request = vi.fn();
    vi.stubGlobal('fetch', request);
    await expect(loginExtension()).rejects.toThrow('登录回调校验失败');
    expect(request).not.toHaveBeenCalled();
  });

  it('explains a token exchange connection failure without saving a credential', async () => {
    const storage = mockAuthorization();
    const request = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    vi.stubGlobal('fetch', request);
    await expect(loginExtension()).rejects.toThrow('授权已返回，但未能连接登录服务');
    expect(storage.set).not.toHaveBeenCalled();
    expect(request).toHaveBeenCalledWith('https://wyanhub.com/api/desk-extension/token', expect.objectContaining({ credentials: 'omit', signal: expect.any(AbortSignal) }));
  });

  it('explains a failure to persist the authorized credential', async () => {
    mockAuthorization(undefined, true);
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({
      accessToken: 'wyandesk_access-token',
      expiresAt: new Date(Date.now() + 60_000 * 60).toISOString(),
      user: { workspaceId: 'wyanhub', userId: 'user-1', userName: 'Alice' },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } })));
    await expect(loginExtension()).rejects.toThrow('未能保存登录状态');
  });
});
